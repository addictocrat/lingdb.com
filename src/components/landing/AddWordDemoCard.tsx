"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDebounce } from "@/lib/hooks/useDebounce";
import AutoSuggest from "@/components/dictionary/AutoSuggest";
import { Plus, Puzzle, Sparkles, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEMO_LANGUAGE_OPTIONS,
  DEMO_LANGUAGE_PLACEHOLDERS,
  type DemoLanguageCode,
} from "@/lib/constants/landing";
import { createWordleGame } from "@/lib/api/wordle.api";
import { suggestTranslation } from "@/lib/api/words.api";
import { suggestAiWordsDemo, suggestAiDemoPhrases } from "@/lib/api/ai.api";

type MagicSuggestion = {
  word: string;
  translation: string;
};

type ExamplePhrase = {
  phrase: string;
  translation: string;
};

function FlagIcon({ code }: { code: DemoLanguageCode }) {
  const flagCode = code === "en" ? "gb" : code;

  return (
    <span
      className={`fi fi-${flagCode} h-5 w-7 overflow-hidden rounded-sm`}
      aria-hidden="true"
    />
  );
}

function toSafeLocale(locale?: string) {
  const normalized = (locale || "en").toLowerCase();
  if (DEMO_LANGUAGE_OPTIONS.some((lang) => lang.code === normalized)) {
    return normalized;
  }
  return "en";
}

