'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SearchBar from '@/components/common/SearchBar';
import DictionaryGrid from '@/components/dictionary/DictionaryGrid';
import CreateDictionaryModal from '@/components/dictionary/CreateDictionaryModal';
import Button from '@/components/ui/Button';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { Dictionary } from '@/lib/db/schema';

interface DashboardClientProps {
  dictionaries: (Dictionary & { wordCount: number })[];
}

export default function DashboardClient({
  dictionaries,
}: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return dictionaries;
    const q = debouncedSearch.toLowerCase();
    return dictionaries.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }, [dictionaries, debouncedSearch]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('search_placeholder')}
          className="w-full sm:max-w-sm"
        />
        <Button id="create-dictionary-btn" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('create_new')}
        </Button>
      </div>

      {debouncedSearch && filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[var(--fg)]/50">
            No dictionaries matching &quot;{debouncedSearch}&quot;
          </p>
        </div>
      ) : (
        <DictionaryGrid
          dictionaries={filtered}
          onCreateClick={() => setIsCreateOpen(true)}
          createButtonId="create-dictionary-btn"
        />
      )}

      <CreateDictionaryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}
