"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Sparkles, Trash2, Plus, Zap } from "lucide-react";
import type { ExamplePhrase } from "@/lib/db/schema";
import {
  createExamplePhrase,
  deleteExamplePhrase,
  listExamplePhrases,
} from "@/lib/api/example-phrases.api";
import { generateAiPhrases } from "@/lib/api/ai.api";
import { qk } from "@/lib/tanstack/query-keys";
import { getErrorMessage } from "@/lib/api/errors";

interface ExamplePhrasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  wordId: string;
  wordTitle: string;
  wordTranslation: string;
  readOnly?: boolean;
}

export default function ExamplePhrasePopup({
  isOpen,
  onClose,
  wordId,
  wordTitle,
  wordTranslation,
  readOnly = false,
}: ExamplePhrasePopupProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Manual add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { data: phrases = [], isFetching: isFetchingPhrases } = useQuery<
    ExamplePhrase[]
  >({
    queryKey: qk.phrases.byWord(wordId),
    enabled: isOpen && Boolean(wordId),
    queryFn: async () => {
      const data = await listExamplePhrases(wordId);
      return data.phrases as ExamplePhrase[];
    },
    staleTime: 120_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateAiPhrases(wordId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.phrases.byWord(wordId),
      });
    },
  });

  const addPhraseMutation = useMutation({
    mutationFn: createExamplePhrase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.phrases.byWord(wordId),
      });
    },
  });

  const deletePhraseMutation = useMutation({
    mutationFn: deleteExamplePhrase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: qk.phrases.byWord(wordId),
      });
    },
  });

  useEffect(() => {
    setIsLoading(isFetchingPhrases);
  }, [isFetchingPhrases]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generateMutation.mutateAsync();
      setCreditsRemaining(data.creditsRemaining ?? null);
      toast(`Generated ${data.phrases.length} phrases!`, "success");
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Something went wrong"), "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim() || !newTranslation.trim()) return;

    setIsAdding(true);
    try {
      await addPhraseMutation.mutateAsync({
        wordId,
        phrase: newPhrase.trim(),
        translation: newTranslation.trim(),
      });

      setNewPhrase("");
      setNewTranslation("");
      setShowAddForm(false);
    } catch (error: unknown) {
      toast(getErrorMessage(error, "Something went wrong"), "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (phraseId: string) => {
    try {
      await deletePhraseMutation.mutateAsync(phraseId);
    } catch {
      toast("Failed to delete phrase", "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Examples for "${wordTitle}"`}
      size="lg"
    >
      <p className="mb-4 text-lg text-[var(--fg)]/50">
        {wordTitle} → {wordTranslation}
      </p>

      {/* Phrases list */}
      <div className="mb-4 max-h-64 space-y-2 overflow-auto">
        {isLoading ? (
          <div className="py-8 text-center text-lg text-[var(--fg)]/40">
            Loading...
          </div>
        ) : phrases.length === 0 ? (
          <div className="py-8 text-center text-lg text-[var(--fg)]/40">
            No example phrases yet
          </div>
        ) : (
          phrases.map((phrase) => (
            <div
              key={phrase.id}
              className="group flex items-start gap-3 rounded-xl bg-[var(--surface)] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium">{phrase.phrase}</p>
                <p className="mt-0.5 text-sm text-[var(--fg)]/50">
                  {phrase.translation}
                </p>
                {phrase.isAiGenerated && (
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-primary-400">
                    <Sparkles className="h-3 w-3" /> AI Generated
                  </span>
                )}
              </div>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(phrase.id)}
                  className="rounded-lg p-1 text-[var(--fg)]/20 opacity-0 transition-all hover:text-accent-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Manual add form */}
      {!readOnly && showAddForm && (
        <form
          onSubmit={handleAddManual}
          className="mb-4 space-y-2 rounded-xl border border-[var(--border-color)] p-3"
        >
          <input
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            placeholder="Example phrase..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-2 text-lg focus:border-primary-500 focus:outline-none"
            autoFocus
          />
          <input
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            placeholder="Translation..."
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-2 text-lg focus:border-primary-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" isLoading={isAdding}>
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Actions */}
      {!readOnly && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={phrases.length >= 9}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4" />
              Magic Examples ✨
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowAddForm(true)}
              disabled={phrases.length >= 9 || showAddForm}
              className="flex-1"
            >
              <Plus className="h-4 w-4" />
              Add Manually
            </Button>
          </div>

          {/* Credits info */}
          <div className="mt-3 flex items-center justify-between text-sm text-[var(--fg)]/40">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {creditsRemaining !== null
                ? `${creditsRemaining} AI credits remaining`
                : "1 credit per generation"}
            </span>
            <span>{phrases.length} / 9 phrases</span>
          </div>
        </>
      )}
    </Modal>
  );
}
