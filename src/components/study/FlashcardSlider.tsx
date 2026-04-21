"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import FlashcardCard from "./FlashcardCard";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  ArrowRight,
  Shuffle,
  RotateCcw,
  ArrowLeftRight,
  Check,
} from "lucide-react";
import type { Word, ExamplePhrase } from "@/lib/db/schema";
import { completeFlashcardSession } from "@/lib/api/study.api";

export default function FlashcardSlider({
  words,
  dictionaryId,
}: {
  words: (Word & { examplePhrases: ExamplePhrase[] })[];
  dictionaryId: string;
}) {
  const [deck, setDeck] = useState(words);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<
    "word-first" | "translation-first"
  >("word-first");
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeFlashcardMutation = useMutation({
    mutationFn: completeFlashcardSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });

  const finishDeck = useCallback(async () => {
    setIsFinished(true);
    try {
      await completeFlashcardMutation.mutateAsync(dictionaryId);
      toast("Flashcard session completed!", "success");
    } catch (error) {
      console.error(error);
    }
  }, [dictionaryId, toast, completeFlashcardMutation]);

  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((c) => c + 1), 150);
    } else {
      finishDeck();
    }
  }, [currentIndex, deck.length, finishDeck]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((c) => c - 1), 150);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, handleFlip, isFinished]);

  const shuffleDeck = () => {
    setIsFlipped(false);
    setDeck([...deck].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  const resetDeck = () => {
    setIsFlipped(false);
    setDeck(words);
    setCurrentIndex(0);
    setIsFinished(false);
  };

  const toggleDirection = () => {
    setIsFlipped(false);
    setDirection((prev) =>
      prev === "word-first" ? "translation-first" : "word-first",
    );
  };

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="mb-4 text-3xl font-bold">No words to study</h2>
        <p className="mb-6 text-[var(--fg)]/60">
          Add some words to this dictionary first.
        </p>
        <Button
          onClick={() => router.push(`/${locale}/dictionary/${dictionaryId}`)}
        >
          Back to Dictionary
        </Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center p-12 text-center duration-500">
        <h2 className="mb-4 text-5xl font-bold">Great Job! 🎉</h2>
        <p className="mb-8 max-w-md text-[var(--fg)]/60">
          You have reviewed all {deck.length} flashcards in this session.
        </p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={resetDeck}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Study Again
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/dictionary/${dictionaryId}`)}
          >
            Back to Dictionary
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center py-8">
      {/* Top Controls */}
      <div className="mb-8 flex w-full max-w-2xl items-center justify-between px-4">
        <div className="rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2 text-lg font-semibold text-[var(--fg)]/60">
          {currentIndex + 1} / {deck.length}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDirection}
            title="Toggle Direction"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={shuffleDeck}
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetDeck} title="Restart">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Card */}
      <div className="w-full px-4">
        <FlashcardCard
          word={deck[currentIndex]}
          isFlipped={isFlipped}
          onClick={handleFlip}
          direction={direction}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="mt-10 flex w-full max-w-2xl items-center justify-center gap-6">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-full border border-[var(--border-color)] bg-[var(--surface)] p-4 text-[var(--fg)] transition-all hover:bg-[var(--border-color)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          className="rounded-full bg-primary-500 p-4 font-bold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-600"
        >
          {currentIndex === deck.length - 1 ? (
            <Check className="h-6 w-6" />
          ) : (
            <ArrowRight className="h-6 w-6" />
          )}
        </button>
      </div>
      <p className="mt-6 hidden text-sm text-[var(--fg)]/40 sm:block">
        Use Arrow keys (← →) to navigate and Space to flip
      </p>
    </div>
  );
}
