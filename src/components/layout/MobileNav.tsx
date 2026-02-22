'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileNavProps {
  locale: string;
  isLoggedIn: boolean;
  navLinks: NavLink[];
}

export default function MobileNav({
  locale,
  isLoggedIn,
  navLinks,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('common');

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-[var(--fg)]/60 hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute bottom-0 right-0 top-0 w-72 bg-[var(--bg)] p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-[var(--fg)]/40 hover:text-[var(--fg)]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>

            <nav className="mt-12 flex flex-col gap-2">
              {navLinks
                .filter(link => isLoggedIn || link.href.includes('/library'))
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-medium transition-colors hover:bg-[var(--surface)]"
                  >
                    <link.icon className="h-5 w-5 text-[var(--fg)]/60" />
                    {link.label}
                  </Link>
                ))}
              {!isLoggedIn && (
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-4 py-3 text-center text-lg font-medium transition-colors hover:bg-[var(--surface)]"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-primary-500 px-4 py-3 text-center text-lg font-semibold text-white transition-all hover:bg-primary-600"
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
