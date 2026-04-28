"use client";

import { useRef, useState, useMemo } from "react";
import { Sparkles, Brain, Type, MessageSquareCode, Save } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import {
  DEMO_WORDS_DATA,
  DEMO_LANGUAGE_OPTIONS,
  type DemoLanguageCode,
} from "@/lib/constants/landing";
import { SUPPORTED_LANGUAGES } from "@/lib/utils/constants";

export default function AIFeatureDemo({ locale = "en" }: { locale?: string }) {
  const t = useTranslations("landing");
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [currentLang] = useState<DemoLanguageCode>(
    locale === "en" ? "es" : "en",
  );

  const currentData = useMemo(() => {
    const wordData = DEMO_WORDS_DATA[activeWordIndex];
    const sourceData =
      wordData.languages[currentLang] || wordData.languages["en"];
    const targetData =
      wordData.languages[locale as DemoLanguageCode] ||
      wordData.languages["en"];

    const boldWord = (text: string, word: string) => {
      if (!word) return text;
      const regex = new RegExp(`(${word})`, "gi");
      return text.replace(
        regex,
        `<span class="font-bold text-primary-600 dark:text-primary-400">$1</span>`,
      );
    };

    return {
      sourceWord: sourceData.word,
      translation: targetData.word,
      magicWords: sourceData.magicWords.map((mw, i) => ({
        source: mw.word,
        target: targetData.magicWords[i]?.word || mw.translation,
      })),
      magicPhrase: {
        source: boldWord(sourceData.magicPhrase.phrase, sourceData.word),
        target: boldWord(targetData.magicPhrase.phrase, targetData.word),
      },
    };
  }, [activeWordIndex, currentLang, locale]);

  const sourceFlag =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.flagClass ||
    "fi fi-xx";
  const targetFlag =
    SUPPORTED_LANGUAGES.find((l) => l.code === locale)?.flagClass || "fi fi-xx";

  const isFirstLoad = useRef(true);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Immediately hide elements to prevent flicker before the delayed animation starts
    gsap.set(".step-card", {
      opacity: 0,
      y: 30,
      scale: 0.95,
      filter: "blur(10px)",
    });
    gsap.set(".step-content-inner", { opacity: 0, y: 10 });
    gsap.set(".magic-item", { opacity: 0, x: -10 });

    const tl = gsap.timeline({
      delay: isFirstLoad.current ? 1 : 0,
      onComplete: () => {
        isFirstLoad.current = false;
        gsap.delayedCall(2, () => {
          setActiveWordIndex((prev) => (prev + 1) % DEMO_WORDS_DATA.length);
        });
      },
    });

    // Initial state
    tl.set(".step-card", {
      opacity: 0,
      y: 30,
      scale: 0.95,
      filter: "blur(10px)",
    });
    tl.set(".connector-path", {
      strokeDashoffset: 1000,
      strokeDasharray: 1000,
    });
    tl.set(".step-content-inner", { opacity: 0, y: 10 });
    tl.set(".magic-item", { opacity: 0, x: -10 });

    // Step 1: Save Word
    tl.to("#card-1", {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "power3.out",
    });
    tl.to(
      "#card-1 .step-content-inner",
      { opacity: 1, y: 0, duration: 0.4 },
      "-=0.2",
    );

    // Step 2: Example Usages
    tl.to(
      "#card-2",
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out",
      },
      "+=0.5",
    );
    tl.to(
      "#card-2 .step-content-inner",
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.2",
    );

    // Step 3: Magic Words
    tl.to(
      "#card-3",
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out",
      },
      "+=0.5",
    );
    tl.to(
      "#card-3 .magic-item",
      {
        opacity: 1,
        x: 0,
        stagger: 0.12,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.2",
    );

    // Exit transition
    tl.to(
      ".step-card",
      {
        opacity: 0,
        y: -10,
        duration: 0.5,
        ease: "power2.inOut",
        stagger: 0.05,
      },
      "+=4",
    );
  }, [activeWordIndex, currentLang]);

  return (
    <div ref={containerRef} className="w-full relative py-4">
      <div className="relative flex flex-col lg:flex-row items-stretch justify-between gap-4 lg:gap-0">
        {/* Step 1: Save Word */}
        <div
          id="card-1"
          className="step-card group relative z-10 w-full lg:w-[30%] glass-card px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]/80 backdrop-blur-2xl dark:border-primary-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
              <Save className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-primary-600/80 dark:text-primary-400/80">
              {t("demo_save_word")}
            </span>
          </div>
          <div className="step-content-inner space-y-2">
            <div className="flex flex-col gap-2">
              <span
                className={`text-xl rounded-sm overflow-hidden shadow-sm ring-1 ring-white/10 ${sourceFlag}`}
              />
              <h4 className="text-2xl font-black text-[var(--fg)] tracking-tight truncate">
                {currentData.sourceWord}
              </h4>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-2xl font-black text-primary-600 truncate">
                  {currentData.translation}
                </p>
                <div className="self-end">
                  <span
                    className={`text-xl rounded-sm overflow-hidden shadow-sm ring-1 ring-white/10 ${targetFlag}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Example Usages */}
        <div
          id="card-2"
          className="step-card group relative z-10 w-full lg:w-[30%] glass-card px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]/80 backdrop-blur-2xl dark:border-green-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400">
              <MessageSquareCode className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-green-600/80 dark:text-green-400/80">
              {t("demo_example_usages")}
            </span>
          </div>
          <div className="step-content-inner">
            <div className="p-3 rounded-xl bg-[var(--bg)]/10 border border-[var(--border-color)] text-left">
              <p
                className="text-xs leading-relaxed text-[var(--fg)] font-semibold italic line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: `"${currentData.magicPhrase.source}"`,
                }}
              />
              <div className="my-2 h-px bg-[var(--border-color)]" />
              <p
                className="text-xs leading-relaxed text-[var(--fg)]/70 font-medium"
                dangerouslySetInnerHTML={{
                  __html: currentData.magicPhrase.target,
                }}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Magic Words */}
        <div
          id="card-3"
          className="step-card group relative z-10 w-full lg:w-[30%] glass-card px-6 py-4 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]/80 backdrop-blur-2xl dark:border-purple-500/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-purple-600/80 dark:text-purple-400/80">
              {t("demo_magic_words")}
            </span>
          </div>
          <div className="space-y-1.5">
            {currentData.magicWords.map((mw, i) => (
              <div
                key={i}
                className="magic-item flex justify-between items-center bg-[var(--bg)]/10 px-3 py-2 rounded-lg border border-[var(--border-color)] transition-colors"
              >
                <span className="text-[12px] font-bold text-[var(--fg)]">
                  {mw.source}
                </span>
                <span className="text-[9px] text-primary-600 font-medium">
                  {mw.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.1);
        }
        :global(.dark) .glass-card {
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.4);
        }
        :global(.dark) #card-1 {
          box-shadow: 0 0 25px -10px rgba(0, 1, 216, 0.3);
        }
        :global(.dark) #card-2 {
          box-shadow: 0 0 25px -10px rgba(168, 85, 247, 0.3);
        }
        :global(.dark) #card-3 {
          box-shadow: 0 0 25px -10px rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  );
}