export default function AddWordDemoCard({
  locale = "en",
}: {
  locale?: string;
}) {
  const tDictionary = useTranslations("dictionary");
  const tWordle = useTranslations("wordle");
  const router = useRouter();

  const [language, setLanguage] = useState<DemoLanguageCode>("fr");
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [magicSuggestions, setMagicSuggestions] = useState<MagicSuggestion[]>(
    [],
  );
  const [examplePhrase, setExamplePhrase] = useState<ExamplePhrase | null>(
    null,
  );
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [isLoadingMagic, setIsLoadingMagic] = useState(false);
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isCreatingWordle, setIsCreatingWordle] = useState(false);
  const [wordleError, setWordleError] = useState<string | null>(null);
  const [burstSeed, setBurstSeed] = useState(0);
  const [translatedWord, setTranslatedWord] = useState("");
  const [translationUpdateTick, setTranslationUpdateTick] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const lastRequestedWordRef = useRef<string | null>(null);
  const lastTranslationRequestAtRef = useRef(0);

  const debouncedWord = useDebounce(word.trim(), 2000);
  const sourceLanguage = useMemo(() => toSafeLocale(locale), [locale]);
  const showTranslationField = translation.length > 0;

  const createWordleMutation = useMutation({
    mutationFn: createWordleGame,
  });

  const translateMutation = useMutation({
    mutationFn: (payload: { word: string; lang: string; targetLang: string }) =>
      suggestTranslation({
        word: payload.word,
        lang: payload.lang,
        targetLang: payload.targetLang,
        endpoint: "/api/words/translate-suggest",
      }),
  });

  const suggestWordsDemoMutation = useMutation({
    mutationFn: suggestAiWordsDemo,
  });

  const suggestPhrasesDemoMutation = useMutation({
    mutationFn: suggestAiDemoPhrases,
  });

  async function handleCreateWordle() {
    if (isCreatingWordle) {
      return;
    }

    const normalizedWord = word.trim().toLocaleUpperCase(language);

    if (normalizedWord.length < 3 || normalizedWord.length > 12) {
      setWordleError(tWordle("errors.word_length_range"));
      return;
    }

    if (!/^\p{L}+$/u.test(normalizedWord)) {
      setWordleError(tWordle("errors.word_letters_only"));
      return;
    }

    setWordleError(null);
    setIsCreatingWordle(true);

    try {
      const data = await createWordleMutation.mutateAsync({
        locale,
        language,
        word: normalizedWord,
        maxTries: 6,
        noteToSolver: "Good job!",
      });

      if (typeof data?.sharePath !== "string") {
        setWordleError(tWordle("errors.create_failed"));
        return;
      }

      router.push(data.sharePath);
    } catch {
      setWordleError(tWordle("errors.create_failed"));
    } finally {
      setIsCreatingWordle(false);
    }
  }

  const handleLanguageChange = (nextLanguage: DemoLanguageCode) => {
    setLanguage(nextLanguage);
    setWord("");
    setTranslation("");
    setMagicSuggestions([]);
    setExamplePhrase(null);
    setTranslatedWord("");
    setTranslationUpdateTick(0);
    setIsLoadingTranslations(false);
    setIsLoadingMagic(false);
    setIsLoadingPhrase(false);
    lastRequestedWordRef.current = null;
  };

  useEffect(() => {
    let timeoutId: number | null = null;

    const scheduleFocus = () => {
      timeoutId = window.setTimeout(() => {
        setFocusTrigger((prev) => prev + 1);
      }, 350);
    };

    if (document.readyState === "complete") {
      scheduleFocus();
    } else {
      window.addEventListener("load", scheduleFocus, { once: true });
    }

    return () => {
      window.removeEventListener("load", scheduleFocus);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (debouncedWord.length < 2) {
      setTranslation("");
      setMagicSuggestions([]);
      setExamplePhrase(null);
      setTranslatedWord("");
      setTranslationUpdateTick(0);
      setIsLoadingTranslations(false);
      setIsLoadingMagic(false);
      setIsLoadingPhrase(false);
      lastRequestedWordRef.current = null;
      return;
    }

    const normalizedWord = debouncedWord.toLowerCase();

    if (lastRequestedWordRef.current === normalizedWord) {
      return;
    }

    let isCancelled = false;
    const elapsed = Date.now() - lastTranslationRequestAtRef.current;
    const delayMs = Math.max(0, 6000 - elapsed);
    let timeoutId: number | null = null;

    const runTranslation = async () => {
      const requestWord = debouncedWord;
      const requestWordKey = normalizedWord;

      lastRequestedWordRef.current = requestWordKey;
      lastTranslationRequestAtRef.current = Date.now();

      setIsLoadingTranslations(true);
      setMagicSuggestions([]);
      setExamplePhrase(null);
      setIsLoadingMagic(false);
      setIsLoadingPhrase(false);

      try {
        const data = await translateMutation.mutateAsync({
          word: requestWord,
          lang: language,
          targetLang: sourceLanguage,
        });
        if (!isCancelled) {
          const firstSuggestion = Array.isArray(data.suggestions)
            ? String((data.suggestions as string[])[0] || "")
            : "";
          setTranslation(firstSuggestion);
          setTranslatedWord(requestWord);
          if (firstSuggestion) {
            setTranslationUpdateTick((prev) => prev + 1);
          }
        }
      } catch {
        if (!isCancelled) {
          setTranslation("");
          setTranslatedWord("");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTranslations(false);
        }
      }
    };

    timeoutId = window.setTimeout(() => {
      void runTranslation();
    }, delayMs);

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [debouncedWord, language, sourceLanguage]);

  useEffect(() => {
    if (translationUpdateTick === 0 || !translation || !translatedWord) {
      return;
    }

    let isCancelled = false;

    const runDemoPipeline = async () => {
      setIsLoadingMagic(true);
      setIsLoadingPhrase(true);

      let resolvedSuggestions: MagicSuggestion[] = [];

      try {
        const data = await suggestWordsDemoMutation.mutateAsync({
          word: translatedWord,
          translation,
          language,
          sourceLanguage,
        });

        if (!isCancelled) {
          resolvedSuggestions = Array.isArray(data.suggestions)
            ? (data.suggestions as MagicSuggestion[]).slice(0, 3)
            : [];
          setMagicSuggestions(resolvedSuggestions);
          setBurstSeed((prev) => prev + 1);
        }
      } catch {
        if (!isCancelled) {
          setMagicSuggestions([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMagic(false);
        }
      }

      try {
        const phraseData = await suggestPhrasesDemoMutation.mutateAsync({
          word: translatedWord,
          translation,
          language,
          sourceLanguage,
          magicWords: resolvedSuggestions.map((item) => item.word),
        });

        if (!isCancelled) {
          const phrase =
            typeof phraseData.phrase === "string" ? phraseData.phrase : "";
          const phraseTranslation =
            typeof phraseData.translation === "string"
              ? phraseData.translation
              : "";

          if (phrase && phraseTranslation) {
            setExamplePhrase({ phrase, translation: phraseTranslation });
          } else {
            setExamplePhrase(null);
          }
        }
      } catch {
        if (!isCancelled) {
          setExamplePhrase(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPhrase(false);
        }
      }
    };

    void runDemoPipeline();

    return () => {
      isCancelled = true;
    };
  }, [
    translationUpdateTick,
    translation,
    translatedWord,
    language,
    sourceLanguage,
  ]);

  useEffect(() => {
    if (!isLoadingPhrase && examplePhrase) {
      setShowSaveButton(false);
      const timer = window.setTimeout(() => {
        setShowSaveButton(true);
      }, 500);

      return () => {
        window.clearTimeout(timer);
      };
    }

    setShowSaveButton(false);
  }, [isLoadingPhrase, examplePhrase]);

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg)] p-6 shadow-2xl shadow-black/10 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 text-primary-600 dark:text-primary-400">
          <WandSparkles className="h-5 w-5" />
          <p className="text-sm font-bold uppercase tracking-[0.08em]">
            {tDictionary("add_word")}
          </p>
          <div className="ml-1 flex items-center gap-0.5">
            {DEMO_LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => handleLanguageChange(option.code)}
                aria-label={option.name}
                aria-pressed={language === option.code}
                className={`flex size-fit cursor-pointer items-center justify-center rounded-sm border transition-colors duration-200 ${
                  language === option.code
                    ? "border-primary-500 shadow-sm shadow-primary-500/40"
                    : "border-transparent"
                }`}
              >
                <FlagIcon code={option.code} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`grid gap-3 ${showTranslationField ? "sm:grid-cols-2" : "sm:grid-cols-1"} flex justify-center items-center `}
      >
        <div className="space-y-1">
          {/* <label className="text-sm font-medium text-[var(--fg)]/70">
            {tDictionary("word")}
          </label> */}
          <AutoSuggest
            language={language}
            value={word}
            onChange={setWord}
            placeholder={DEMO_LANGUAGE_PLACEHOLDERS[language]}
            autoFocus
            focusTrigger={focusTrigger}
          />
        </div>
        {showTranslationField && (
          <div className="space-y-1">
            {/* <label className="text-sm font-medium text-[var(--fg)]/70">
              {tDictionary("translation")}
            </label> */}
            <div
              style={{
                animation:
                  "demo-explode 640ms cubic-bezier(0.2, 1.2, 0.2, 1) both",
              }}
              className="rounded-xl border border-primary-500/45 bg-primary-500/15 p-1"
            >
              <input
                value={translation}
                readOnly
                aria-disabled="true"
                className="translationPreviewInput w-full rounded-lg border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-lg font-semibold text-primary-800 dark:text-primary-200"
              />
            </div>
          </div>
        )}
      </div>

      <div className=" rounded-2xl  p-0">
        {(isLoadingMagic || magicSuggestions.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {magicSuggestions.map((item, i) => {
              const style = {
                animation: `demo-explode 700ms cubic-bezier(0.2, 1.2, 0.2, 1) ${i * 110}ms both`,
                transformOrigin: "center",
              } as const;

              return (
                <div
                  key={`${burstSeed}-${item.word}-${item.translation}`}
                  style={style}
                  className="magicWordDemo inline-flex items-center gap-2 rounded-2xl border border-primary-500/45 bg-primary-500/15 px-5 py-3 text-lg font-bold text-primary-700 dark:text-primary-300"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary-500/80" />
                  {item.word} - {item.translation}
                </div>
              );
            })}

            {isLoadingMagic && magicSuggestions.length === 0 && (
              <div className="flex items-center gap-1.5 py-2">
                <Sparkles className="h-4 w-4 animate-pulse text-primary-500/80" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500/70 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500/70" />
              </div>
            )}
          </div>
        )}

        {(isLoadingPhrase || examplePhrase) && (
          <div className="mt-4 border-t border-primary-500/20 pt-3 text-center">
            {examplePhrase ? (
              <>
                <div
                  key={`${burstSeed}-phrase-${examplePhrase.phrase}`}
                  style={{
                    animation:
                      "demo-explode 760ms cubic-bezier(0.2, 1.2, 0.2, 1) both",
                  }}
                  className="mx-auto max-w-xl rounded-2xl border border-primary-500/45 bg-primary-500/15 px-5 py-3"
                >
                  <p className="phraseDemoMain text-base font-bold text-primary-800 dark:text-primary-200">
                    {examplePhrase.phrase}
                  </p>
                  <p className="phraseDemoSub mt-1 text-sm font-medium text-primary-700/85 dark:text-primary-300/90">
                    {examplePhrase.translation}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500/70 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500/70 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500/70" />
              </div>
            )}
          </div>
        )}
      </div>

      {showSaveButton && examplePhrase && (
        <div
          style={{
            animation: "demo-explode 760ms cubic-bezier(0.2, 1.2, 0.2, 1) both",
          }}
          className="mt-5 flex w-full flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={`/${locale}/signup`}
            className="group inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97]"
          >
            {tDictionary("save_word_cta")}
          </Link>

          <button
            type="button"
            onClick={handleCreateWordle}
            disabled={isCreatingWordle}
            className="flex cursor-pointer items-center gap-2 rounded-none bg-yellow-400 px-5 py-3 text-xl font-extrabold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xl"
          >
            <Puzzle className="h-4 w-4 sm:h-5 sm:w-5" />
            Wordle
          </button>
        </div>
      )}

      {wordleError && (
        <p className="mt-3 text-sm font-semibold text-red-600">{wordleError}</p>
      )}

      <style jsx>{`
        .translationPreviewInput,
        .phraseDemoMain {
          opacity: 1;
          -webkit-text-fill-color: var(--color-primary-700);
        }

        .magicWordDemo {
          -webkit-text-fill-color: var(--color-primary-600);
        }

        .phraseDemoSub {
          -webkit-text-fill-color: var(--color-primary-600);
        }

        :global(.dark) .translationPreviewInput,
        :global(.dark) .phraseDemoMain {
          -webkit-text-fill-color: var(--color-primary-200);
        }

        .magicWordDemo {
          -webkit-text-fill-color: var(--color-primary-300);
        }

        .phraseDemoSub {
          -webkit-text-fill-color: var(--color-primary-300);
        }

        @keyframes demo-explode {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.25) rotate(-10deg);
            filter: blur(4px);
          }
          60% {
            opacity: 1;
            transform: translateY(-4px) scale(1.08) rotate(1deg);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  );
}
