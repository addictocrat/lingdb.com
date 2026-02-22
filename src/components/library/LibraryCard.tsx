'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, GitFork, Users } from 'lucide-react';

interface LibraryCardProps {
  dictionary: {
    id: string;
    title: string;
    description: string | null;
    language: string;
    userId: string;
    wordCount: number;
    forkCount: number;
    username: string | null;
    isShared?: boolean;
  };
  currentUserId?: string;
}

const languageFlags: Record<string, string> = {
  en: 'fi fi-gb',
  fr: 'fi fi-fr',
  de: 'fi fi-de',
  es: 'fi fi-es',
  tr: 'fi fi-tr',
};

export default function LibraryCard({ dictionary, currentUserId }: LibraryCardProps) {
  const locale = useLocale();
  const t = useTranslations('library');
  const isOwner = currentUserId === dictionary.userId;
  const href = isOwner 
    ? `/${locale}/dictionary/${dictionary.id}`
    : `/${locale}/library/${dictionary.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-all hover:-translate-y-1 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10"
    >
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className={`text-3xl rounded-sm overflow-hidden ${languageFlags[dictionary.language] || 'fi fi-xx'}`}></span>
          <div className="flex items-center gap-2">
            {dictionary.isShared && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-active)] px-2.5 py-0.5 text-xs font-semibold text-[var(--fg)]/80 ring-1 ring-inset ring-[var(--border-color)]">
                <Users className="h-3 w-3" />
                Shared Dictionary
              </span>
            )}
            <div className="flex items-center gap-1 text-lg font-medium text-[var(--fg)]/60 transition-colors group-hover:text-primary-500">
              <GitFork className="h-4 w-4" />
              {dictionary.forkCount}
            </div>
          </div>
        </div>
        
        <h3 className="mb-2 text-2xl font-bold tracking-tight text-[var(--fg)] transition-colors group-hover:text-primary-500 line-clamp-1">
          {dictionary.title}
        </h3>
        
        {dictionary.description ? (
          <p className="mb-6 text-lg text-[var(--fg)]/60 line-clamp-2">
            {dictionary.description}
          </p>
        ) : (
          <p className="mb-6 text-lg italic text-[var(--fg)]/40">
            {t('no_description')}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
              {dictionary.username?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <span className="text-lg font-medium text-[var(--fg)]/80">
            {dictionary.username || t('anonymous')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-lg font-medium text-[var(--fg)]/60">
          <BookOpen className="h-4 w-4" />
          {dictionary.wordCount}
        </div>
      </div>
    </Link>
  );
}
