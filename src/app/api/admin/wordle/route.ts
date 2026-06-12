import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { wordleGames, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SUPPORTED_LOCALES } from "@/lib/utils/constants";
import { isAlphabeticWord, normalizeWord } from "@/lib/utils/wordle";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  return dbUser?.role === "ADMIN" ? dbUser : null;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const games = await db
      .select()
      .from(wordleGames)
      .orderBy(desc(wordleGames.createdAt));
    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to fetch wordle games:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { solution, language, noteToSolver, maxTries } = await req.json();

    if (!solution || !language) {
      return NextResponse.json(
        { error: "Word and Language are required" },
        { status: 400 },
      );
    }

    if (!SUPPORTED_LOCALES.includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    const normalizedSolution = normalizeWord(solution, language);

    if (!isAlphabeticWord(normalizedSolution)) {
      return NextResponse.json(
        { error: "Word must contain only letters." },
        { status: 400 },
      );
    }

    if (normalizedSolution.length < 3 || normalizedSolution.length > 12) {
      return NextResponse.json(
        { error: "Word must be between 3 and 12 letters." },
        { status: 400 },
      );
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const [game] = await db
      .insert(wordleGames)
      .values({
        solution: normalizedSolution,
        language,
        noteToSolver: noteToSolver?.trim() || null,
        wordLength: normalizedSolution.length,
        maxTries: maxTries || 6,
        isOfficial: true, // Created by admin is official
        expiresAt,
      })
      .returning();

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Failed to create admin wordle game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.delete(wordleGames).where(eq(wordleGames.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wordle game:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
