"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import { THEME_OPTIONS } from "@/lib/constants/ui";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const activeTheme = theme ?? resolvedTheme;

  if (!activeTheme) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-1">
        {THEME_OPTIONS.map(({ value }) => (
          <div key={value} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-1 border border-[var(--border-color)]">
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "cursor-pointer  flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
            activeTheme === value
              ? "bg-primary-500 text-white shadow-md scale-110"
              : "text-[var(--fg)] opacity-50 hover:opacity-100 hover:scale-105",
          )}
          aria-label={`Switch to ${label} theme`}
          title={label}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
