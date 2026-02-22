'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const themes = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  // { value: 'system', icon: Monitor, label: 'System' },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-1">
        {themes.map(({ value }) => (
          <div key={value} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] p-1 border border-[var(--border-color)]">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
            theme === value
              ? 'bg-primary-500 text-white shadow-md scale-110'
              : 'text-[var(--fg)] opacity-50 hover:opacity-100 hover:scale-105'
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
