'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validators/auth';
import OAuthButton from './OAuthButton';
import { cn } from '@/lib/utils/cn';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm({ locale = 'en' }: { locale?: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Email not confirmed') {
          setError('Please verify your email address to continue.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    setError(null);
    setVerificationSent(false);

    try {
      const { resendVerificationEmail } = await import('@/actions/auth');
      const res = await resendVerificationEmail(email);
      
      if (!res.success) {
        setError(res.error || 'Failed to resend verification email.');
      } else {
        setVerificationSent(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    // Check if a request was made in the last 10 minutes
    const lastRequestTime = localStorage.getItem('lastPasswordResetRequest');
    if (lastRequestTime) {
      const tenMinutes = 10 * 60 * 1000;
      const timeElapsed = Date.now() - parseInt(lastRequestTime, 10);
      
      if (timeElapsed < tenMinutes) {
        const minutesLeft = Math.ceil((tenMinutes - timeElapsed) / 60000);
        setError(`You can only request a password reset every 10 minutes. Please try again in ${minutesLeft} minute(s).`);
        return;
      }
    }

    setIsResetting(true);
    setError(null);

    try {
      const { sendPasswordResetEmail } = await import('@/actions/auth');
      const res = await sendPasswordResetEmail(email);

      if (!res.success) {
        setError(res.error || 'Failed to send reset email.');
      } else {
        setResetSent(true);
        localStorage.setItem('lastPasswordResetRequest', Date.now().toString());
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="mt-1 text-lg text-[var(--fg)]/60">Log in to your account</p>
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
            <div className="flex flex-col gap-2">
              <span>{error}</span>
              {error === 'Please verify your email address to continue.' && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-fit text-left text-sm font-medium underline hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          </div>
        )}

        {verificationSent && (
          <div className="rounded-lg bg-green-50 p-3 text-lg text-green-600 dark:bg-green-900/20 dark:text-green-400">
            Verification email sent! Check your inbox.
          </div>
        )}

        {resetSent && (
          <div className="rounded-lg bg-green-50 p-3 text-lg text-green-600 dark:bg-green-900/20 dark:text-green-400">
            Password reset email sent! Check your inbox.
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-lg font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm text-primary-500 hover:text-primary-600 hover:underline disabled:opacity-50"
            >
              {isResetting ? 'Sending...' : 'Forgot password?'}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <p className="text-center text-lg text-[var(--fg)]/60">
        Don&apos;t have an account?{' '}
        <Link
          href={`/${locale}/signup`}
          className="font-medium text-primary-500 hover:text-primary-600 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
