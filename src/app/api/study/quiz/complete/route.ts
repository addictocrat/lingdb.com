import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, quizHistory, activityLogs } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { calculateNewStreak } from '@/lib/streak';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      dictionaryId,
      score,
      totalQuestions,
      percentage,
      questionTypes,
      duration,
    } = await request.json();

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Wrap updates
    await db.transaction(async (tx) => {
      // 1. Insert quiz history
      await tx.insert(quizHistory).values({
        userId: dbUser.id,
        dictionaryId,
        score,
        totalQuestions,
        percentage,
        questionTypes,
        duration,
      });

      // Calculate new streak
      const newStreak = calculateNewStreak(dbUser.lastActiveDate, dbUser.streakCount);

      // 2. Update user totals
      await tx
        .update(users)
        .set({
          totalQuizzes: sql`${users.totalQuizzes} + 1`,
          streakCount: newStreak,
          lastActiveDate: new Date(),
        })
        .where(eq(users.id, dbUser.id));

      // 3. Append activity log
      await tx.insert(activityLogs).values({
        userId: dbUser.id,
        type: 'quiz',
        metadata: { dictionaryId, score, percentage },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz completion error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
