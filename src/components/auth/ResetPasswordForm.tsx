'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';

const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPasswordForm({ locale = 'en' }: { locale?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = resetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="rounded-xl bg-green-50 p-6 dark:bg-green-900/20">
          <h2 className="mb-2 text-2xl font-bold text-green-700 dark:text-green-400">
            Password updated!
          </h2>
          <p className="text-lg text-green-600 dark:text-green-300">
            Your password has been successfully reset. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
        <p className="mt-1 text-lg text-[var(--fg)]/60">Enter your new secure password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-lg text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-lg font-medium">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-12 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg)]/40 hover:text-[var(--fg)]/70"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-sm text-[var(--fg)]/40">
            Must contain 8+ characters, 1 uppercase letter, and 1 number.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-lg font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-12 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg)]/40 hover:text-[var(--fg)]/70"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-lg font-semibold text-white transition-all duration-200 hover:bg-primary-600 hover:shadow-lg active:scale-[0.98]',
            isLoading && 'cursor-not-allowed opacity-70'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}
