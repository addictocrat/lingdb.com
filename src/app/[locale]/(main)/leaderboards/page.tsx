import {
  getLeaderboardData,
  type LeaderboardUser,
} from "@/actions/leaderboard";
import LeaderboardHero from "@/components/leaderboards/LeaderboardHero";
import LeaderboardTable from "@/components/leaderboards/LeaderboardTable";
import { getTranslations } from "next-intl/server";
import { Trophy } from "lucide-react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { makeServerQueryClient } from "@/lib/tanstack/hydration";
import { qk } from "@/lib/tanstack/query-keys";

export default async function LeaderboardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("leaderboards");
  const data = await getLeaderboardData();
  const queryClient = makeServerQueryClient();
  queryClient.setQueryData(qk.leaderboard.all, data);

  const mostWords = data.topPerformers.mostWords
    ? {
        username: data.topPerformers.mostWords.username,
        count: data.topPerformers.mostWords.totalWords,
      }
    : null;

  const mostQuizzes = data.topPerformers.mostQuizzes
    ? {
        username: data.topPerformers.mostQuizzes.username,
        count: data.topPerformers.mostQuizzes.totalQuizzes,
      }
    : null;

  const longestStreak = data.topPerformers.longestStreak
    ? {
        username: data.topPerformers.longestStreak.username,
        count: data.topPerformers.longestStreak.streakCount,
      }
    : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-4 mb-14">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {t("title")}
          </h1>
          <p className="text-lg text-[var(--fg)]/60 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                1
              </span>
              {t("top_performers")}
            </h2>
            <LeaderboardHero
              mostWords={mostWords}
              mostQuizzes={mostQuizzes}
              longestStreak={longestStreak}
            />
          </section>

          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                10
              </span>
              {t("top_10")}
            </h2>
            <LeaderboardTable
              top10={data.top10}
              currentUser={data.currentUser}
            />
          </section>
        </div>
      </div>
    </HydrationBoundary>
  );
}
