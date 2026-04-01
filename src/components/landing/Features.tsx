'use client';

import { useEffect, useRef } from 'react';
import { Gamepad2, Sparkles, Brain, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { useTranslations } from 'next-intl';

const features = [
  {
 icon: Sparkles,
    titleKey: 'feature_dictionaries',
    descKey: 'feature_dictionaries_desc',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    glow: 'rgba(234, 179, 8, 0.5)',
  },
 
 
  {
    icon: Brain,
    titleKey: 'feature_study',
    descKey: 'feature_study_desc',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    glow: 'rgba(34, 197, 94, 0.5)',
  },
   {
    icon: Gamepad2,
    titleKey: 'feature_minigames',
    descKey: 'feature_minigames_desc',
    color: 'text-[#a855f7]',
    bg: 'bg-[#a855f7]/10 dark:bg-[#a855f7]/20',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  {
    icon: Users,
    titleKey: 'feature_community',
    descKey: 'feature_community_desc',
    color: 'text-accent-500',
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    glow: 'rgba(247, 123, 85, 0.5)',
  },
];

export default function Features() {
  const t = useTranslations('landing');
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
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
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
      boxShadow: `0 20px 40px -10px ${features[index].glow}`,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      y: 0,
      scale: 1,
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  return (
    <section ref={sectionRef} className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t('features_heading_1')}
            <span className="text-primary-500">{t('features_heading_highlight')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-[var(--fg)]/60">
            {t('features_subheading')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.titleKey}
              ref={(el) => {
                 cardsRef.current[index] = el;
              }}
              className="feature-card group rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-colors duration-300"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
            >
              <div
                className={`mb-4 inline-flex rounded-xl p-3 ${feature.bg}`}
              >
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
