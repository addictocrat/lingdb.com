import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Ticket
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AdminSidebar({ locale }: { locale: string }) {
  // We'll use hardcoded labels for now or standard ones if they exist
  const navItems = [
    { href: `/${locale}/admin/overview`, label: 'Overview', icon: BarChart3 },
    { href: `/${locale}/admin/users`, label: 'Users', icon: Users },
    { href: `/${locale}/admin/dictionaries`, label: 'Dictionaries', icon: BookOpen },
    { href: `/${locale}/admin/coupons`, label: 'Coupons', icon: Ticket },
  ];

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-[var(--border-color)] bg-[var(--surface)] lg:flex">


      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium transition-colors hover:bg-[var(--bg)] text-[var(--fg)]/70 hover:text-[var(--fg)]"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-color)]">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium transition-colors hover:bg-[var(--bg)] text-[var(--fg)]/70 hover:text-[var(--fg)]"
        >
          <LayoutDashboard className="h-4 w-4" />
          User Dashboard
        </Link>
      </div>
    </aside>
  );
}
