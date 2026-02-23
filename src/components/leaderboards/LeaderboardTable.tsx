'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Medal } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  totalWords: number;
  totalQuizzes: number;
  streakCount: number;
  rank?: number;
}

interface LeaderboardTableProps {
  top10: LeaderboardUser[];
  currentUser: {
    user: LeaderboardUser;
    rank: number;
    isInTop10: boolean;
  } | null;
}

export default function LeaderboardTable({ top10, currentUser }: LeaderboardTableProps) {
  const t = useTranslations('leaderboards');

  // If user is not in top 10, we'll append them to the list for the table view
  const displayUsers = [...top10];
  if (currentUser && !currentUser.isInTop10) {
    // Note: We might want a separator here or just show them at the bottom
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <Medal className="h-5 w-5 text-amber-500" />;
      case 2: return <Medal className="h-5 w-5 text-slate-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-700" />;
      default: return <span className="text-sm font-bold opacity-40"># {rank}</span>;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface)]/30 backdrop-blur-md shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border-color)] bg-[var(--surface)] text-sm font-bold uppercase tracking-wider text-[var(--fg)]/60">
            <tr>
              <th className="px-6 py-4">{t('rank')}</th>
              <th className="px-6 py-4">{t('user')}</th>
              <th className="px-6 py-4 text-right">{t('words')}</th>
              <th className="px-6 py-4 text-right hidden sm:table-cell">{t('quizzes')}</th>
              <th className="px-6 py-4 text-right hidden sm:table-cell">{t('streak')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {displayUsers.map((user, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser?.user?.id === user.id;
              
              return (
                <tr 
                  key={user.id} 
                  className={cn(
                    "transition-colors",
                    isCurrentUser ? "bg-primary-500/10 dark:bg-primary-500/5 font-semibold" : "hover:bg-[var(--surface)]/50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankBadge(rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-black shadow-sm",
                        isCurrentUser ? "bg-primary-500 text-white" : "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                      )}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {user.username}
                        {isCurrentUser && <span className="ml-2 text-[10px] font-black uppercase text-primary-500 tracking-tighter">({t('your_rank')})</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">{user.totalWords.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm hidden sm:table-cell">{user.totalQuizzes.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm hidden sm:table-cell">{user.streakCount.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* If current user is not in top 10, show a special row */}
      {currentUser && !currentUser.isInTop10 && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-primary-500/30 bg-primary-500/5 p-1 shadow-md">
           <table className="w-full text-left">
              <tbody className="font-semibold text-primary-700 dark:text-primary-400">
                <tr>
                  <td className="px-6 py-4 w-[15.5%] sm:w-[13.5%]">
                     <div className="flex items-center justify-center w-8">
                       <span className="text-sm font-black"># {currentUser.rank}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-primary-500/20">
                        {currentUser.user.username[0].toUpperCase()}
                      </div>
                      <span>
                        {currentUser.user.username}
                        <span className="ml-2 text-[10px] font-black uppercase tracking-tighter">({t('your_rank')})</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">{currentUser.user.totalWords.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm hidden sm:table-cell">{currentUser.user.totalQuizzes.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm hidden sm:table-cell">{currentUser.user.streakCount.toLocaleString()}</td>
                </tr>
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
}
