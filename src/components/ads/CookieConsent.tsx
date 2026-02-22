'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Cookies from 'js-cookie';
import Link from 'next/link';
import gsap from 'gsap';
import Button from '@/components/ui/Button';

export const COOKIE_CONSENT_KEY = 'lingdb_cookie_consent';

export default function CookieConsent() {
  const t = useTranslations('cookie_consent');
  const tLegal = useTranslations('legal.cookies');
  const locale = useLocale();
  const [show, setShow] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if consent has already been given or rejected
    const consent = Cookies.get(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (show && bannerRef.current) {
      // Slide up animation
      gsap.fromTo(
        bannerRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [show]);

  const handleConsent = (value: 'accepted' | 'rejected') => {
    if (bannerRef.current) {
      // Slide down animation before unmounting
      gsap.to(bannerRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          Cookies.set(COOKIE_CONSENT_KEY, value, { expires: 365 }); // Save for 1 year
          setShow(false);
          // If accepted, we need to reload the page or trigger an event so AdSense scripts can load
          if (value === 'accepted') {
            window.location.reload();
          }
        },
      });
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe pointer-events-none">
      <div 
        ref={bannerRef}
        className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-2xl"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-bold text-[var(--fg)]">
              {tLegal('title')}
            </h3>
            <p className="text-lg text-[var(--fg)]/70">
              {t('message')}
              <Link
                href={`/${locale}/cookies`}
                className="ml-1 font-medium text-primary-500 hover:underline"
              >
                {t('learn_more')}
              </Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => handleConsent('rejected')}
              className="w-full sm:w-auto"
            >
              {t('reject')}
            </Button>
            <Button
              onClick={() => handleConsent('accepted')}
              className="w-full sm:w-auto"
            >
              {t('accept_all')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
