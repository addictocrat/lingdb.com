'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layout?: string;
  className?: string;
  userTier?: 'FREE' | 'PREMIUM';
}

export default function AdBanner({
  slotId,
  format = 'auto',
  layout,
  className = '',
  userTier = 'FREE',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 1. Never show ads to premium users
    if (userTier === 'PREMIUM') {
      setShouldRender(false);
      return;
    }

    // 2. Show ads to everyone else regardless of cookie consent
    setShouldRender(true);
  }, [userTier]);

  useEffect(() => {
    if (shouldRender && adRef.current) {
      try {
        // @ts-ignore - Google Adsense global variable
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense injection failed', error);
      }
    }
  }, [shouldRender]);

  if (!shouldRender || userTier === 'PREMIUM') {
    return null; // Don't render anything for premium users
  }

  return (
    <div className={`overflow-hidden rounded-xl bg-[var(--surface-hover)] p-2 text-center shadow-sm ${className}`}>
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-[var(--fg)]/30">
        Advertisement
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
      />
    </div>
  );
}
