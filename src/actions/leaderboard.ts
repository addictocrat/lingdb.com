"use server";

import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDbUser } from "@/lib/db/auth-helper";

export type LeaderboardUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  totalWords: number;
  totalQuizzes: number;
  streakCount: number;
  rank?: number;
};

export async function getLeaderboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (user) {
    try {
      dbUser = await getOrCreateDbUser(user);
    } catch (error) {
      console.error("Error getting/creating DB user in leaderboard:", error);
    }
  }

  // 1. Top user for Most Words
  const [mostWordsUser] = await db.query.users.findMany({
    orderBy: [desc(users.totalWords)],
    limit: 1,
  });

  // 2. Top user for Most Quizzes
  const [mostQuizzesUser] = await db.query.users.findMany({
    orderBy: [desc(users.totalQuizzes)],
    limit: 1,
  });

  // 3. Top user for Most Streak
  const [longestStreakUser] = await db.query.users.findMany({
    orderBy: [desc(users.streakCount)],
    limit: 1,
  });

  // 4. Top 10 users for total user words count
  const top10Users = await db.query.users.findMany({
    orderBy: [desc(users.totalWords)],
    limit: 10,
  });

  // 5. User's place in the leaderboard (if logged in and not in top 10)
  let userRankInfo = null;
  if (dbUser) {
    // Check if user is already in top 10
    const isInTop10 = top10Users.some((u) => u.id === dbUser!.id);

    // Always get the rank to be sure
    const [{ rank }] = await db
      .select({
        rank: sql<number>`count(*) + 1`,
      })
      .from(users)
      .where(sql`${users.totalWords} > ${dbUser.totalWords}`);

    userRankInfo = {
      user: {
        id: dbUser.id,
        username: dbUser.username,
        totalWords: dbUser.totalWords,
        totalQuizzes: dbUser.totalQuizzes,
        streakCount: dbUser.streakCount,
      },
      rank: Number(rank),
      isInTop10,
    };
  }

  return {
    topPerformers: {
      mostWords: mostWordsUser,
      mostQuizzes: mostQuizzesUser,
      longestStreak: longestStreakUser,
    },
    top10: top10Users,
    currentUser: userRankInfo,
  };
}
