'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-accent-500/10 p-6 text-accent-500">
        <AlertCircle className="h-16 w-16" />
      </div>
      
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        {t('generic')}
      </h1>
      <p className="mb-8 max-w-md text-[var(--fg)]/60">
        Our systems encountered an unexpected issue. Don&apos;t worry, your data is safe.
      </p>

      <Button onClick={() => reset()} variant="secondary">
        <RotateCcw className="h-4 w-4" />
        {useTranslations('quiz')('retry')} 
      </Button>
    </div>
  );
}
