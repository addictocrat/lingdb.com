import {
  Hero,
  Features,
  FeaturedBlogs,
  FooterCTA,
  PricingPreview,
} from "@/components/landing";

export const metadata = {
  title: "Lingdb – Master Any Language",
  description:
    "Create dictionaries, study with flashcards, quizzes, and learn any language with Lingdb. A Quizlet alternative with AI that understands your wordlists and suggests additional words and example phrases.",
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main>
      <Hero locale={locale} />
      <Features />
      <FeaturedBlogs locale={locale} />
      <FooterCTA locale={locale} />
      <PricingPreview locale={locale} />
    </main>
  );
}
