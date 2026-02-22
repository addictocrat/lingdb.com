'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Badge from '@/components/ui/Badge';
import { Globe, Lock, Users } from 'lucide-react';
import type { Dictionary } from '@/lib/db/schema';

const languageFlags: Record<string, string> = {
  en: 'fi fi-gb',
  fr: 'fi fi-fr',
  de: 'fi fi-de',
  es: 'fi fi-es',
  tr: 'fi fi-tr',
};

interface DictionaryCardProps {
  dictionary: Dictionary & { 
    wordCount?: number;
    isShared?: boolean;
  };
}

export default function DictionaryCard({ dictionary }: DictionaryCardProps) {
  const locale = useLocale();
  const tDict = useTranslations('dictionary');
  const tDash = useTranslations('dashboard');
  const flagClass = languageFlags[dictionary.language] || 'fi fi-xx';

  const updated = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dictionary.updatedAt));

  return (
    <Link
      href={`/${locale}/dictionary/${dictionary.id}`}
      className="group block rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-lg hover:shadow-primary-500/10"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-3xl rounded-sm overflow-hidden ${flagClass}`}></span>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* {dictionary.isShared && (
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              Shared Dictionary
            </Badge>
          )} */}
          {dictionary.isPublic ? (
            <Badge variant="default">
              <Globe className="mr-1 h-3 w-3" />
              {tDict('public')}
            </Badge>
          ) : (
            <Badge variant="warning">
              <Lock className="mr-1 h-3 w-3" />
              {tDict('private')}
            </Badge>
          )}
        </div>
      </div>

      <h3 className="text-base font-bold leading-tight group-hover:text-primary-500 transition-colors">
        {dictionary.title}
      </h3>

      {dictionary.description && (
        <p className="mt-1 line-clamp-2 text-sm text-[var(--fg)]/50">
          {dictionary.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-[var(--fg)]/40">
        <span>{tDash('word_count', { count: dictionary.wordCount ?? 0 })}</span>
        <span>{tDash('last_updated', { date: updated })}</span>
      </div>
    </Link>
  );
}
