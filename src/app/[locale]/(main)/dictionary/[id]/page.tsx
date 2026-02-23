import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import DictionaryDetailClient from '@/components/dictionary/DictionaryDetailClient';

export default async function DictionaryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get DB user if authenticated
  let dbUser = null;
  if (user) {
    const { getDbUser } = await import('@/lib/db/auth-helper');
    dbUser = await getDbUser(user.id);
  }

  const dict = await db.query.dictionaries.findFirst({
    where: eq(dictionaries.id, id),
    with: {
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: { 
          examplePhrases: true,
          lastModifiedBy: { columns: { username: true } }
        },
      },
      user: { columns: { username: true } },
      dictionaryEditors: {
        where: (editors, { eq }) => eq(editors.status, 'ACCEPTED'),
        with: { user: { columns: { username: true } } },
      },
    },
  });

  if (!dict) notFound();

  const isOwner = dbUser?.id === dict.userId;
  const isEditor = dict.dictionaryEditors.some((ed: any) => ed.userId === dbUser?.id);

  if (!dict.isPublic && !isOwner && !isEditor) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <DictionaryDetailClient 
        dictionary={dict as any} 
        isOwner={isOwner} 
        currentUserId={dbUser?.id}
      />
    </main>
  );
}
