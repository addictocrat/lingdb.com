"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import AutoSuggest from "@/components/dictionary/AutoSuggest";
import { Plus, Puzzle, Sparkles, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MagicSuggestion = {
  word: string;
  translation: string;
};

type ExamplePhrase = {
  phrase: string;
  translation: string;
};

const LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "tr", name: "Turkish" },
] as const;

const LANGUAGE_PLACEHOLDERS: Record<
  (typeof LANGUAGE_OPTIONS)[number]["code"],
  string
> = {
  en: "school",
  fr: "fleur",
  de: "küchenchef",
  es: "hermano",
  tr: "harika",
};

function FlagIcon({
  code,
}: {
  code: (typeof LANGUAGE_OPTIONS)[number]["code"];
}) {
  if (code === "en") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="h-5 w-7 overflow-hidden rounded-sm"
        aria-hidden="true"
      >
        <rect width="60" height="40" fill="#012169" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
        <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
        <rect x="24" width="12" height="40" fill="#fff" />
        <rect y="14" width="60" height="12" fill="#fff" />
        <rect x="26" width="8" height="40" fill="#C8102E" />
        <rect y="16" width="60" height="8" fill="#C8102E" />
      </svg>
    );
  }

  if (code === "fr") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="h-5 w-7 overflow-hidden rounded-sm"
        aria-hidden="true"
      >
        <rect width="20" height="40" fill="#0055A4" />
        <rect x="20" width="20" height="40" fill="#fff" />
        <rect x="40" width="20" height="40" fill="#EF4135" />
      </svg>
    );
  }

  if (code === "de") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="h-5 w-7 overflow-hidden rounded-sm"
        aria-hidden="true"
      >
        <rect width="60" height="13.33" fill="#000" />
        <rect y="13.33" width="60" height="13.33" fill="#DD0000" />
        <rect y="26.66" width="60" height="13.34" fill="#FFCE00" />
      </svg>
    );
  }

  if (code === "es") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="h-5 w-7 overflow-hidden rounded-sm"
        aria-hidden="true"
      >
        <rect width="60" height="40" fill="#AA151B" />
        <rect y="10" width="60" height="20" fill="#F1BF00" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 60 40"
      className="h-5 w-7 overflow-hidden rounded-sm"
      aria-hidden="true"
    >
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="26" cy="20" r="8" fill="#fff" />
      <circle cx="28" cy="20" r="6.5" fill="#E30A17" />
      <path
        d="M37.5 20l3-1.2-1.6 2.7 3.1.3-2.7 1.5.9 3-2.7-1.6-2.6 1.6.8-3-2.6-1.5 3-.3-1.5-2.7z"
        fill="#fff"
      />
    </svg>
  );
}

