'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/useUser';
import ThemeToggle from '@/components/common/ThemeToggle';
import LocaleSwitcher from '@/components/common/LocaleSwitcher';
import MobileNav from './MobileNav';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Library,
  User as UserIcon,
  LogOut,
  Settings,
  BookOpen,
} from 'lucide-react';

export default function Header({ locale = 'en' }: { locale?: string }) {
  const { user, profile, isLoading, signOut } = useUser();
  const pathname = usePathname();
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  const isActive = (path: string) =>
    pathname.includes(path);

  const navLinks = [
    { href: `/${locale}/dashboard`, label: tNav('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/library`, label: tNav('library'), icon: Library },
    { href: `/${locale}/profile`, label: tNav('profile'), icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href={user ? `/${locale}/dashboard` : `/${locale}`}
          className="flex items-center gap-2 text-3xl font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          {/* <BookOpen className="h-6 w-6 text-primary-500" /> */}
          <span>
            Lingdb


            {/* <span className="text-primary-500">db</span> */}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                id={link.href.includes('profile') ? 'profile-nav-link' : link.href.includes('library') ? 'library-nav-link' : link.href.includes('tiers') ? 'tiers-nav-link' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-medium transition-colors',
                  isActive(link.href.split('/').pop()!)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-[var(--fg)]/60 hover:bg-[var(--surface)] hover:text-[var(--fg)]'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />

          {!isLoading && (
            <>
              {user ? (
                <Dropdown
                  trigger={
                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600 transition-all hover:shadow-md dark:bg-primary-900/30 dark:text-primary-400">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </button>
                  }
                >
                  <div className="border-b border-[var(--border-color)] px-4 py-2">
                    <p className="text-lg font-semibold">
                      {profile?.username || 'User'}
                    </p>
                    <p className="text-sm text-[var(--fg)]/40">
                      {profile?.email}
                    </p>
                  </div>
                  <DropdownItem
                    onClick={() =>
                      (window.location.href = `/${locale}/profile/settings`)
                    }
                    id="settings-dropdown-item"
                  >
                    <Settings className="h-4 w-4" />
                    {t('settings')}
                  </DropdownItem>
                  <DropdownItem
                    onClick={async () => {
                      await signOut();
                      window.location.href = `/${locale}/login`;
                    }}
                    id="logout-dropdown-item"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </DropdownItem>
                </Dropdown>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href={`/${locale}/login`}
                    className="rounded-lg px-4 py-2 text-lg font-medium text-[var(--fg)]/70 transition-colors hover:text-[var(--fg)]"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    className="rounded-xl bg-primary-500 px-4 py-2 text-lg font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg active:scale-[0.97]"
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile hamburger */}
          <MobileNav locale={locale} isLoggedIn={!!user} navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
