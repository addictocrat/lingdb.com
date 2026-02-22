import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, words, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const generateSeoSchema = z.object({
  dictionaryId: z.string().uuid(),
  force: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = generateSeoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { dictionaryId, force } = result.data;

    // Fetch dictionary with words
    const dict = await db.query.dictionaries.findFirst({
      where: eq(dictionaries.id, dictionaryId),
      with: {
        words: {
          orderBy: (w, { asc }) => [asc(w.order)],
          limit: 20,
          columns: { title: true, translation: true },
        },
      },
    });

    if (!dict) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    // Only generate if user is admin when force=true, or automatically when threshold hit
    if (force) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, user.id),
        columns: { role: true },
      });
      if (dbUser?.role !== 'ADMIN') {
        // For non-admin force requests, check ownership
        const ownerCheck = await db.query.users.findFirst({
          where: eq(users.supabaseId, user.id),
          columns: { id: true },
        });
        if (ownerCheck?.id !== dict.userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Check: don't regenerate if already done (unless force)
    if (dict.seoGeneratedAt && !force) {
      return NextResponse.json({
        seoTitle: dict.seoTitle,
        seoDescription: dict.seoDescription,
        message: 'SEO metadata already exists',
      });
    }

    // Check word count threshold
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(words)
      .where(eq(words.dictionaryId, dictionaryId));

    if (count < 5) {
      return NextResponse.json(
        { error: 'Dictionary needs at least 5 words for SEO generation' },
        { status: 400 }
      );
    }

    // Build word list for the prompt
    const wordListString = dict.words
      .map((w) => `${w.title} (${w.translation})`)
      .join(', ');

    const languageNames: Record<string, string> = {
      en: 'English',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
      tr: 'Turkish',
    };
    const langName = languageNames[dict.language] || dict.language;

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an SEO specialist for a language-learning platform called Lingdb. Your task is to generate SEO metadata for a vocabulary dictionary page.

CONTEXT:
- Dictionary title: "${dict.title}"
- Dictionary description: "${dict.description || 'No description'}"
- Language: ${langName}
- Words (${count} total, showing first ${dict.words.length}): ${wordListString}

INSTRUCTIONS:
1. Generate a "seoTitle" — a CTR-optimized, curiosity or benefit-driven headline. Examples:
   - "Seeing a Doctor in French: 10 Must-Know Words"
   - "Body and Health in French – Everything You Need"
   - "Essential ${langName} Travel Vocabulary: Your Complete Guide"
   The title should feel natural and engaging, like a blog post headline. Max 65 characters.

2. Generate a "seoDescription" — an HTML-formatted rich text block for search engines. Requirements:
   - Include one <h2> heading related to the theme
   - Use <strong> to highlight key terms
   - Include a short paragraph introducing the dictionary theme (2-3 sentences)
   - Include a bullet list of 5 featured words with their translations
   - Write naturally, as if a human blogger wrote it. You can include minor stylistic variation
   - Keep total length under 500 characters
   - Use plain HTML only (<h2>, <p>, <strong>, <ul>, <li>)

CRITICAL: Return ONLY valid JSON: {"seoTitle": "...", "seoDescription": "..."}
No markdown, no code fences, just the raw JSON object.`,
          },
          {
            role: 'user',
            content: `Generate SEO metadata for this ${langName} dictionary titled "${dict.title}" with words: ${wordListString}`,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI SEO generation error:', errorText);
      return NextResponse.json({ error: 'Failed to generate SEO metadata' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';

    let parsed: { seoTitle?: string; seoDescription?: string } = {};
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse OpenAI SEO response:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const seoTitle = parsed.seoTitle || null;
    const seoDescription = parsed.seoDescription || null;

    // Save to database
    await db
      .update(dictionaries)
      .set({
        seoTitle,
        seoDescription,
        seoGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dictionaries.id, dictionaryId));

    // Revalidate the English library page
    if (dict.slug) {
      revalidatePath(`/en/library/${dict.slug}`);
    }

    return NextResponse.json({ seoTitle, seoDescription, generated: true });
  } catch (error) {
    console.error('SEO generation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
