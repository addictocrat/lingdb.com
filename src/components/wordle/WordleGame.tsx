"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import { Link2 } from "lucide-react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/utils/constants";
import { getWordleGame, submitWordleGuess } from "@/lib/api/wordle.api";
import { qk } from "@/lib/tanstack/query-keys";

type CellState = "correct" | "present" | "absent";

type GuessResult = {
  guess: string;
  pattern: CellState[];
};

type GamePayload = {
  id: string;
  language: SupportedLocale;
  wordLength: number;
  maxTries: number;
};

const KEYBOARD_LAYOUTS: Record<SupportedLocale, string[][]> = {
  en: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ],
  es: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ],
  fr: [
    ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
    ["ENTER", "W", "X", "C", "V", "B", "N", "BACKSPACE"],
  ],
  de: [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"],
    ["ENTER", "Y", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ],
  tr: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE"],
  ],
};

function getCellStyles(state: CellState | undefined, hasLetter: boolean) {
  if (state === "correct") {
    return "bg-success border-success text-white shadow-sm";
  }
  if (state === "present") {
    return "bg-warning border-warning text-black dark:text-neutral-900 shadow-sm";
  }
  if (state === "absent") {
    return "bg-[var(--key-bg-absent-flat)] border-[var(--key-bg-absent-flat)] text-white";
  }
  if (hasLetter) {
    return "border-neutral-600 dark:border-neutral-400 bg-[var(--bg)] text-[var(--fg)] scale-[1.03] shadow-md";
  }
  return "border-[var(--border-color)] bg-[var(--bg)] text-[var(--fg)]";
}

