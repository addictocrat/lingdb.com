import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { examplePhrases, words, dictionaries, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const addPhraseSchema = z.object({
  wordId: z.string().uuid(),
  phrase: z.string().min(3, 'Phrase too short').max(500),
  translation: z.string().min(3, 'Translation too short').max(500),
});

// GET /api/example-phrases?wordId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wordId = searchParams.get('wordId');

  if (!wordId) {
    return NextResponse.json({ error: 'wordId is required' }, { status: 400 });
  }

  const phrases = await db.query.examplePhrases.findMany({
    where: eq(examplePhrases.wordId, wordId),
    orderBy: (ep, { asc }) => [asc(ep.createdAt)],
  });

  return NextResponse.json({ phrases });
}

// POST /api/example-phrases — add manual phrase
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

  const body = await request.json();
  const result = addPhraseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: result.error.issues },
      { status: 400 }
    );
  }

  // Verify word ownership
  const word = await db.query.words.findFirst({
    where: eq(words.id, result.data.wordId),
    with: { dictionary: true },
  });

  if (!word || word.dictionary.userId !== dbUser.id) {
    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  }

  // Check max 9 phrases
  const existing = await db.query.examplePhrases.findMany({
    where: eq(examplePhrases.wordId, word.id),
  });

  if (existing.length >= 9) {
    return NextResponse.json(
      { error: 'Maximum 9 example phrases per word' },
      { status: 403 }
    );
  }

  const [phrase] = await db
    .insert(examplePhrases)
    .values({
      phrase: result.data.phrase,
      translation: result.data.translation,
      wordId: word.id,
      isAiGenerated: false,
    })
    .returning();

  return NextResponse.json({ phrase }, { status: 201 });
}
