import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { ADMIN_NAV_LINKS } from "@/lib/constants/navigation";

export default function AdminSidebar({ locale }: { locale: string }) {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-[var(--border-color)] bg-[var(--surface)] lg:flex">
      <nav className="flex-1 space-y-1 p-4">
        {ADMIN_NAV_LINKS.map((item) => (
          <Link
            key={item.href}
            href={`/${locale}${item.href}`}
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
