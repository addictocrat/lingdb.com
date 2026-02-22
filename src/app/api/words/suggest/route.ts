import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Cache to store loaded word lists in memory to avoid reading from disk on every request
const wordListCache = new Map<string, string[]>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const lang = searchParams.get('lang') || 'en';

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  let wordList = wordListCache.get(lang);

  if (!wordList) {
    try {
      // Fetch directly from the Google Cloud URLs and cache in memory. 
      // This is safer than reading from the filesystem in Next.js production builds.
      const cloudMap: Record<string, string> = {
        en: 'englishWords.json',
        fr: 'frenchWords.json',
        de: 'germanWords.json',
        es: 'spanishWords.json',
        tr: 'turkishWords.json',
      };
      const fileName = cloudMap[lang] || cloudMap['en'];
      
      const response = await fetch(`https://storage.googleapis.com/lingdb/${fileName}`);
      if (response.ok) {
        wordList = await response.json();
        if (wordList) {
          wordListCache.set(lang, wordList);
        }
      } else {
        wordList = [];
      }
    } catch (error) {
      console.error(`Failed to load word list for language: ${lang}`, error);
      // Fallback to empty array
      wordList = [];
    }
  }

  // Find matches (limit to 8)
  const matches = [];
  if (wordList) {
    for (const word of wordList) {
      if (word.toLowerCase().startsWith(query)) {
        matches.push(word);
        if (matches.length >= 8) break;
      }
    }
  }

  return NextResponse.json({ suggestions: matches });
}
