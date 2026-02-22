import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, words, examplePhrases } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { openai } from '@/lib/openai/client';
import { z } from 'zod';

const generateSchema = z.object({
  wordId: z.string().uuid(),
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  tr: 'Turkish',
};

// POST /api/ai/generate-phrases — generate 3 example phrases via OpenAI
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (dbUser.aiCredits <= 0) {
    return NextResponse.json(
      { error: 'No AI credits remaining. Upgrade to Premium for more.' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const result = generateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: result.error.issues },
      { status: 400 }
    );
  }

  const word = await db.query.words.findFirst({
    where: eq(words.id, result.data.wordId),
    with: { dictionary: true },
  });

  if (!word) {
    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  }

  const existingPhrases = await db.query.examplePhrases.findMany({
    where: eq(examplePhrases.wordId, word.id),
  });

  if (existingPhrases.length >= 9) {
    return NextResponse.json(
      { error: 'Maximum 9 example phrases per word' },
      { status: 403 }
    );
  }

  const languageName = LANGUAGE_NAMES[word.dictionary.language] || 'English';
  const phrasesToGenerate = Math.min(3, 9 - existingPhrases.length);

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: `You are a language learning assistant. Generate exactly ${phrasesToGenerate} example sentences using the given word in ${languageName}. Each sentence should be beginner-friendly (A1-A2 level). Return a JSON array of objects with "phrase" (the sentence in ${languageName}) and "translation" (the English translation). Only return the JSON array, no other text.`,
        },
        {
          role: 'user',
          content: `Word: "${word.title}" (translation: "${word.translation}")`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || '[]';

    let phrases: { phrase: string; translation: string }[];
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      phrases = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json(
        { error: 'Invalid AI response. Please try again.' },
        { status: 500 }
      );
    }

    const savedPhrases = await db
      .insert(examplePhrases)
      .values(
        phrases.slice(0, phrasesToGenerate).map((p) => ({
          phrase: p.phrase,
          translation: p.translation,
          wordId: word.id,
          isAiGenerated: true,
        }))
      )
      .returning();

    await db
      .update(users)
      .set({ aiCredits: dbUser.aiCredits - 1 })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({
      phrases: savedPhrases,
      creditsRemaining: dbUser.aiCredits - 1,
    });
  } catch (err) {
    console.error('OpenAI API error:', err);
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
