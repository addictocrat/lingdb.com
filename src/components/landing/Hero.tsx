"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import AddWordDemoCard from "@/components/landing/AddWordDemoCard";

export default function Hero({ locale = "en" }: { locale?: string }) {
  const t = useTranslations("landing");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24"
    >
      {/* Background gradient */}
      {/* <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-accent-500/8 blur-[100px]" />
      </div> */}

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-600 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge_text")}
        </div>

        {/* Title */}
        <h1 className="hero-title text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-7xl">
          {t("hero_title")}{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            {/* {t("hero_title_highlight")} */}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle mx-auto mt-6 max-w-2xl text-xl text-[var(--fg)]/60 sm:text-2xl">
          {t("hero_subtitle")}
        </p>

        <div className="hero-cards relative z-20 mx-auto my-8 max-w-3xl">
          <AddWordDemoCard locale={locale} />
        </div>

        {/* CTA */}
        <div className="hero-cta relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}/signup`}
            className="group flex items-center gap-2 rounded-2xl bg-primary-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.97]"
          >
            {t("cta_button")}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={`/${locale}/library`}
            className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-8 py-4 text-base font-semibold transition-all duration-200 hover:bg-[var(--surface)] hover:shadow-md"
          >
            {t("browse_library")}
          </Link>
        </div>
      </div>

      {/* Interactive add-word demo card */}
    </section>
  );
}
