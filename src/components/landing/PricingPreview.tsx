'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, X as XIcon } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { useTranslations } from 'next-intl';

const plans = [
  {
    nameKey: 'free_title',
    price: '$0',
    periodKey: 'free_period',
    descriptionKey: 'free_desc',
    ctaKey: 'free_cta',
    ctaVariant: 'secondary' as const,
    features: [
      { textKey: 'feature_20_dict', included: true },
    
      { textKey: 'feature_30_ai', included: true },
      { textKey: 'feature_flashcards', included: true },
     
      { textKey: 'feature_unlimited_dict', included: false },
      { textKey: 'feature_100_ai', included: false },
      { textKey: 'feature_priority', included: false },
    ],
  },
  {
    nameKey: 'premium_title',
    price: '$1.49',
    originalPrice: '$7.45',
    periodKey: 'premium_period',
    descriptionKey: 'premium_desc',
    ctaKey: 'premium_cta',
    ctaVariant: 'primary' as const,
    popular: true,
    features: [
      { textKey: 'feature_unlimited_dict', included: true },
    
      { textKey: 'feature_100_ai', included: true },
      { textKey: 'feature_flashcards', included: true },
     
      { textKey: 'feature_no_ads', included: true },
      { textKey: 'feature_priority', included: true },
      { textKey: 'feature_early_access', included: true },
    ],
  },
];

export default function PricingPreview({ locale = 'en' }: { locale?: string }) {
  const t = useTranslations('landing');
  const tTiers = useTranslations('tiers');
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.pricing-card', {
        y: 50,
        opacity: 0,
      });

      gsap.to('.pricing-card', {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.2,
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

  return (
    <section ref={sectionRef} className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t('pricing_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xl text-[var(--fg)]/60">
            {t('pricing_subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.nameKey}
              className={`pricing-card relative rounded-2xl border p-8 transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? 'border-primary-500 bg-[var(--surface)] shadow-lg shadow-primary-500/10'
                  : 'border-[var(--border-color)] bg-[var(--surface)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-sm font-bold text-white whitespace-nowrap">
                  {t('most_popular')}
                </div>
              )}

              <h3 className="text-2xl font-bold">{tTiers(plan.nameKey)}</h3>
              <p className="mt-1 text-lg text-[var(--fg)]/50">
                {t(plan.descriptionKey)}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">{plan.price}</span>
                {plan.originalPrice && (
                  <span className="text-2xl font-bold text-red-500" style={{ textDecoration: 'line-through' }}>
                    {plan.originalPrice}
                  </span>
                )}
                <span className="text-lg text-[var(--fg)]/40">
                  {t(plan.periodKey)}
                </span>
              </div>

              <div
                className={`mt-6 block rounded-xl py-3 text-center text-lg font-bold transition-all duration-200 ${
                  plan.ctaVariant === 'primary'
                    ? 'bg-primary-500/50 text-white/50 cursor-not-allowed'
                    : 'border border-[var(--border-color)] hover:bg-[var(--border-color)] hover:shadow-md'
                }`}
              >
                {plan.ctaVariant === 'primary' ? 'Coming Soon' : t(plan.ctaKey)}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.textKey} className="flex items-center gap-3 text-lg">
                    {feature.included ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    ) : (
                      <XIcon className="h-4 w-4 flex-shrink-0 text-[var(--fg)]/20" />
                    )}
                    <span
                      className={
                        feature.included ? '' : 'text-[var(--fg)]/30'
                      }
                    >
                      {t(feature.textKey)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
