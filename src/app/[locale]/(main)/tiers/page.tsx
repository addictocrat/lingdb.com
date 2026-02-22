'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { Check, X, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function TiersPage() {
   const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('tiers');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial state
      gsap.set('.pricing-card', {
        y: 60,
        opacity: 0,
      });

      // Animate to final state
      gsap.to('.pricing-card', {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: mainRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-16 flex flex-col items-center text-center">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-[var(--fg)] sm:text-6xl">
          {t('page_title')}
        </h1>
        <p className="max-w-2xl text-xl text-[var(--fg)]/70">
          {t('page_subtitle')}
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {/* FREE TIER */}
        <div className="pricing-card flex flex-col justify-between rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8 shadow-sm">
          <div>
            <h3 className="text-3xl font-bold text-[var(--fg)]">{t('free_title')}</h3>
            <div className="mt-4 flex items-baseline text-6xl font-extrabold">
              $0
              <span className="ml-1 text-2xl font-medium text-[var(--fg)]/50">{t('monthly')}</span>
            </div>
            <p className="mt-4 text-[var(--fg)]/70">
              {t('free_desc')}
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-[var(--fg)]/80">{t('feature_unlimited_dict')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-[var(--fg)]/80">{t('feature_unlimited_words')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-[var(--fg)]/80">{t('feature_flashcards')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-[var(--fg)]/80">{t('feature_ai_30')}</span>
              </li>
              <li className="flex items-center gap-3 text-[var(--fg)]/40">
                <X className="h-5 w-5" />
                <span>{t('feature_ads_supported')}</span>
              </li>
            </ul>
          </div>
          
          <Button
            variant="secondary"
            className="mt-8 w-full"
            onClick={() => router.push(`/${locale}/dashboard`)}
          >
            {t('current_plan')}
          </Button>
        </div>

        {/* PREMIUM TIER */}
        <div className="pricing-card relative flex flex-col justify-between rounded-3xl border-2 border-primary-500 bg-[var(--surface)] p-8 shadow-xl shadow-primary-500/10">
          <div className="absolute -top-4 right-8 rounded-full bg-primary-500 px-4 py-1 text-sm font-bold uppercase tracking-wider text-white">
            {t('most_popular')}
          </div>
          
          <div>
            <h3 className="flex items-center gap-2 text-3xl font-bold text-primary-500 dark:text-primary-400">
              <ShieldCheck className="h-6 w-6" /> {t('premium_title')}
            </h3>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-6xl font-extrabold">{t('price_premium')}</span>
              <span className="text-3xl font-bold text-red-500" style={{ textDecoration: 'line-through' }}>
                {t('price_original')}
              </span>
              <span className="text-2xl font-medium text-[var(--fg)]/50">{t('monthly')}</span>
            </div>
            <p className="mt-4 text-[var(--fg)]/70">
              {t('premium_desc')}
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary-500" />
                <span className="font-semibold text-[var(--fg)]">{t('feature_everything_free')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-[var(--fg)]/90">{t('feature_ai_100')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-[var(--fg)]/90">{t('feature_no_ads')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-[var(--fg)]/90">{t('feature_faster_generation')}</span>
              </li>
            </ul>
          </div>
          
          <div className="mt-8 space-y-3">
            <Button
              className="w-full text-xl shadow-lg opacity-50 cursor-not-allowed"
              disabled={true}
              onClick={() => {}}
            >
              Coming Soon
            </Button>
            <p className="text-center text-sm text-[var(--fg)]/50 italic">
              Currently, we can't accept payments outside from Turkey due to limitations. We provide unlimited free plan for now.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
