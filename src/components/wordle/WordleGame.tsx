"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { Link2 } from "lucide-react";

type CellState = "correct" | "present" | "absent";

type GuessResult = {
  guess: string;
  pattern: CellState[];
};

type GamePayload = {
  id: string;
  wordLength: number;
  maxTries: number;
};

function toCellClass(state?: CellState) {
  if (state === "correct") return "bg-green-500 border-green-500 text-white";
  if (state === "present") return "bg-yellow-400 border-yellow-400 text-black";
  if (state === "absent") return "bg-neutral-500 border-neutral-500 text-white";
  return "border-[var(--border-color)] bg-[var(--bg)] text-[var(--fg)]";
}

function onlyLetters(value: string) {
  return value.replace(/[^a-zA-Z]/g, "");
}

export default function WordleGame({
  locale,
  gameId,
}: {
  locale: string;
  gameId: string;
}) {
  const t = useTranslations("wordle");
  const [game, setGame] = useState<GamePayload | null>(null);
  const [attempts, setAttempts] = useState<GuessResult[]>([]);
  const [guess, setGuess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [solverNote, setSolverNote] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<
    "copied" | "failed" | null
  >(null);

  const isGameOver =
    hasWon || (game ? attempts.length >= game.maxTries : false);

  useEffect(() => {
    let ignore = false;

    async function fetchGame() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/wordle/game/${gameId}`);
        const data = await res.json();

        if (!res.ok) {
          if (!ignore) {
            setError(data?.error || t("game.load_failed"));
          }
          return;
        }

        if (!ignore) {
          setGame(data.game);
        }
      } catch {
        if (!ignore) {
          setError(t("game.load_failed"));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchGame();

    return () => {
      ignore = true;
    };
  }, [gameId, t]);

  const rows = useMemo(() => {
    if (!game) return [];
    const allRows = [...attempts];

    while (allRows.length < game.maxTries) {
      allRows.push({
        guess: "",
        pattern: Array.from(
          { length: game.wordLength },
          () => "absent" as CellState,
        ),
      });
    }

    return allRows;
  }, [attempts, game]);

  async function handleSubmitGuess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!game || isGameOver || isSubmitting) return;

    const nextGuess = guess.trim().toUpperCase();
    if (nextGuess.length !== game.wordLength) {
      setError(t("errors.word_length_mismatch", { length: game.wordLength }));
      return;
    }

    if (!/^[A-Z]+$/.test(nextGuess)) {
      setError(t("errors.word_letters_only"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/wordle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, guess: nextGuess }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || t("game.guess_failed"));
        return;
      }

      setAttempts((prev) => [
        ...prev,
        { guess: data.guess as string, pattern: data.pattern as CellState[] },
      ]);
      setGuess("");

      if (data.isWin) {
        setHasWon(true);
        setSolverNote((data.solverNote as string | null) || null);
      }
    } catch {
      setError(t("game.guess_failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openShareModal() {
    setShareFeedback(null);
    setIsShareModalOpen(true);
  }

  function closeShareModal() {
    setIsShareModalOpen(false);
  }

  function getShareUrl() {
    if (typeof window === "undefined") {
      return "";
    }
    return window.location.href;
  }

  async function handleCopyGameUrl() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setShareFeedback("copied");
    } catch {
      setShareFeedback("failed");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    t("game.share_message", { url: getShareUrl() }),
  )}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            {t("game.title")}
          </h1>
          <button
            type="button"
            onClick={openShareModal}
            className="cursor-pointer bg-yellow-400 px-6 py-4 text-center text-xl font-black text-black transition-colors hover:bg-yellow-300 sm:text-2xl"
          >
            {t("game.share")}
          </button>
        </div>

        {isLoading && (
          <p className="mt-6 text-2xl font-bold text-[var(--fg)]/60 sm:text-3xl">
            {t("game.loading")}
          </p>
        )}

        {!isLoading && error && (
          <div className="mt-6 border border-red-300 bg-red-50 px-5 py-4 text-xl font-semibold text-red-700">
            {error}
          </div>
        )}

        {game && !isLoading && (
          <>
            <p className="mt-4 text-2xl font-bold text-[var(--fg)]/70 sm:text-3xl">
              {t("game.meta", {
                length: game.wordLength,
                tries: game.maxTries,
              })}
            </p>

            <div className="mt-8 space-y-3">
              {rows.map((row, rowIndex) => {
                const letters = row.guess.split("");
                const isPendingRow =
                  rowIndex === attempts.length && !isGameOver;

                return (
                  <div key={rowIndex} className="flex gap-2 sm:gap-3">
                    {Array.from({ length: game.wordLength }).map(
                      (_, cellIndex) => {
                        const letter =
                          letters[cellIndex] ||
                          (isPendingRow ? guess[cellIndex] || "" : "");
                        const state =
                          rowIndex < attempts.length
                            ? row.pattern[cellIndex]
                            : undefined;

                        return (
                          <div
                            key={cellIndex}
                            className={`flex h-14 w-14 items-center justify-center border text-2xl font-black sm:h-20 sm:w-20 sm:text-4xl ${toCellClass(state)}`}
                          >
                            {letter}
                          </div>
                        );
                      },
                    )}
                  </div>
                );
              })}
            </div>

            {!isGameOver && (
              <form onSubmit={handleSubmitGuess} className="mt-8 space-y-4">
                <input
                  value={guess}
                  maxLength={game.wordLength}
                  onChange={(e) =>
                    setGuess(onlyLetters(e.target.value).toUpperCase())
                  }
                  className="w-full border border-[var(--border-color)] bg-[var(--bg)] px-5 py-4 text-3xl font-black tracking-[0.2em] uppercase outline-none focus:border-primary-500 sm:text-5xl"
                  placeholder={t("game.guess_placeholder")}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black px-6 py-5 text-2xl font-black text-yellow-300 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl"
                >
                  {isSubmitting ? t("game.submitting") : t("game.submit")}
                </button>
              </form>
            )}

            {hasWon && (
              <>
                <div className="mt-8 border border-green-300 bg-green-50 px-5 py-4 text-2xl font-black text-green-700 sm:text-3xl">
                  {t("game.win")}
                </div>
                {solverNote && (
                  <div className="mt-4 border border-yellow-300 bg-yellow-50 px-5 py-4 text-xl font-semibold text-yellow-900 sm:text-2xl">
                    <p className="mb-2 text-base font-black uppercase tracking-wide sm:text-lg">
                      {t("game.secret_note_title")}
                    </p>
                    <p>{solverNote}</p>
                  </div>
                )}
              </>
            )}

            {!hasWon && isGameOver && (
              <div className="mt-8 border border-amber-300 bg-amber-50 px-5 py-4 text-2xl font-black text-amber-800 sm:text-3xl">
                {t("game.lose")}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/wordle`}
                className="bg-yellow-400 px-6 py-4 text-center text-xl font-black text-black transition-colors hover:bg-yellow-300 sm:text-2xl"
              >
                {t("game.create_new")}
              </Link>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isShareModalOpen}
        onClose={closeShareModal}
        title={t("game.share_modal_title")}
        size="sm"
        className="rounded-none"
      >
        <div className="space-y-4">
          <p className="break-all text-sm font-medium text-[var(--fg)]/70">
            {getShareUrl()}
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCopyGameUrl}
              className="cursor-pointer inline-flex items-center justify-center gap-2 bg-yellow-400 px-5 py-3 text-base font-black text-black transition-colors hover:bg-yellow-300"
            >
              <Link2 className="h-4 w-4" />
              {t("game.share_copy")}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 px-5 py-3 text-center text-base font-black text-white transition-colors hover:bg-green-700"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.16 1.6 5.98L0 24l6.3-1.65a11.9 11.9 0 0 0 5.77 1.47h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.46-8.44Zm-8.45 18.3h-.01a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.85 9.85 0 0 1-1.51-5.26c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7.01 2.9 9.83 9.83 0 0 1 2.9 7.01c0 5.46-4.44 9.9-9.9 9.9Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.45-.88-.77-1.48-1.72-1.65-2.02-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.2-.24-.58-.49-.5-.66-.5h-.56c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.35.2 1.85.12.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
              </svg>
              {t("game.share_whatsapp")}
            </a>
          </div>

          {shareFeedback === "copied" && (
            <p className="text-sm font-semibold text-green-700">
              {t("game.share_copied")}
            </p>
          )}

          {shareFeedback === "failed" && (
            <p className="text-sm font-semibold text-red-700">
              {t("game.share_copy_failed")}
            </p>
          )}
        </div>
      </Modal>
    </main>
  );
}
