import { Sparkles, Brain, Gamepad2, Users } from "lucide-react";

export const PRICING_PLANS = [
  {
    nameKey: "free_title",
    price: "$0",
    periodKey: "free_period",
    descriptionKey: "free_desc",
    ctaKey: "free_cta",
    ctaVariant: "secondary" as const,
    features: [
      { textKey: "feature_10_dict", included: true },
      { textKey: "feature_30_ai", included: true },
      { textKey: "feature_flashcards", included: true },
      { textKey: "feature_unlimited_dict", included: false },
      { textKey: "feature_100_ai", included: false },
      { textKey: "feature_priority", included: false },
    ],
  },
  {
    nameKey: "premium_title",
    price: "$1.49",
    originalPrice: "$7.45",
    periodKey: "premium_period",
    descriptionKey: "premium_desc",
    ctaKey: "premium_cta",
    ctaVariant: "primary" as const,
    popular: true,
    features: [
      { textKey: "feature_unlimited_dict", included: true },
      { textKey: "feature_100_ai", included: true },
      { textKey: "feature_flashcards", included: true },
      { textKey: "feature_no_ads", included: true },
      { textKey: "feature_priority", included: true },
      { textKey: "feature_early_access", included: true },
    ],
  },
];

export const LANDING_FEATURES = [
  {
    icon: Sparkles,
    titleKey: "feature_dictionaries",
    descKey: "feature_dictionaries_desc",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    glow: "rgba(234, 179, 8, 0.5)",
  },
  {
    icon: Brain,
    titleKey: "feature_study",
    descKey: "feature_study_desc",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    glow: "rgba(34, 197, 94, 0.5)",
  },
  {
    icon: Gamepad2,
    titleKey: "feature_minigames",
    descKey: "feature_minigames_desc",
    color: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10 dark:bg-[#a855f7]/20",
    glow: "rgba(168, 85, 247, 0.5)",
  },
  {
    icon: Users,
    titleKey: "feature_community",
    descKey: "feature_community_desc",
    color: "text-accent-500",
    bg: "bg-accent-50 dark:bg-accent-900/20",
    glow: "rgba(247, 123, 85, 0.5)",
  },
];

export const DEMO_LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "tr", name: "Turkish" },
] as const;

export type DemoLanguageCode = (typeof DEMO_LANGUAGE_OPTIONS)[number]["code"];

export const DEMO_LANGUAGE_PLACEHOLDERS: Record<DemoLanguageCode, string> = {
  en: "school",
  fr: "fleur",
  de: "küchenchef",
  es: "hermano",
  tr: "harika",
};
