import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import CookieConsent from '@/components/ads/CookieConsent';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ToastProvider>
        <Header locale={locale} />
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
        <Footer locale={locale} />
        <CookieConsent />
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
