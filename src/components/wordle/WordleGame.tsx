"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

  async function handleCopyGameUrl() {
    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            {t("game.title")}
          </h1>
          <button
            type="button"
            onClick={handleCopyGameUrl}
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
    </main>
  );
}
