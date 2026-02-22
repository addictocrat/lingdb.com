import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import FlashcardSlider from '@/components/study/FlashcardSlider';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  const dict = await db.query.dictionaries.findFirst({
    where: eq(dictionaries.id, id),
    with: {
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: { examplePhrases: true },
      },
      user: { columns: { id: true, username: true } },
    },
  });

  if (!dict) notFound();

  const isOwner = dbUser?.id === dict.userId;

  if (!dict.isPublic && !isOwner) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/${locale}/dictionary/${dict.id}`}
          className="rounded-lg p-2 text-[var(--fg)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">
          Studying:{' '}
          <span className="text-primary-500">{dict.title}</span>
        </h1>
      </div>

      <FlashcardSlider words={dict.words} dictionaryId={dict.id} />
    </main>
  );
}
