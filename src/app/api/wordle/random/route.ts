import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { wordleGames, words, dictionaries } from "@/lib/db/schema";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") as SupportedLocale;

    if (!language || !SUPPORTED_LOCALES.includes(language)) {
      return NextResponse.json(
        { error: "Invalid or unsupported language parameter." },
        { status: 400 },
      );
    }

    // 1. Try to fetch a random existing game from the database for this language
    const existingGame = await db.query.wordleGames.findFirst({
      where: and(
        eq(wordleGames.language, language),
        eq(wordleGames.isOfficial, true),
        or(
          isNull(wordleGames.expiresAt),
          gt(wordleGames.expiresAt, new Date()),
        ),
      ),
      orderBy: sql`random()`,
    });

    if (existingGame) {
      return NextResponse.json({ gameId: existingGame.id });
    }

    // 2. If no game exists for this language, we fallback to selecting a random word
    // from any dictionary of that language in our database.
    const randomWords = await db
      .select({
        title: words.title,
      })
      .from(words)
      .innerJoin(dictionaries, eq(words.dictionaryId, dictionaries.id))
      .where(eq(dictionaries.language, language))
      .orderBy(sql`random()`)
      .limit(50); // Get up to 50 words and filter in JS to find a valid word

    let solutionWord = "";
    // Filter words to be 3-12 letters, only letters (alphabetic)
    const validWords = randomWords
      .map((w) => w.title.trim().toUpperCase())
      .filter((w) => w.length >= 3 && w.length <= 12 && /^[A-Z\u00C0-\u00FF]+$/i.test(w));

    if (validWords.length > 0) {
      solutionWord = validWords[Math.floor(Math.random() * validWords.length)];
    }

    // 3. Static fallback dictionary if there are no words in the database for this language
    if (!solutionWord) {
      const staticFallbacks: Record<SupportedLocale, string[]> = {
        en: ["REACT", "LEARN", "WORLD", "SMART", "WORDS", "CODING", "DESIGN", "GUITAR", "FUTURE", "PLANET"],
        tr: ["KİTAP", "DÜNYA", "SÖZLÜK", "AKILLI", "KALEM", "YAZILIM", "BİLGİ", "GELECEK", "ODAK", "SÜREÇ"],
        fr: ["LIVRE", "MONDE", "LANGUE", "SMART", "MOTS", "CLAVIER", "CAHIER", "PROJET", "TEMPS", "ECOLE"],
        de: ["BUCH", "WELT", "LERNEN", "WORT", "SPRACHE", "SCHULER", "FRAGE", "ANTWORT", "SPIEL", "KRAFT"],
        es: ["LIBRO", "MUNDO", "IDIOMA", "PALABRA", "APRENDER", "TIEMPO", "PENSAR", "TRABAJO", "NUEVO", "SABER"],
      };

      const fallbackList = staticFallbacks[language] || staticFallbacks.en;
      solutionWord = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    }

    // Create a new wordle game with the chosen solution word
    const noteToSolver = `Automatically generated random game in ${language.toUpperCase()}.`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days expiry

    const [newGame] = await db
      .insert(wordleGames)
      .values({
        solution: solutionWord,
        language,
        noteToSolver,
        wordLength: solutionWord.length,
        maxTries: 6,
        isOfficial: true,
        expiresAt,
      })
      .returning({ id: wordleGames.id });

    return NextResponse.json({ gameId: newGame.id });
  } catch (error) {
    console.error("Random Yordle game api route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
