'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { GitFork, BookOpen, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Dictionary, Word, ExamplePhrase } from '@/lib/db/schema';
import Badge from '@/components/ui/Badge';
import ExamplePhrasePopup from '@/components/dictionary/ExamplePhrasePopup';

interface DictionaryPreviewClientProps {
  dictionary: Dictionary & {
    words: (Word & { examplePhrases: ExamplePhrase[] })[];
    user?: { username: string | null };
    _count?: { forks: number };
  };
  hasForked: boolean;
  isLoggedIn: boolean;
}

const languageFlags: Record<string, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  tr: '🇹🇷',
};

export default function DictionaryPreviewClient({
  dictionary,
  hasForked,
  isLoggedIn,
}: DictionaryPreviewClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const [isForking, setIsForking] = useState(false);
  const [selectedWord, setSelectedWord] = useState<(Word & { examplePhrases: ExamplePhrase[] }) | null>(null);

  const handleFork = async () => {
    if (!isLoggedIn) {
      router.push(`/${locale}/login?redirect=/library/${dictionary.id}`);
      return;
    }

    if (hasForked) {
      toast('You have already forked this dictionary', 'warning');
      return;
    }
    
    setIsForking(true);
    try {
      const res = await fetch('/api/dictionaries/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDictionaryId: dictionary.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fork');
      }

      toast('Dictionary forked successfully! 🎉', 'success');
      // Redirect to the new copy
      router.push(`/${locale}/dictionary/${data.dictionaryId}`);
    } catch (error: any) {
      toast(error.message, 'error');
      setIsForking(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${locale}/library`}
          className="rounded-lg p-2 text-[var(--fg)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-lg font-semibold uppercase tracking-wider text-[var(--fg)]/50">
          Library Preview
        </span>
      </div>

      <div className="mb-10 flex flex-col items-center justify-center rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8 text-center sm:p-12">
        <div className="mb-6 text-6xl">{languageFlags[dictionary.language] || '🌐'}</div>
        <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
          {dictionary.title}
        </h1>
        {dictionary.description && (
          <p className="mb-6 max-w-2xl text-xl text-[var(--fg)]/70">
            {dictionary.description}
          </p>
        )}
        
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <Badge variant="default" className="text-lg">
            By {dictionary.user?.username || 'Anonymous'}
          </Badge>
          <span className="flex items-center gap-1.5 text-lg font-medium text-[var(--fg)]/60">
            <BookOpen className="h-4 w-4" />
            {dictionary.words.length} words
          </span>
          <span className="flex items-center gap-1.5 text-lg font-medium text-[var(--fg)]/60">
            <GitFork className="h-4 w-4" />
            {dictionary._count?.forks || 0} forks
          </span>
        </div>

        <Button
          size="lg"
          onClick={handleFork}
          disabled={isForking || hasForked}
          className="w-full max-w-md sm:w-auto text-xl"
        >
          <GitFork className="mr-2 h-5 w-5" />
          {isForking ? 'Forking...' : hasForked ? 'Already Forked' : 'Fork this Dictionary'}
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Word List</h2>
        {dictionary.words.length === 0 ? (
          <div className="py-12 text-center text-lg text-[var(--fg)]/40">
            This dictionary is empty.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
            {dictionary.words.map((word) => (
              <div
                key={word.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-semibold text-[var(--fg)]">{word.title}</span>
                  <span className="hidden sm:inline-block mx-3 text-[var(--fg)]/20">→</span>
                  <span className="text-lg sm:text-base text-[var(--fg)]/70">{word.translation}</span>
                </div>
                {word.examplePhrases.length > 0 && (
                  <button
                    onClick={() => setSelectedWord(word)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {word.examplePhrases.length} examples
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedWord && (
         <ExamplePhrasePopup
           isOpen={true}
           onClose={() => setSelectedWord(null)}
           wordId={selectedWord.id}
           wordTitle={selectedWord.title}
           wordTranslation={selectedWord.translation}
           readOnly={true}
         />
      )}
    </div>
  );
}
