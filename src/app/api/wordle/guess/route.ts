import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { wordleGames } from "@/lib/db/schema";
import {
  evaluateWordleGuess,
  isAlphabeticWord,
  normalizeWord,
} from "@/lib/utils/wordle";

const guessSchema = z.object({
  gameId: z.string().uuid(),
  guess: z.string().min(3).max(12),
});

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const guessRateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const existing = guessRateLimitMap.get(clientKey);

  if (!existing || existing.resetAt < now) {
    guessRateLimitMap.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  guessRateLimitMap.set(clientKey, existing);
  return existing.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = guessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const game = await db.query.wordleGames.findFirst({
      columns: {
        id: true,
        solution: true,
        noteToSolver: true,
        wordLength: true,
        maxTries: true,
        language: true,
        expiresAt: true,
      },
      where: and(
        eq(wordleGames.id, parsed.data.gameId),
        or(
          isNull(wordleGames.expiresAt),
          gt(wordleGames.expiresAt, new Date()),
        ),
      ),
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const normalizedGuess = normalizeWord(parsed.data.guess, game.language);

    if (!isAlphabeticWord(normalizedGuess)) {
      return NextResponse.json(
        { error: "Guess must contain only letters." },
        { status: 400 },
      );
    }

    if (normalizedGuess.length !== game.wordLength) {
      return NextResponse.json(
        { error: `Guess must be exactly ${game.wordLength} letters.` },
        { status: 400 },
      );
    }

    const pattern = evaluateWordleGuess(game.solution, normalizedGuess);
    const isWin = normalizedGuess === game.solution;

    return NextResponse.json({
      guess: normalizedGuess,
      pattern,
      isWin,
      solverNote: isWin ? game.noteToSolver : null,
      wordLength: game.wordLength,
      maxTries: game.maxTries,
    });
  } catch (error) {
    console.error("Wordle guess route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
