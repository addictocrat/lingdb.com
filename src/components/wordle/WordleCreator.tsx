"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/utils/constants";

type CreateResponse = {
  gameId: string;
  sharePath: string;
  shareUrl: string;
};

function onlyLetters(value: string) {
  return value.replace(/[^a-zA-Z]/g, "");
}

export default function WordleCreator({ locale }: { locale: string }) {
  const t = useTranslations("wordle");
  const tCommon = useTranslations("common");
  const tLanguages = useTranslations("settings.languages");
  const [language, setLanguage] = useState<SupportedLocale>(() => {
    const normalizedLocale = locale.toLowerCase();
    return SUPPORTED_LOCALES.includes(normalizedLocale as SupportedLocale)
      ? (normalizedLocale as SupportedLocale)
      : "en";
  });
  const [maxTries, setMaxTries] = useState(6);
  const [word, setWord] = useState("");
  const [noteToSolver, setNoteToSolver] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharePath, setSharePath] = useState<string | null>(null);

  const normalizedWord = useMemo(() => word.trim().toUpperCase(), [word]);
  const isLengthInvalid =
    normalizedWord.length > 0 &&
    (normalizedWord.length < 3 || normalizedWord.length > 12);

  async function handleCreateGame(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setShareUrl(null);
    setSharePath(null);

    if (normalizedWord.length < 3 || normalizedWord.length > 12) {
      setError(t("errors.word_length_range"));
      return;
    }

    if (!/^[A-Z]+$/.test(normalizedWord)) {
      setError(t("errors.word_letters_only"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wordle/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          language,
          word: normalizedWord,
          noteToSolver,
          maxTries,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || t("errors.create_failed"));
        return;
      }

      const payload = data as CreateResponse;
      setShareUrl(payload.shareUrl);
      setSharePath(payload.sharePath);
    } catch {
      setError(t("errors.create_failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) {
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 sm:p-10">
        <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-2xl font-medium text-[var(--fg)]/70 sm:text-3xl">
          {t("subtitle")}
        </p>

        <form onSubmit={handleCreateGame} className="mt-10 space-y-8">
          <div>
            <label className="mb-3 block text-2xl font-bold sm:text-3xl">
              {tCommon("language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
              className="w-full border border-[var(--border-color)] bg-[var(--bg)] px-5 py-4 text-2xl font-bold outline-none focus:border-primary-500 sm:text-3xl"
            >
              {SUPPORTED_LOCALES.map((languageCode) => (
                <option key={languageCode} value={languageCode}>
                  {tLanguages(languageCode)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-3 block text-2xl font-bold sm:text-3xl">
              {t("fields.word")}
            </label>
            <input
              value={word}
              onChange={(e) =>
                setWord(onlyLetters(e.target.value).toUpperCase())
              }
              className="w-full border border-[var(--border-color)] bg-[var(--bg)] px-5 py-4 text-3xl font-black tracking-[0.2em] uppercase outline-none focus:border-primary-500 sm:text-5xl"
              placeholder={t("fields.word_placeholder")}
            />
            <p className="mt-2 text-lg text-[var(--fg)]/60 sm:text-xl">
              {t("fields.word_hint")}
            </p>
            {isLengthInvalid && (
              <p className="mt-2 text-lg font-semibold text-amber-700 sm:text-xl">
                {t("errors.word_length_range")}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-1">
            <div>
              <label className="mb-3 block text-2xl font-bold sm:text-3xl">
                {t("fields.max_tries")}
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxTries}
                onChange={(e) =>
                  setMaxTries(
                    Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                className="w-full border border-[var(--border-color)] bg-[var(--bg)] px-5 py-4 text-2xl font-bold outline-none focus:border-primary-500 sm:text-3xl"
              />
              <p className="mt-2 text-lg text-[var(--fg)]/60 sm:text-xl">
                {t("fields.max_tries_hint")}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-2xl font-bold sm:text-3xl">
                {t("fields.note_to_solver")}
              </label>
              <textarea
                value={noteToSolver}
                onChange={(e) => setNoteToSolver(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full border border-[var(--border-color)] bg-[var(--bg)] px-5 py-4 text-xl font-medium outline-none focus:border-primary-500 sm:text-2xl"
                placeholder={t("fields.note_placeholder")}
              />
              <p className="mt-2 text-lg text-[var(--fg)]/60 sm:text-xl">
                {t("fields.note_hint")}
              </p>
            </div>
          </div>

          {error && (
            <div className="border border-red-300 bg-red-50 px-5 py-4 text-xl font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black px-6 py-5 text-2xl font-black text-yellow-300 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl"
          >
            {isSubmitting ? t("creating") : t("create_button")}
          </button>
        </form>

        {shareUrl && sharePath && (
          <div className="mt-10 border border-[var(--border-color)] bg-[var(--bg)] p-5">
            <h2 className="text-3xl font-black sm:text-4xl">
              {t("share.title")}
            </h2>
            <p className="mt-3 break-all text-lg font-semibold text-[var(--fg)]/80 sm:text-2xl">
              {shareUrl}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-yellow-400 px-6 py-4 text-xl font-black text-black sm:text-2xl"
              >
                {t("share.copy")}
              </button>
              <Link
                href={sharePath}
                className="bg-primary-500 px-6 py-4 text-center text-xl font-black text-white sm:text-2xl"
              >
                {t("share.open")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