function toSafeLocale(locale?: string) {
  const normalized = (locale || "en").toLowerCase();
  if (LANGUAGE_OPTIONS.some((lang) => lang.code === normalized)) {
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

  const [language, setLanguage] =
    useState<(typeof LANGUAGE_OPTIONS)[number]["code"]>("fr");
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

  async function handleCreateWordle() {
    if (isCreatingWordle) {
      return;
    }

    const normalizedWord = word.trim().toUpperCase();

    if (normalizedWord.length < 3 || normalizedWord.length > 12) {
      setWordleError(tWordle("errors.word_length_range"));
      return;
    }

    if (!/^[A-Z]+$/.test(normalizedWord)) {
      setWordleError(tWordle("errors.word_letters_only"));
      return;
    }

    setWordleError(null);
    setIsCreatingWordle(true);

    try {
      const res = await fetch("/api/wordle/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          language,
          word: normalizedWord,
          maxTries: 6,
          noteToSolver: "Good job!",
        }),
      });

      const data = await res.json();

      if (!res.ok || typeof data?.sharePath !== "string") {
        setWordleError(data?.error || tWordle("errors.create_failed"));
        return;
      }

      router.push(data.sharePath);
    } catch {
      setWordleError(tWordle("errors.create_failed"));
    } finally {
      setIsCreatingWordle(false);
    }
  }

  const handleLanguageChange = (
    nextLanguage: (typeof LANGUAGE_OPTIONS)[number]["code"],
  ) => {
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
        const url = new URL(
          "/api/words/translate-suggest",
          window.location.origin,
        );
        url.searchParams.set("word", requestWord);
        url.searchParams.set("lang", language);
        url.searchParams.set("targetLang", sourceLanguage);

        const res = await fetch(url.toString());
        if (!res.ok) {
          if (!isCancelled) {
            setTranslation("");
            setTranslatedWord("");
          }
          return;
        }

        const data = await res.json();
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
        const res = await fetch("/api/ai/suggest-words-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: translatedWord,
            translation,
            language,
            sourceLanguage,
          }),
        });

        if (!res.ok) {
          if (!isCancelled) {
            setMagicSuggestions([]);
          }
          return;
        }

        const data = await res.json();
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
        const phraseRes = await fetch("/api/ai/suggest-demo-phrases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: translatedWord,
            translation,
            language,
            sourceLanguage,
            magicWords: resolvedSuggestions.map((item) => item.word),
          }),
        });

        if (!phraseRes.ok) {
          if (!isCancelled) {
            setExamplePhrase(null);
          }
          return;
        }

        const phraseData = await phraseRes.json();
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
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => handleLanguageChange(option.code)}
                aria-label={option.name}
                aria-pressed={language === option.code}
                className={`cursor-pointer rounded-md border p-0.5 transition-transform duration-200 hover:scale-105 ${
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
            placeholder={LANGUAGE_PLACEHOLDERS[language]}
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
              className="rounded-xl border border-pink-500/45 bg-pink-500/15 p-1"
            >
              <input
                value={translation}
                readOnly
                aria-disabled="true"
                className="translationPreviewInput w-full rounded-lg border border-pink-500/35 bg-pink-500/10 px-3 py-2 text-lg font-semibold text-pink-800 dark:text-pink-200"
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
                  className="demoMagicWord inline-flex items-center gap-2 rounded-2xl border border-pink-500/45 bg-pink-500/15 px-5 py-3 text-lg font-bold text-pink-700 dark:text-pink-300"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-pink-500/80" />
                  {item.word} - {item.translation}
                </div>
              );
            })}

            {isLoadingMagic && magicSuggestions.length === 0 && (
              <div className="flex items-center gap-1.5 py-2">
                <Sparkles className="h-4 w-4 animate-pulse text-pink-500/80" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-pink-500/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-pink-500/70 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-pink-500/70" />
              </div>
            )}
          </div>
        )}

        {(isLoadingPhrase || examplePhrase) && (
          <div className="mt-4 border-t border-pink-500/20 pt-3 text-center">
            {examplePhrase ? (
              <>
                <div
                  key={`${burstSeed}-phrase-${examplePhrase.phrase}`}
                  style={{
                    animation:
                      "demo-explode 760ms cubic-bezier(0.2, 1.2, 0.2, 1) both",
                  }}
                  className="mx-auto max-w-xl rounded-2xl border border-pink-500/45 bg-pink-500/15 px-5 py-3"
                >
                  <p className="demoPhraseText text-base font-bold text-pink-800 dark:text-pink-200">
                    {examplePhrase.phrase}
                  </p>
                  <p className="demoPhraseTranslation mt-1 text-sm font-medium text-pink-700/85 dark:text-pink-300/90">
                    {examplePhrase.translation}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500/70 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500/70 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500/70" />
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
            <Plus className="h-5 w-5 transition-transform group-hover:translate-x-1" />
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
        .demoPhraseText {
          opacity: 1;
          -webkit-text-fill-color: rgb(157 23 77);
        }

        .demoMagicWord {
          opacity: 1;
          -webkit-text-fill-color: rgb(190 24 93);
        }

        .demoPhraseTranslation {
          opacity: 1;
          -webkit-text-fill-color: rgba(190, 24, 93, 0.85);
        }

        :global(.dark) .translationPreviewInput,
        :global(.dark) .demoPhraseText {
          -webkit-text-fill-color: rgb(251 207 232);
        }

        :global(.dark) .demoMagicWord {
          -webkit-text-fill-color: rgb(249 168 212);
        }

        :global(.dark) .demoPhraseTranslation {
          -webkit-text-fill-color: rgba(249, 168, 212, 0.9);
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
