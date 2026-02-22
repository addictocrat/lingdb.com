'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useTranslations } from 'next-intl';

export default function LibraryControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('library');

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('sort', sort);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleLanguage = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (lang === 'all') {
      params.delete('lang');
    } else {
      params.set('lang', lang);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          defaultValue={searchParams.get('q') || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-lg focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={searchParams.get('lang') || 'all'}
          onChange={(e) => handleLanguage(e.target.value)}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-2.5 pl-3 pr-8 text-lg focus:border-primary-500 focus:outline-none"
        >
          <option value="all">{t('all_languages')}</option>
          <option value="en">{t('en')} (🇬🇧)</option>
          <option value="fr">{t('fr')} (🇫🇷)</option>
          <option value="de">{t('de')} (🇩🇪)</option>
          <option value="es">{t('es')} (🇪🇸)</option>
          <option value="tr">{t('tr')} (🇹🇷)</option>
        </select>

        <div className="relative">
          <select
            value={searchParams.get('sort') || 'newest'}
            onChange={(e) => handleSort(e.target.value)}
            className="appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-2.5 pl-9 pr-8 text-lg focus:border-primary-500 focus:outline-none"
          >
            <option value="newest">{t('sort_newest')}</option>
            <option value="most_words">{t('sort_words')}</option>
            <option value="most_forked">{t('sort_forks')}</option>
          </select>
          <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
        </div>
      </div>
      
      {isPending && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-primary-500 animate-pulse z-50"></div>
      )}
    </div>
  );
}
