import WordleCreator from "@/components/wordle/WordleCreator";
import type { Metadata } from "next";
import { APP_URL, SUPPORTED_LOCALES } from "@/lib/utils/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonicalPath = `/${locale}/wordle`;

  return {
    title: "Wordle Without Letter Limit (3-12) | Wordle XXL",
    description:
      "Play and create Wordle without letter limit pressure: from 3 to 12 letters. Perfect for Wordle XXL fans, long-word challenges, and unlimited letter-count Wordle gameplay.",
    keywords: [
      "wordle without letter limit",
      "wordle with unlimited letter count",
      "wordle with more than 5 letters",
      "Wordle XXL",
      "custom wordle",
      "long word wordle",
      "12 letter wordle",
    ],
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((supportedLocale) => [
          supportedLocale,
          `/${supportedLocale}/wordle`,
        ]),
      ),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: "Wordle Without Letter Limit | Wordle XXL by Lingdb",
      description:
        "Try a Wordle with unlimited letter count options from 3 to 12 letters. Share custom games and play Wordle with more than 5 letters.",
      type: "website",
      url: `${APP_URL}${canonicalPath}`,
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "Wordle Without Letter Limit | Wordle XXL",
      description:
        "Create and play Wordle with more than 5 letters (up to 12). Built for Wordle XXL and custom long-word challenges.",
    },
  };
}

export default async function WordleCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <WordleCreator locale={locale} />;
}
