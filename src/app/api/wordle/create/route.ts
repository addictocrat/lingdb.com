import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { wordleGames } from "@/lib/db/schema";
import { APP_URL } from "@/lib/utils/constants";
import { isAlphabeticWord, normalizeWord } from "@/lib/utils/wordle";

const createWordleSchema = z.object({
  word: z.string().min(3).max(12),
  noteToSolver: z.string().max(500).optional(),
  maxTries: z.number().int().min(1).max(10).default(6),
  locale: z.string().min(2).max(10).optional().default("en"),
});

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const createRateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const existing = createRateLimitMap.get(clientKey);

  if (!existing || existing.resetAt < now) {
    createRateLimitMap.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  createRateLimitMap.set(clientKey, existing);
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
    const parsed = createWordleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const normalizedWord = normalizeWord(parsed.data.word);

    if (!isAlphabeticWord(normalizedWord)) {
      return NextResponse.json(
        { error: "Word must contain only letters A-Z." },
        { status: 400 },
      );
    }

    if (normalizedWord.length < 3 || normalizedWord.length > 12) {
      return NextResponse.json(
        { error: "Word must be between 3 and 12 letters." },
        { status: 400 },
      );
    }

    const noteToSolver = parsed.data.noteToSolver?.trim() || null;

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const [game] = await db
      .insert(wordleGames)
      .values({
        solution: normalizedWord,
        noteToSolver,
        wordLength: normalizedWord.length,
        maxTries: parsed.data.maxTries,
        expiresAt,
      })
      .returning({ id: wordleGames.id });

    const sharePath = `/${parsed.data.locale}/wordle/game/${game.id}`;

    return NextResponse.json(
      {
        gameId: game.id,
        sharePath,
        shareUrl: `${APP_URL}${sharePath}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Wordle create route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
