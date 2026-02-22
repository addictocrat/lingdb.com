'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Word, ExamplePhrase } from '@/lib/db/schema';

interface FlashcardCardProps {
  word: Word & { examplePhrases: ExamplePhrase[] };
  isFlipped: boolean;
  onClick: () => void;
  direction: 'word-first' | 'translation-first';
}

export default function FlashcardCard({
  word,
  isFlipped,
  onClick,
  direction,
}: FlashcardCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      gsap.to(innerRef.current, {
        rotateY: isFlipped ? 180 : 0,
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }
  }, [isFlipped]);

  const frontContent = direction === 'word-first' ? word.title : word.translation;
  const backContent = direction === 'word-first' ? word.translation : word.title;

  return (
    <div
      className="relative mx-auto w-full max-w-2xl cursor-pointer"
      style={{ perspective: '1000px', height: '400px' }}
      onClick={onClick}
    >
      <div
        ref={innerRef}
        className="absolute inset-0 h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--border-color)] bg-[var(--surface)] p-8 shadow-xl"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h2 className="text-center text-5xl font-bold sm:text-6xl">
            {frontContent}
          </h2>
          <span className="mt-8 rounded-full bg-[var(--bg)] px-4 py-1.5 text-lg font-medium text-[var(--fg)]/50 shadow-sm">
            Click to flip
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary-500 bg-[var(--surface)] p-8 shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h2 className="mb-6 text-center text-4xl font-bold text-primary-500 sm:text-5xl">
            {backContent}
          </h2>

          {word.examplePhrases && word.examplePhrases.length > 0 && (
            <div className="mt-4 w-full space-y-3">
              <h3 className="text-center text-lg font-semibold uppercase tracking-wider text-[var(--fg)]/60">
                Examples
              </h3>
              <ul className="space-y-3 text-center text-lg sm:text-base">
                {word.examplePhrases.slice(0, 2).map((phrase) => (
                  <li key={phrase.id} className="text-[var(--fg)]/80">
                    <p className="font-medium">"{phrase.phrase}"</p>
                    <p className="mt-0.5 text-sm opacity-70 sm:text-lg">
                      {phrase.translation}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
