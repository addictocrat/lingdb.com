import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-primary-500/10 p-6 text-primary-500">
        <FileQuestion className="h-16 w-16" />
      </div>
      
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
        404
      </h1>
      <p className="mb-8 max-w-md text-xl text-[var(--fg)]/60">
        {t('not_found')}
      </p>

      <Link href={`/${locale}/dashboard`}>
        <Button>
          <ArrowLeft className="h-4 w-4" />
          {useTranslations('common')('back')}
        </Button>
      </Link>
    </div>
  );
}
