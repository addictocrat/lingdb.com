import { useTranslations } from 'next-intl';

export default function CookiePolicyPage() {
  const t = useTranslations('legal.cookies');

  return (
    <>
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">{t('title')}</h1>
      <p className="text-lg text-[var(--fg)]/50 mb-8">{t('last_updated')}</p>
      
      <p className="lead text-xl mb-8">{t('intro')}</p>
      
      <h2 className="text-3xl font-bold mt-12 mb-4">{t('section1_title')}</h2>
      <p className="mb-6">{t('section1_content')}</p>
      
      <h2 className="text-3xl font-bold mt-12 mb-4">{t('section2_title')}</h2>
      <p className="mb-6">{t('section2_content')}</p>
      
      <h2 className="text-3xl font-bold mt-12 mb-4">{t('section3_title')}</h2>
      <p className="mb-6">{t('section3_content')}</p>
    </>
  );
}
