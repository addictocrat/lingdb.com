import WordleGame from "@/components/wordle/WordleGame";

export default async function WordleGamePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  return <WordleGame locale={locale} gameId={id} />;
}
