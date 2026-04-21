"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators/auth";
import OAuthButton from "./OAuthButton";
import { cn } from "@/lib/utils/cn";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LoginForm({
  locale = "en",
  initialError,
}: {
  locale?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (initialError === "account_exists") {
      return t("errors.account_exists");
    }
    if (initialError === "auth_callback_failed") {
      return t("errors.auth_failed");
    }
    if (initialError === "verification_failed") {
      return t("errors.verification_failed");
    }
    return initialError || null;
  });
  const [resetSent, setResetSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const issue = result.error.issues[0];
      // Safely check properties for narrowing
      if ("validation" in issue && issue.validation === "email") {
        setError(t("errors.invalid_email"));
      } else if ("minimum" in issue && issue.minimum === 8) {
        setError(t("errors.password_min"));
      } else {
        setError(issue.message);
      }
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Email not confirmed") {
          setError(t("email_not_confirmed"));
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError(tCommon("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    // Check if a request was made in the last 2 minutes
    const lastRequestTime = localStorage.getItem(
      "lastVerificationResendRequest",
    );
    if (lastRequestTime) {
      const twoMinutes = 2 * 60 * 1000;
      const timeElapsed = Date.now() - parseInt(lastRequestTime, 10);

      if (timeElapsed < twoMinutes) {
        const minutesLeft = Math.ceil((twoMinutes - timeElapsed) / 60000);
        setError(
          t("cooldown_error", {
            type: t("type_verification"),
            minutes: minutesLeft,
          }),
        );
        return;
      }
    }

    setIsResending(true);
    setError(null);
    setVerificationSent(false);

    try {
      const { resendVerificationEmail } = await import("@/actions/auth");
      const res = await resendVerificationEmail(email);

      if (!res.success) {
        setError(res.error || t("errors.auth_failed"));
      } else {
        setVerificationSent(true);
        localStorage.setItem(
          "lastVerificationResendRequest",
          Date.now().toString(),
        );
      }
    } catch {
      setError(tCommon("errors.generic"));
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t("enter_email_first"));
      return;
    }

    // Check if a request was made in the last 2 minutes
    const lastRequestTime = localStorage.getItem("lastPasswordResetRequest");
    if (lastRequestTime) {
      const twoMinutes = 2 * 60 * 1000;
      const timeElapsed = Date.now() - parseInt(lastRequestTime, 10);

      if (timeElapsed < twoMinutes) {
        const minutesLeft = Math.ceil((twoMinutes - timeElapsed) / 60000);
        setError(
          t("cooldown_error", { type: t("type_reset"), minutes: minutesLeft }),
        );
        return;
      }
    }

    setIsResetting(true);
    setError(null);

    try {
      const { sendPasswordResetEmail } = await import("@/actions/auth");
      const res = await sendPasswordResetEmail(email);

      if (!res.success) {
        setError(res.error || t("errors.reset_failed"));
      } else {
        setResetSent(true);
        localStorage.setItem("lastPasswordResetRequest", Date.now().toString());
      }
    } catch {
      setError(tCommon("errors.generic"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("login_title")}
        </h1>
        <p className="mt-1 text-lg text-[var(--fg)]/60">
          {t("login_subtitle")}
        </p>
      </div>

      <OAuthButton provider="google" redirectTo={`/${locale}/dashboard`} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--border-color)]" />
        </div>
        <div className="relative flex justify-center text-sm uppercase">
          <span className="bg-[var(--bg)] px-2 text-[var(--fg)]/40">
            {t("or")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-lg text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <div className="flex flex-col gap-2">
              <span>{error}</span>
              {(error === t("email_not_confirmed") ||
                error === "Please verify your email address to continue.") && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-fit text-left text-sm font-medium underline hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                >
                  {isResending ? t("sending") : t("resend_verification")}
                </button>
              )}
            </div>
          </div>
        )}

        {verificationSent && (
          <div className="rounded-lg bg-green-50 p-3 text-lg text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {t("verification_sent")}
          </div>
        )}

        {resetSent && (
          <div className="rounded-lg bg-green-50 p-3 text-lg text-green-600 dark:bg-green-900/20 dark:text-green-400">
            {t("password_reset_sent")}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-lg font-medium">
            {t("email_label")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-4 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-lg font-medium">
              {t("password_label")}
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResetting}
              className="text-sm text-primary-500 hover:text-primary-600 hover:underline disabled:opacity-50"
            >
              {isResetting ? t("sending") : t("forgot_password")}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password_placeholder")}
              required
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-3 pl-10 pr-12 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg)]/40 hover:text-[var(--fg)]/70"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-lg font-semibold text-white transition-all duration-200 hover:bg-primary-600 hover:shadow-lg active:scale-[0.98]",
            isLoading && "cursor-not-allowed opacity-70",
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("logging_in")}
            </>
          ) : (
            t("login_btn")
          )}
        </button>
      </form>

      <p className="text-center text-lg text-[var(--fg)]/60">
        {t("no_account")}{" "}
        <Link
          href={`/${locale}/signup`}
          className="font-medium text-primary-500 hover:text-primary-600 hover:underline"
        >
          {tCommon("signup")}
        </Link>
      </p>
    </div>
  );
}
