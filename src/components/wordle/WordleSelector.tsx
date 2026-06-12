"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/utils/constants";
import { Puzzle, ArrowRight, Loader2 } from "lucide-react";

const languagesList: { code: SupportedLocale; flag: string }[] = [
  { code: "en", flag: "gb" },
  { code: "tr", flag: "tr" },
  { code: "de", flag: "de" },
  { code: "fr", flag: "fr" },
  { code: "es", flag: "es" },
];

export default function WordleSelector({ locale }: { locale: string }) {
  const t = useTranslations("wordle");
  const tCommon = useTranslations("common");
  const tLanguages = useTranslations("settings.languages");
  const router = useRouter();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(() => {
    const normalizedLocale = locale.toLowerCase();
    return SUPPORTED_LOCALES.includes(normalizedLocale as SupportedLocale)
      ? (normalizedLocale as SupportedLocale)
      : "en";
  });

  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useGSAP(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" }
    );
  }, { scope: containerRef });

  async function handlePlayRandom() {
    setIsLoadingGame(true);
    setError(null);
    try {
      const response = await fetch(`/api/wordle/random?language=${selectedLanguage}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load game");
      }
      router.push(`/${locale}/wordle/game/${data.gameId}`);
    } catch (err: any) {
      setError(err.message || "Failed to fetch a random game. Please try again.");
      setIsLoadingGame(false);
    }
  }

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16 flex flex-col items-center justify-center min-h-[70vh]">
      <div 
        ref={cardRef} 
        className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--surface)]/90 backdrop-blur-2xl p-6 sm:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--fg)]">
            {t("play_title")}
          </h1>
        </div>
 
        <div className="mt-10 sm:mt-12 space-y-8">
          <div className="space-y-4">
            <label className="text-xl sm:text-2xl font-black text-[var(--fg)] tracking-wide uppercase">
              {t("select_language")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left cursor-pointer transition-all duration-300 outline-none select-none ${
                      isSelected
                        ? "border-[#0001d8] bg-[#0001d8]/10 text-[var(--fg)] ring-4 ring-[#0001d8]/20 scale-[1.02] shadow-lg shadow-[#0001d8]/10"
                        : "border-[var(--border-color)] bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--fg)]/30 hover:scale-[1.01]"
                    }`}
                  >
                    <span className={`fi fi-${lang.flag} text-3xl rounded-md overflow-hidden shadow-sm flex-shrink-0`} />
                    <span className="text-lg font-black tracking-tight leading-none">
                      {tLanguages(lang.code)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
 
          {error && (
            <div className="border border-red-300/50 bg-red-500/10 px-5 py-4 text-lg font-semibold text-red-600 dark:text-red-400 rounded-xl">
              {error}
            </div>
          )}
 
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handlePlayRandom}
              disabled={isLoadingGame}
              className="flex-1 inline-flex items-center justify-center gap-3 bg-[#0001d8] hover:bg-[#0001d8]/90 text-white px-8 py-5 text-xl font-black rounded-2xl cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0001d8]/20 select-none scale-[1.01] hover:scale-[1.02] active:scale-[1.0]"
            >
              {isLoadingGame ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{t("fetching_game")}</span>
                </>
              ) : (
                <>
                  <span>{t("play_random")}</span>
                  <ArrowRight className="h-6 w-6" />
                </>
              )}
            </button>
 
            <Link
              href={`/${locale}/wordle/create`}
              className="flex-1 inline-flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-yellow-400 px-8 py-5 text-xl font-black rounded-2xl cursor-pointer transition-all duration-300 select-none scale-[1.01] hover:scale-[1.02] active:scale-[1.0]"
            >
              {t("create_custom")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
