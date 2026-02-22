import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users, forks } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { APP_URL } from '@/lib/utils/constants';
import DictionaryPreviewClient from '@/components/library/DictionaryPreviewClient';

export const revalidate = false; // Only revalidate on-demand

export async function generateStaticParams() {
  try {
    const publicDicts = await db.query.dictionaries.findMany({
      where: eq(dictionaries.isPublic, true),
      limit: 100,
      columns: { id: true },
    });
    
    // We need to return an array of objects for each locale if we have locales in the path
    // For now, let's assume 'en' as default or handle all supported
    const locales = ['en', 'fr', 'de', 'es', 'tr'];
    return locales.flatMap((locale) => 
      publicDicts.map((d) => ({ locale, id: d.id }))
    );
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}): Promise<Metadata> {
  const { id, locale } = await params;
  
  const dict = await db.query.dictionaries.findFirst({
    where: and(eq(dictionaries.id, id), eq(dictionaries.isPublic, true)),
    with: {
      user: { columns: { username: true } },
      words: { columns: { id: true } }
    },
  });

  if (!dict) return { title: 'Not Found - Lingdb' };

  const title = `${dict.title} - Lingdb Library`;
  const description = `Learn ${dict.language} with ${dict.words.length} words. Created by ${dict.user.username}. ${dict.description || ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${APP_URL}/${locale}/library/${dict.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}/library/${dict.id}`,
    }
  };
}

export default async function DictionaryLibraryPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // DB User is optional for public viewing
  let dbUser = null;
  if (user) {
    dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });
  }

  const dict = await db.query.dictionaries.findFirst({
    where: and(eq(dictionaries.id, id), eq(dictionaries.isPublic, true)),
    with: {
      user: { columns: { username: true } },
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: { examplePhrases: true },
      },
    },
  });

  if (!dict) notFound();

  // If user owns it and is logged in, they can just edit it in their dashboard
  if (dbUser && dict.userId === dbUser.id) {
    // We don't redirect in metadata generation, but here it's fine
    // However, for ISR, maybe we should just show the preview or a link to dashboard
    // Let's keep the redirect if they are the owner for better UX
    // redirect(`/${locale}/dictionary/${dict.id}`);
  }

  // Count forks for this dictionary
  const forksData = await db
    .select({ count: sql<number>`count(${forks.id})::int` })
    .from(forks)
    .where(eq(forks.sourceDictionaryId, dict.id));

  // Check if current user has already forked this dictionary
  let hasForked = false;
  if (dbUser) {
    const forkCheck = await db.query.forks.findFirst({
      where: and(
        eq(forks.sourceDictionaryId, dict.id),
        eq(forks.forkedById, dbUser.id)
      ),
    });
    hasForked = !!forkCheck;
  }

  const processedDict = {
    ...dict,
    _count: { forks: forksData[0]?.count || 0 },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <DictionaryPreviewClient 
        dictionary={processedDict} 
        hasForked={hasForked} 
        isLoggedIn={!!user}
      />
    </main>
  );
}
