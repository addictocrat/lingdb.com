"use client";

import { useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import AIFeatureDemo from "@/components/landing/AIFeatureDemo";

export default function Hero({ locale = "en" }: { locale?: string }) {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".hero-badge", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    });
    gsap.from(".hero-title", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      delay: 0.15,
      ease: "power3.out",
    });
    gsap.from(".hero-subtitle", {
      y: 30,
      opacity: 0,
      duration: 0.7,
      delay: 0.3,
      ease: "power3.out",
    });
    gsap.from(".hero-cta", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      delay: 0.45,
      ease: "power3.out",
    });
    gsap.from(".hero-cards", {
      y: 60,
      opacity: 0,
      duration: 1,
      delay: 0.6,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden px-4 py-20 sm:px-6 md:py-22 md:pt-24"
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-accent-500/8 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-600 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge_text")}
        </div>

        {/* Title */}
        <h1 className="hero-title text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-7xl">
          {t("hero_title")}
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mx-auto mt-6 max-w-2xl text-xl text-[var(--fg)]/70 sm:text-2xl">
          {t("hero_subtitle")}
        </p>

        <div className="hero-cards relative z-20 mx-auto my-4 max-w-6xl">
          <AIFeatureDemo locale={locale} />
        </div>

        {/* CTA */}
        <div className="hero-cta relative z-10 mt-10 flex flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href={`/${locale}/signup`}
            className="group flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-primary-500 px-4 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97] whitespace-nowrap"
          >
            {t("cta_button")}
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={`/${locale}/wordle`}
            className="flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-[#fcc419] px-4 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-bold text-slate-900 shadow-lg shadow-[#fcc419]/25 transition-all duration-300 hover:bg-[#fab005] hover:shadow-xl hover:shadow-[#fcc419]/30 active:scale-[0.97] whitespace-nowrap"
          >
            {tNav("wordle")}
          </Link>
        </div>
      </div>
    </section>
  );
}
