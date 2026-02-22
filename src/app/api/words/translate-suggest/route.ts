import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const suggestSchema = z.object({
  word: z.string().min(1).max(50),
  lang: z.string().min(2).max(10), // The language of the word (the dictionary language)
  targetLang: z.string().min(2).max(10), // The language to translate to (the user's UI language)
});

// Cache for suggestions to save OpenAI calls
const translationCache = new Map<string, string[]>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const lang = searchParams.get('lang') || 'en';
    const targetLang = searchParams.get('targetLang') || 'en';

    if (!word || word.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const cacheKey = `${lang}:${targetLang}:${word.toLowerCase()}`;
    if (translationCache.has(cacheKey)) {
      return NextResponse.json({ suggestions: translationCache.get(cacheKey) });
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: `You are a professional dictionary translator. Provide up to 3 single-word or short-phrase translations for the given word. The word is in the language '${lang}' and you must translate it to '${targetLang}'. Return ONLY a JSON array of strings, e.g., ["translation1", "translation2"]. No markdown formatting, no explanations.`
          },
          {
            role: 'user',
            content: `Translate: ${word}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '[]';
    
    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(content);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {
      suggestions = [];
    }

    // Update cache
    if (suggestions.length > 0) {
      translationCache.set(cacheKey, suggestions);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting translation:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
