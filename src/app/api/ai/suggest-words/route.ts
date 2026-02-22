import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const suggestSchema = z.object({
  dictionaryId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  language: z.string().min(2),
  sourceLanguage: z.string().min(2),
  existingWords: z.array(z.object({
    title: z.string(),
    translation: z.string(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = suggestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { title, description, language, sourceLanguage, existingWords } = result.data;

const wordListString = existingWords.map(w => `${w.title} (${w.translation})`).join(', ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful language learning assistant. Your task is to suggest 3 new vocabulary words that fit the SEMANTIC THEME of the user's dictionary.

Target Language: '${language}'
Source Language: '${sourceLanguage}'

Dictionary Context:
- Title: ${title}
- Description: ${description || 'No description'}
- Existing Vocabulary: ${wordListString}

CRITICAL INSTRUCTIONS:
1. SEMANTIC PRIORITY: Analyze the existing vocabulary words. Identify the dominant semantic theme or cluster (e.g., if there are words about "war", suggest more war words).
2. DOMINANCE RULE: The theme of the EXISTING WORDS is MORE IMPORTANT than the Title or Description. If the Title is random (like "qwerty") but the words are about "Cybersecurity", suggest "Cybersecurity" words.
3. UNIQUENESS: Suggested words MUST NOT be any of the existing words or their close synonyms.
4. FORMAT: Return ONLY a JSON array of 3 objects: {"word": "...", "translation": "..."}.
5. LANGUAGE: "word" must be in ${language}, "translation" must be in ${sourceLanguage}. Keep translations concise (1-2 words).

No markdown, no explanations.`
          },
          {
            role: 'user',
            content: `Analyze the theme of these words: ${wordListString}. Suggest 3 more related words for this dictionary in ${language}.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI suggestion error:', errorText);
      return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    let suggestions = [];
    try {
      const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      suggestions = JSON.parse(cleaned);
      if (Array.isArray(suggestions)) {
        suggestions = suggestions.map(s => ({ ...s, isAdded: false }));
      }
    } catch {
      suggestions = [];
    }

    if (suggestions.length > 0) {
      const { db } = await import('@/lib/db/client');
      const { dictionaries } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');

      await db
        .update(dictionaries)
        .set({ activeMagicWords: suggestions })
        .where(eq(dictionaries.id, result.data.dictionaryId));
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Magic words API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