export default function WordleGame({
  locale,
  gameId,
}: {
  locale: string;
  gameId: string;
}) {
  const t = useTranslations("wordle");
  const tCommon = useTranslations("common");
  const tLanguages = useTranslations("settings.languages");
  const router = useRouter();

  const [game, setGame] = useState<GamePayload | null>(null);
  const [attempts, setAttempts] = useState<GuessResult[]>([]);
  const [guess, setGuess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [solverNote, setSolverNote] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<
    "copied" | "failed" | null
  >(null);

  const isGameOver =
    hasWon || (game ? attempts.length >= game.maxTries : false);

  const { data: gameData, isLoading: isLoadingGame } = useQuery({
    queryKey: qk.wordle.game(gameId),
    queryFn: async () => {
      const data = await getWordleGame(gameId);
      return data.game as GamePayload;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    setIsLoading(isLoadingGame);
    if (gameData) {
      setGame(gameData);
      setError(null);
    }
  }, [isLoadingGame, gameData]);

  const submitGuessMutation = useMutation({
    mutationFn: submitWordleGuess,
  });

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

  const submitGuess = async () => {
    if (!game || isGameOver || isSubmitting) return;

    const nextGuess = guess.trim().toLocaleUpperCase(game.language);
    if (nextGuess.length !== game.wordLength) {
      setError(t("errors.word_length_mismatch", { length: game.wordLength }));
      return;
    }

    if (!/^\p{L}+$/u.test(nextGuess)) {
      setError(t("errors.word_letters_only"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = await submitGuessMutation.mutateAsync({
        gameId,
        guess: nextGuess,
      });

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
  };

  const handleKeyPress = (char: string) => {
    if (!game || isGameOver) return;
    if (guess.length < game.wordLength) {
      setGuess((prev) => prev + char);
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (isGameOver) return;
    setGuess((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handlePlayAgain = async () => {
    if (!game) return;
    setIsRetrying(true);
    setError(null);
    try {
      const response = await fetch(`/api/wordle/random?language=${game.language}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load game");
      }
      
      // Reset local gameplay states
      setAttempts([]);
      setGuess("");
      setHasWon(false);
      setSolverNote(null);
      
      // Redirect to the new game ID
      router.push(`/${locale}/wordle/game/${data.gameId}`);
    } catch (err: any) {
      setError(err.message || t("game.load_failed"));
    } finally {
      setIsRetrying(false);
    }
  };

  // Centralized keyboard layout
  const keyboardLayout = useMemo(() => {
    if (!game) return [];
    return KEYBOARD_LAYOUTS[game.language] || KEYBOARD_LAYOUTS.en;
  }, [game]);

  // Allowed characters mapping for fast lookup
  const allowedKeys = useMemo(() => {
    const keysSet = new Set<string>();
    keyboardLayout.forEach((row) => {
      row.forEach((key) => {
        if (key !== "ENTER" && key !== "BACKSPACE") {
          keysSet.add(key);
        }
      });
    });
    return keysSet;
  }, [keyboardLayout]);

  // Compute status for keys in visual keyboard
  const letterStatuses = useMemo(() => {
    const statuses: Record<string, CellState> = {};
    attempts.forEach((attempt) => {
      const letters = attempt.guess.split("");
      letters.forEach((char, index) => {
        const state = attempt.pattern[index];
        const currentStatus = statuses[char];

        if (state === "correct") {
          statuses[char] = "correct";
        } else if (state === "present") {
          if (currentStatus !== "correct") {
            statuses[char] = "present";
          }
        } else if (state === "absent") {
          if (currentStatus !== "correct" && currentStatus !== "present") {
            statuses[char] = "absent";
          }
        }
      });
    });
    return statuses;
  }, [attempts]);

  // Capture physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!game || isGameOver || isShareModalOpen) return;

      // Ignore input if user is focusing an input field or text area (e.g. search bars)
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter") {
        submitGuess();
      } else {
        const char = e.key.toLocaleUpperCase(game.language);
        if (allowedKeys.has(char)) {
          handleKeyPress(char);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, isGameOver, isShareModalOpen, guess, allowedKeys, isSubmitting]);

  // Responsive sizes for cell grids (slightly smaller and tighter padding)
  const cellSizeStyle = useMemo(() => {
    if (!game) return {};
    return {
      width: `min(3.5rem, calc((100vw - 32px) / ${game.wordLength} - 4px))`,
      height: `min(3.5rem, calc((100vw - 32px) / ${game.wordLength} - 4px))`,
    };
  }, [game]);

  const fontSizeStyle = useMemo(() => {
    if (!game) return {};
    return {
      fontSize: `min(${game.wordLength > 8 ? "1.2rem" : "1.75rem"}, calc((100vw - 32px) / ${game.wordLength} * 0.4))`,
    };
  }, [game]);

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

  const gameLanguageName = useMemo(() => {
    if (!game?.language) {
      return null;
    }

    const normalizedLanguage = game.language.toLowerCase();
    if (!SUPPORTED_LOCALES.includes(normalizedLanguage as SupportedLocale)) {
      return normalizedLanguage.toUpperCase();
    }

    return tLanguages(normalizedLanguage as SupportedLocale);
  }, [game?.language, tLanguages]);

  return (
    <main className="mx-auto w-full px-2 py-6 sm:max-w-5xl sm:px-6 sm:py-10">
      <div className="flex flex-col items-center">
        {/* Header Section */}
        <div className="flex w-full max-w-xl items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl uppercase">
              {t("game.title")}
            </h1>
            {game && (
              <p className="mt-1 text-sm font-bold text-[var(--fg)]/60">
                {t("game.meta", {
                  length: game.wordLength,
                  tries: game.maxTries,
                })}
                {gameLanguageName && ` • ${gameLanguageName}`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openShareModal}
            className="cursor-pointer bg-yellow-400 px-4 py-2 text-black transition-colors hover:bg-yellow-300 rounded font-black text-sm sm:text-base flex items-center gap-1.5"
          >
            <Link2 className="h-4 w-4" />
            <span>{t("game.share")}</span>
          </button>
        </div>

        {isLoading && (
          <p className="mt-12 text-2xl font-bold text-[var(--fg)]/60 sm:text-3xl animate-pulse">
            {t("game.loading")}
          </p>
        )}

        {!isLoading && error && (
          <div className="mt-6 w-full max-w-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 px-5 py-4 text-center text-lg font-semibold text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {game && !isLoading && (
          <>
            {/* Yordle Letter Grid (Smaller cells & closer to each other) */}
            <div className="mt-6 flex flex-col gap-1 sm:gap-1.5">
              {rows.map((row, rowIndex) => {
                const letters = row.guess.split("");
                const isPendingRow = rowIndex === attempts.length && !isGameOver;
                const isLatestSubmitted = rowIndex === attempts.length - 1;

                return (
                  <div
                    key={rowIndex}
                    className="flex justify-center gap-1 sm:gap-1.5"
                  >
                    {Array.from({ length: game.wordLength }).map(
                      (_, cellIndex) => {
                        const letter =
                          letters[cellIndex] ||
                          (isPendingRow ? guess[cellIndex] || "" : "");
                        const state =
                          rowIndex < attempts.length
                            ? row.pattern[cellIndex]
                            : undefined;

                        const hasLetter = isPendingRow
                          ? !!guess[cellIndex]
                          : !!letter;
                        const isPopClass =
                          isPendingRow && hasLetter ? "animate-pop" : "";
                        const isFlipClass = isLatestSubmitted ? "animate-flip" : "";

                        return (
                          <div
                            key={cellIndex}
                            style={{
                              ...cellSizeStyle,
                              ...fontSizeStyle,
                              animationDelay: isLatestSubmitted
                                ? `${cellIndex * 150}ms`
                                : undefined,
                              transitionDelay: isLatestSubmitted
                                ? `${cellIndex * 150 + 250}ms`
                                : undefined,
                            }}
                            className={`flex cursor-default select-none items-center justify-center border-2 text-2xl font-black uppercase rounded-md transition-colors duration-0 ${isPopClass} ${isFlipClass} ${getCellStyles(state, hasLetter)}`}
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

            {/* Game Result Banners */}
            {hasWon && (
              <div className="mt-6 w-full max-w-md text-center">
                <div className="border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-900/40 px-5 py-3 text-xl font-black text-green-700 dark:text-green-400 rounded">
                  {t("game.win")}
                </div>
                {solverNote && (
                  <div className="mt-3 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900/40 px-5 py-3 text-left text-sm font-semibold text-yellow-900 dark:text-yellow-400 rounded">
                    <p className="mb-1 text-xs font-black uppercase tracking-wider ">
                      {t("game.secret_note_title")}
                    </p>
                    <p>{solverNote}</p>
                  </div>
                )}
              </div>
            )}

            {!hasWon && isGameOver && (
              <div className="mt-6 w-full max-w-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-5 py-3 text-center text-xl font-black text-amber-800 dark:text-amber-400 rounded">
                {t("game.lose")}
              </div>
            )}

            {/* Visual Virtual Keyboard */}
            {!isGameOver && (
              <div className="mt-8 w-full max-w-2xl px-1">
                <div className="flex flex-col gap-1.5">
                  {keyboardLayout.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex justify-center gap-1 touch-manipulation"
                    >
                      {row.map((key) => {
                        const status = letterStatuses[key];

                        // Theme-aware overrides using CSS variables
                        let keyBgClass = "wordle-kbd-btn";
                        if (status === "correct") {
                          keyBgClass = "wordle-kbd-btn wordle-kbd-btn-correct";
                        } else if (status === "present") {
                          keyBgClass = "wordle-kbd-btn wordle-kbd-btn-present";
                        } else if (status === "absent") {
                          keyBgClass = "wordle-kbd-btn wordle-kbd-btn-absent";
                        }

                        const isSpecialKey =
                          key === "ENTER" || key === "BACKSPACE";
                        const keyWidthClass = isSpecialKey
                          ? "flex-[1.5] text-[10px] sm:text-xs px-1"
                          : "flex-1 text-xs sm:text-sm px-0.5";

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              if (key === "ENTER") {
                                submitGuess();
                              } else if (key === "BACKSPACE") {
                                handleBackspace();
                              } else {
                                handleKeyPress(key);
                              }
                            }}
                            className={`flex h-11 sm:h-14 items-center justify-center font-extrabold uppercase select-none ${keyBgClass} ${keyWidthClass}`}
                          >
                            {key === "BACKSPACE" ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className="h-5 w-5 sm:h-6 sm:w-6"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
                                />
                              </svg>
                            ) : key === "ENTER" ? (
                              "Enter"
                            ) : (
                              key
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Menu (Side-by-side buttons) */}
            <div className="mt-8 flex flex-row gap-3 justify-center items-center w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={handlePlayAgain}
                disabled={isRetrying}
                className="flex-1 bg-[#0001d8] hover:bg-[#0001d8]/90 text-white px-4 py-3 text-center text-sm sm:text-base font-black transition-colors rounded flex items-center justify-center gap-2 disabled:opacity-50 select-none cursor-pointer"
              >
                {isRetrying ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>{tCommon("loading")}</span>
                  </>
                ) : (
                  <span>{t("game.play_again")}</span>
                )}
              </button>
              <Link
                href={`/${locale}/wordle/create`}
                className="flex-1 bg-yellow-400 px-4 py-3 text-center text-sm sm:text-base font-black text-black transition-colors hover:bg-yellow-300 rounded select-none"
              >
                {t("game.create_new")}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Share Modal */}
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
              className="cursor-pointer inline-flex items-center justify-center gap-2 bg-yellow-400 px-5 py-3 text-base font-black text-black transition-colors hover:bg-yellow-300 rounded"
            >
              <Link2 className="h-4 w-4" />
              {t("game.share_copy")}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 px-5 py-3 text-center text-base font-black text-white transition-colors hover:bg-green-700 rounded"
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
