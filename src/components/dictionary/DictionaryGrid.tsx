'use client';

import DictionaryCard from './DictionaryCard';
import EmptyState from '@/components/common/EmptyState';
import type { Dictionary } from '@/lib/db/schema';

interface DictionaryGridProps {
  dictionaries: (Dictionary & { wordCount?: number })[];
  onCreateClick: () => void;
  createButtonId?: string;
}

export default function DictionaryGrid({
  dictionaries,
  onCreateClick,
  createButtonId,
}: DictionaryGridProps) {
  if (dictionaries.length === 0) {
    return (
      <EmptyState
        title="No dictionaries yet"
        description="Create your first dictionary to start building your vocabulary and learning a new language."
        actionLabel="Create Dictionary"
        onAction={onCreateClick}
        actionId={createButtonId}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dictionaries.map((dict) => (
        <DictionaryCard key={dict.id} dictionary={dict} />
      ))}
    </div>
  );
}
