import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, activityLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { User, ShieldCheck } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import StatsGrid from '@/components/profile/StatsGrid';
import StreakCalendar from '@/components/profile/StreakCalendar';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('profile');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get DB user
  const { getDbUser } = await import('@/lib/db/auth-helper');
  const dbUser = await getDbUser(user.id);
  
  if (!dbUser) {
    redirect(`/${locale}/login?error=db_sync_failed`);
  }

  // Fetch recent activity logs for the heatmap
  // Limits to last 1000 logs to prevent massive payloads, which should cover 6 months easily
  const logs = await db
    .select({
      createdAt: activityLogs.createdAt,
      type: activityLogs.type,
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, dbUser.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(1000);

  const memberSinceStr = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(dbUser.createdAt));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="mb-10 flex flex-col items-center gap-6 rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8 sm:flex-row sm:p-10">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-100 text-5xl font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
          {dbUser.username.charAt(0).toUpperCase()}
        </div>
        
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--fg)] sm:text-5xl">
            {dbUser.username}
          </h1>
          <p className="mt-2 text-[var(--fg)]/60">
            {t('member_since', { date: memberSinceStr })}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:ml-auto sm:mt-0 sm:items-end">
          <Badge
            variant={dbUser.tier === 'PREMIUM' ? 'default' : 'secondary'}
            className="flex items-center gap-1.5 px-4 py-1.5 text-lg"
          >
            {dbUser.tier === 'PREMIUM' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
            {dbUser.tier === 'PREMIUM' ? t('premium_member') : t('free_member')}
          </Badge>
          
          {dbUser.tier === 'FREE' && (
            <p className="text-lg font-medium text-[var(--fg)]/50">
              {dbUser.aiCredits} {t('ai_credits_left')}
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-10">
        <h2 className="mb-6 px-2 text-3xl font-bold tracking-tight text-[var(--fg)]">
          {t('your_progress')}
        </h2>
        <StatsGrid
          totalWords={dbUser.totalWords}
          totalFlashcards={dbUser.totalFlashcards}
          totalQuizzes={dbUser.totalQuizzes}
          streakCount={dbUser.streakCount}
        />
      </div>

      {/* React Calendar Heatmap */}
      <div>
        <StreakCalendar activityLogs={logs} />
      </div>
    </main>
  );
}
