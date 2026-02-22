'use client';

import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { BookOpen, Layers, Brain, Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StatsGridProps {
  totalWords: number;
  totalFlashcards: number;
  totalQuizzes: number;
  streakCount: number;
}

interface StatItem {
  id: string;
  labelKey: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}

export default function StatsGrid({
  totalWords,
  totalFlashcards,
  totalQuizzes,
  streakCount,
}: StatsGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile');

  const stats: StatItem[] = useMemo(() => [
    {
      id: 'words',
      labelKey: 'saved_words',
      value: totalWords,
      icon: BookOpen,
      colorClass: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-400/10',
    },
    {
      id: 'flashcards',
      labelKey: 'flashcards_reviewed',
      value: totalFlashcards,
      icon: Layers,
      colorClass: 'text-purple-500 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-400/10',
    },
    {
      id: 'quizzes',
      labelKey: 'quizzes_completed',
      value: totalQuizzes,
      icon: Brain,
      colorClass: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
    },
    {
      id: 'streak',
      labelKey: 'day_streak',
      value: streakCount,
      icon: Flame,
      colorClass: 'text-orange-500 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-400/10',
    },
  ], [totalWords, totalFlashcards, totalQuizzes, streakCount]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate the cards staggering in - only once on mount
      gsap.fromTo('.stat-card', 
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []); // Run only on mount

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate the numbers counting up
      const numbers = document.querySelectorAll('.stat-number');
      numbers.forEach((el, index) => {
        const targetValue = stats[index].value;
        const currentVal = parseInt(el.innerHTML) || 0;
        const config = { val: currentVal };
        
        gsap.to(config, {
          val: targetValue,
          duration: 1.5,
          ease: 'power1.out',
          onUpdate: function () {
            if (el) {
              el.innerHTML = Math.floor(config.val).toString();
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [stats]);

  return (
    <div ref={containerRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="stat-card flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-shadow duration-300"
          >
            <div className={`rounded-xl p-3 ${stat.colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="stat-number text-3xl font-black text-[var(--fg)]">
                0
              </div>
              <div className="text-sm font-medium text-[var(--fg)]/60">
                {t(stat.labelKey)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
