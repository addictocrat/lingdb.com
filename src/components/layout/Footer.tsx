import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer({ locale = 'en' }: { locale?: string }) {
  const t = useTranslations('legal');
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: `/${locale}/privacy`, labelKey: 'privacy.title' },
    { href: `/${locale}/terms`, labelKey: 'terms.title' },
    { href: `/${locale}/cookies`, labelKey: 'cookies.title' },
  ];

  return (
    <footer className="border-t border-[var(--border-color)]">
      {/* Ad banner slot */}
      <div id="footer-ad-slot" className="mx-auto max-w-7xl px-4 pt-4" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2 text-3xl font-semibold">
           
            <span>
              Lingdb
              
              {/* <span className=" text-primary-500">db</span> */}
            </span>
          </div>

          {/* Legal Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-md text-[var(--fg)]/50">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[var(--fg)]"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-sm text-[var(--fg)]/40">
            &copy; {currentYear} Lingdb
          </p>
        </div>
      </div>
    </footer>
  );
}
