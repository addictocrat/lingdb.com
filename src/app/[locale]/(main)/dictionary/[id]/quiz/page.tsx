import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import QuizEngine from '@/components/study/QuizEngine';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';

export default async function QuizPage({
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
      },
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
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Brain className="h-6 w-6 text-primary-500" />
          Quiz: <span className="text-primary-500">{dict.title}</span>
        </h1>
      </div>

      {dict.words.length < 5 ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-8 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold">Not enough words</h2>
          <p className="mb-6 text-[var(--fg)]/70">
            A dictionary must have at least <strong>5 words</strong> to play a
            quiz. Currently has {dict.words.length}.
          </p>
          <Link href={`/${locale}/dictionary/${dict.id}`}>
            <Button>Add more words</Button>
          </Link>
        </div>
      ) : (
        <QuizEngine words={dict.words} dictionaryId={dict.id} />
      )}
    </main>
  );
}
