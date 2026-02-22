// ─── App-wide Constants ─────────────────────────────────────

export const APP_NAME = 'Lingdb';
const getAppUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://lingdb.com';
  return url.startsWith('http') ? url : `http://${url}`;
};

export const APP_URL = getAppUrl();

export const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'tr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
] as const;

// ─── Limits ─────────────────────────────────────────────────

export const MAX_WORDS_PER_DICTIONARY = 500;
export const MAX_PHRASES_PER_WORD = 9;
export const MIN_WORDS_FOR_QUIZ = 5;

// ─── AI Credits ─────────────────────────────────────────────

export const FREE_TIER_AI_CREDITS = 30;
export const PREMIUM_TIER_AI_CREDITS = 100;
export const AI_CREDITS_RESET_DAYS = 30;

// ─── Pricing ────────────────────────────────────────────────

export const PREMIUM_PRICE_USD = 1.49;
export const PREMIUM_PRICE_TRY = 59.90;
export const TRIAL_DURATION_DAYS = 30;

// ─── Word List Sources ──────────────────────────────────────

export const WORD_LIST_URLS: Record<string, string> = {
  en: 'https://storage.googleapis.com/lingdb/englishWords.json',
  fr: 'https://storage.googleapis.com/lingdb/frenchWords.json',
  de: 'https://storage.googleapis.com/lingdb/germanWords.json',
  es: 'https://storage.googleapis.com/lingdb/spanishWords.json',
  tr: 'https://storage.googleapis.com/lingdb/turkishWords.json',
};
