import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { wordleGames } from "@/lib/db/schema";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const parsed = paramsSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
    }

    const game = await db.query.wordleGames.findFirst({
      columns: {
        id: true,
        wordLength: true,
        maxTries: true,
        createdAt: true,
        expiresAt: true,
      },
      where: and(
        eq(wordleGames.id, parsed.data.id),
        or(
          isNull(wordleGames.expiresAt),
          gt(wordleGames.expiresAt, new Date()),
        ),
      ),
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Wordle game route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
