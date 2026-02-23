'use client';

import { Trophy, Award, Zap, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface Performer {
  username: string;
  count: number;
}

interface LeaderboardHeroProps {
  mostWords: Performer | null;
  mostQuizzes: Performer | null;
  longestStreak: Performer | null;
}

export default function LeaderboardHero({ mostWords, mostQuizzes, longestStreak }: LeaderboardHeroProps) {
  const t = useTranslations('leaderboards');

  const categories = [
    {
      title: t('most_words'),
      desc: t('most_words_desc'),
      performer: mostWords,
      icon: Award,
      color: 'from-amber-400 to-orange-500',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      label: t('words'),
    },
    {
      title: t('most_quizzes'),
      desc: t('most_quizzes_desc'),
      performer: mostQuizzes,
      icon: Crown,
      color: 'from-blue-400 to-indigo-600',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: t('quizzes'),
    },
    {
      title: t('daily_streak'),
      desc: t('daily_streak_desc'),
      performer: longestStreak,
      icon: Zap,
      color: 'from-purple-400 to-pink-600',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      label: t('streak'),
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {categories.map((cat, i) => (
        <div
          key={i}
          className={cn(
            "relative overflow-hidden rounded-3xl border border-[var(--border-color)] p-6 transition-all hover:shadow-xl hover:scale-[1.02] text-slate-900",
            cat.bgColor
          )}
        >
          {/* Decorative Gradient Background */}
          <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 bg-gradient-to-br", cat.color)} />
          
          <div className="flex items-start justify-between">
            <div className={cn("rounded-2xl p-3 bg-white shadow-sm", cat.iconColor)}>
              <cat.icon className="h-8 w-8" />
            </div>
            {cat.performer && (
               <div className="flex flex-col items-end">
                  <span className="text-3xl font-black tracking-tight">{cat.performer.count}</span>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-60">{cat.label}</span>
               </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold">{cat.title}</h3>
            <p className="mt-1 text-sm opacity-70">{cat.desc}</p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {cat.performer ? (
              <>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/50 border border-black/5 font-bold shadow-sm">
                  {cat.performer.username[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold leading-none">{cat.performer.username}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-tighter opacity-70">1st Place</p>
                </div>
              </>
            ) : (
              <p className="text-sm font-medium italic opacity-40">No records yet</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
