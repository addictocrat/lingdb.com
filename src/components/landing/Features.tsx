"use client";

import { useEffect, useRef } from "react";
import { Gamepad2, Sparkles, Brain, Users } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import { useTranslations } from "next-intl";
import { LANDING_FEATURES } from "@/lib/constants/landing";

export default function Features() {
  const t = useTranslations("landing");
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.set(cardsRef.current, {
        y: 60,
        opacity: 0,
      });

      gsap.to(cardsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      y: -5,
      scale: 1.02,
      boxShadow: `0 20px 40px -10px ${LANDING_FEATURES[index].glow}`,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: "none",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <section
      ref={sectionRef}
      className="border-y border-[var(--border-color)] bg-[var(--bg)]/80 py-20 backdrop-blur-xl sm:px-6 md:py-22"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("features_heading_1")}
            <span className="text-primary-500">
              {t("features_heading_highlight")}
            </span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_FEATURES.map((feature, index) => (
            <div
              key={feature.titleKey}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="feature-card group rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-colors duration-300"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <div className={`mb-4 inline-flex rounded-xl p-3 ${feature.bg}`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="mb-2 text-xl font-bold">{t(feature.titleKey)}</h3>
              <p className="text-lg leading-relaxed text-[var(--fg)]/60">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
