'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signupSchema } from '@/lib/validators/auth';
import OAuthButton from './OAuthButton';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupForm({ locale = 'en' }: { locale?: string }) {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate with Zod
    const result = signupSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { registerUserWithVerification } = await import('@/actions/auth');
      const registerResult = await registerUserWithVerification(email, password);

      if (!registerResult.success) {
        setError(registerResult.error || 'Failed to create account.');
        return;
      }

      setSuccess(true);
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
            Check your email
          </h2>
          <p className="text-lg text-green-600 dark:text-green-300">
            We've sent a verification link to <strong>{email}</strong>.
            Please verify your account before logging in.
          </p>
        </div>
        <Link
          href={`/${locale}/login`}
          className="inline-block w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 text-lg font-medium transition-colors hover:bg-[var(--border-color)]"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-1 text-lg text-[var(--fg)]/60">Start learning today</p>
      </div>

      <OAuthButton provider="google" redirectTo={`/${locale}/dashboard`} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--border-color)]" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-[var(--bg)] px-2 text-[var(--fg)]/40">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-lg text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-lg font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-4 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-lg font-medium">
            Password
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
              Creating account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <p className="text-center text-lg text-[var(--fg)]/60">
        Already have an account?{' '}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-primary-500 hover:text-primary-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
