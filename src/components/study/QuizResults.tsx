'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { gsap } from 'gsap';
import Button from '@/components/ui/Button';
import { RotateCcw, ArrowRight } from 'lucide-react';
import type { Word } from '@/lib/db/schema';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  percentage: number;
  incorrectAnswers: { word: Word; userAnswer: string }[];
  onRetry: () => void;
  dictionaryId: string;
}

export default function QuizResults({
  score,
  totalQuestions,
  percentage,
  incorrectAnswers,
  onRetry,
  dictionaryId,
}: QuizResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.2)' }
      );
    });
    return () => ctx.revert();
  }, []);

  let resultColor = 'text-green-500';
  let message = 'Excellent Job!';
  if (percentage < 50) {
    resultColor = 'text-red-500';
    message = 'Keep Practice!';
  } else if (percentage < 80) {
    resultColor = 'text-yellow-500';
    message = 'Good Effort!';
  }

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-2xl text-center">
      <h2 className="mb-2 text-4xl font-bold sm:text-5xl">{message}</h2>
      <p className="mb-8 text-[var(--fg)]/60">Here is your final score:</p>

      <div className="mb-10 flex flex-col items-center justify-center">
        <div className={`text-7xl font-black ${resultColor} mb-2`}>
          {percentage}%
        </div>
        <p className="text-2xl font-medium">
          {score} / {totalQuestions} correct
        </p>
      </div>

      {incorrectAnswers.length > 0 && (
        <div className="mb-10 text-left">
          <h3 className="mb-4 text-xl font-semibold border-b border-[var(--border-color)] pb-2">
            Words to Review
          </h3>
          <ul className="space-y-4">
            {incorrectAnswers.map((item, idx) => (
              <li key={idx} className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-bold text-xl">{item.word.title}</span>
                    <span className="mx-2 text-[var(--fg)]/40">→</span>
                    <span className="font-medium">{item.word.translation}</span>
                  </div>
                  <div className="mt-2 text-lg text-[var(--fg)]/60 sm:mt-0">
                    You answered: <span className="text-red-500 font-medium">{item.userAnswer || '(blank)'}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="secondary" onClick={onRetry} className="flex-1 sm:flex-none">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={() => router.push(`/${locale}/dictionary/${dictionaryId}`)} className="flex-1 sm:flex-none">
          Back to Dictionary
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
