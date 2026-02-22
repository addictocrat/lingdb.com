'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from 'use-debounce';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Save, Loader2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface SettingsFormProps {
  user: {
    id: string;
    username: string;
    email: string;
    locale: string;
    tier: string;
    aiCredits: number;
  };
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations('settings');
  const { toast } = useToast();

  const settingsSchema = z.object({
    username: z
      .string()
      .min(3, t('username_min'))
      .max(20, t('username_max'))
      .regex(/^[a-zA-Z0-9_]+$/, t('username_regex')),
    locale: z.enum(['en', 'fr', 'de', 'es', 'tr']),
  });

  type SettingsFormData = z.infer<typeof settingsSchema>;
  
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    setError,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: user.username,
      locale: user.locale as any,
    },
  });

  const watchUsername = watch('username');
  const [debouncedUsername] = useDebounce(watchUsername, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (debouncedUsername === user.username) {
        setUsernameAvailable(true);
        setIsCheckingUsername(false);
        return;
      }

      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/users/profile?checkUsername=${debouncedUsername}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (e) {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername, user.username]);

  const onSubmit = async (data: SettingsFormData) => {
    if (usernameAvailable === false) {
      setError('username', { message: t('username_taken') });
      return;
    }

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || t('reset_tutorial_fail')); // Use a generic error or specific if available
      }

      toast(t('saved'), 'success');

      // If locale changed, we need to completely redirect to apply the new locale prefix
      if (data.locale !== currentLocale) {
        window.location.href = `/${data.locale}/profile/settings`;
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast(error.message, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Read-only Information */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-lg font-medium text-[var(--fg)]">
            {t('email')}
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            disabled
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg)] px-4 py-3 text-[var(--fg)] opacity-60"
          />
        </div>

        <div>
          <label className="mb-2 block text-lg font-medium text-[var(--fg)]">
            {t('tier')}
          </label>
          <div className="flex h-[50px] items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg)] px-4 opacity-80">
            <span className="font-semibold">{user.tier}</span>
            {user.tier === 'FREE' && (
              <span className="ml-auto text-lg text-[var(--fg)]/50">
                {t('credits_left', { count: user.aiCredits })}
              </span>
            )}
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--border-color)] opacity-50" />

      {/* Editable Fields */}
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-lg font-medium text-[var(--fg)]">
            {t('username')}
          </label>
          <div className="relative">
            <input
              {...register('username')}
              className={`w-full rounded-xl border bg-[var(--surface)] px-4 py-3 pr-10 outline-none transition-colors ${
                errors.username || usernameAvailable === false
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingUsername ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--fg)]/40" />
              ) : usernameAvailable === true ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : usernameAvailable === false ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>
          {errors.username && (
            <p className="mt-1.5 text-lg text-red-500">{errors.username.message}</p>
          )}
          {usernameAvailable === false && !errors.username && (
            <p className="mt-1.5 text-lg text-red-500">{t('username_taken')}</p>
          )}
          <p className="mt-2 text-sm text-[var(--fg)]/50">
            {t('username_hint')}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-lg font-medium text-[var(--fg)]">
            {t('locale')}
          </label>
          <select
            {...register('locale')}
            className="w-full appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="en">{t('languages.en')}</option>
            <option value="fr">{t('languages.fr')}</option>
            <option value="de">{t('languages.de')}</option>
            <option value="es">{t('languages.es')}</option>
            <option value="tr">{t('languages.tr')}</option>
          </select>
          <p className="mt-2 text-sm text-[var(--fg)]/50">
            {t('locale_hint')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--border-color)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--fg)]">{t('tour_title')}</h3>
          <p className="mt-1 text-sm text-[var(--fg)]/50">{t('tour_description')}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={async () => {
              try {
                const res = await fetch('/api/users/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hasCompletedTour: false }),
                });
                
                if (!res.ok) throw new Error('Failed to reset');
                
                localStorage.removeItem('lingdb_tour_completed');
                window.location.href = `/${currentLocale}/dashboard`;
              } catch (e) {
                toast(t('reset_tutorial_fail'), 'error');
              }
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            {t('restart_tour')}
          </Button>
        </div>

        <div className="flex shrink-0 justify-end">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || isCheckingUsername || usernameAvailable === false}
            isLoading={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {t('save_changes')}
          </Button>
        </div>
      </div>
    </form>
  );
}
