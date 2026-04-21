"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, Plus, Check, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { suggestAiWords } from "@/lib/api/ai.api";
import { createWord } from "@/lib/api/words.api";
import { updateDictionary } from "@/lib/api/dictionaries.api";
import { getErrorMessage } from "@/lib/api/errors";

interface MagicWord {
  word: string;
  translation: string;
  isAdded?: boolean;
}

interface MagicWordsProps {
  dictionaryId: string;
  title: string;
  description?: string | null;
  language: string;
  sourceLanguage: string;
  existingWords: { title: string; translation: string }[];
  initialSuggestions?: MagicWord[] | null;
  onWordAdded: () => void;
}

export default function MagicWords({
  dictionaryId,
  title,
  description,
  language,
  sourceLanguage,
  existingWords,
  initialSuggestions,
  onWordAdded,
}: MagicWordsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<MagicWord[]>(
    initialSuggestions || [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const hasFetchedOnce = useRef(!!initialSuggestions?.length);

  const suggestMutation = useMutation({
    mutationFn: suggestAiWords,
  });

  const addWordMutation = useMutation({
    mutationFn: createWord,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
    },
  });

  const persistMagicWordsMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateDictionary(dictionaryId, payload),
  });

  const fetchSuggestions = useCallback(
    async (isRefresh = false) => {
      setIsLoading(true);
      try {
        const data = await suggestMutation.mutateAsync({
          dictionaryId,
          title,
          description,
          language,
          sourceLanguage,
          existingWords,
          isRefresh,
          excludedWords: isRefresh ? suggestions.map((s) => s.word) : undefined,
        });

        setSuggestions(data.suggestions || []);
        hasFetchedOnce.current = true;
        if (isRefresh) {
          toast("Magic words refreshed!", "success");
        }
      } catch (error: unknown) {
        toast(getErrorMessage(error, "Something went wrong"), "error");
      } finally {
        setIsLoading(false);
      }
    },
    [
      dictionaryId,
      title,
      description,
      language,
      sourceLanguage,
      existingWords,
      toast,
    ],
  );

  // Fetch suggestions once when threshold (2 words) is reached
  useEffect(() => {
    const shouldFetch =
      existingWords.length >= 2 &&
      !isLoading &&
      !hasFetchedOnce.current &&
      suggestions.length === 0;

    if (shouldFetch) {
      fetchSuggestions(false);
    }
  }, [existingWords.length, fetchSuggestions, isLoading, suggestions.length]);

  const handleAddWord = async (magic: MagicWord) => {
    if (magic.isAdded || isAdding) return;

    setIsAdding(magic.word);
    try {
      // 1. Add word to the words table
      await addWordMutation.mutateAsync({
        dictionaryId,
        title: magic.word,
        translation: magic.translation,
      });

      // 2. Update local state
      const updatedSuggestions = suggestions.map((s) =>
        s.word === magic.word ? { ...s, isAdded: true } : s,
      );
      setSuggestions(updatedSuggestions);

      // 3. Persist updated suggestions (with isAdded: true) to the dictionary record
      await persistMagicWordsMutation.mutateAsync({
        activeMagicWords: updatedSuggestions,
      });

      onWordAdded();
      toast(`"${magic.word}" added to your dictionary!`, "success");
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Something went wrong"), "error");
    } finally {
      setIsAdding(null);
    }
  };

  if (
    existingWords.length < 2 ||
    (!isLoading && suggestions.length === 0 && hasFetchedOnce.current)
  )
    return null;

  return (
    <div>
      {(isLoading || suggestions.length > 0) && (
        <div className="flex items-center gap-2 py-1">
          <div className="flex items-center gap-2 overflow-hidden">
            {suggestions.map((magic, i) => (
              <button
                key={magic.word}
                onClick={() => handleAddWord(magic)}
                disabled={magic.isAdded || isAdding !== null}
                style={{
                  animation: !magic.isAdded
                    ? `magic-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`
                    : "none",
                }}
                className={`cursor-pointer group relative flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all active:scale-95 ${
                  magic.isAdded
                    ? "border-green-500/30 bg-green-500/5 text-green-600"
                    : "border-primary-500/30 bg-primary-500/5 text-primary-600 hover:border-primary-500 hover:bg-primary-500 hover:text-white"
                } disabled:cursor-not-allowed`}
              >
                {isAdding === magic.word ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : magic.isAdded ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                )}
                <span className="text-md font-bold leading-none">
                  {magic.word}
                </span>
              </button>
            ))}
            {isLoading && suggestions.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 text-primary-500/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-md font-medium">
                  Generating magic words...
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => fetchSuggestions(true)}
            disabled={isLoading}
            title="Refresh magic words"
            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full text-[var(--fg)]/30 transition-colors hover:bg-[var(--surface)] hover:text-primary-500 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <style jsx global>{`
            @keyframes magic-pop {
              0% {
                transform: scale(0.5);
                opacity: 0;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
