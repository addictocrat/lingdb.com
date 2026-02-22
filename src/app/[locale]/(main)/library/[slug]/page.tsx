import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users, forks } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { APP_URL } from '@/lib/utils/constants';
import DictionaryPreviewClient from '@/components/library/DictionaryPreviewClient';
import DictionaryJsonLd from '@/components/seo/DictionaryJsonLd';
import AdminSeoEditor from '@/components/library/AdminSeoEditor';

export const revalidate = false; // Only revalidate on-demand

export async function generateStaticParams() {
  try {
    const publicDicts = await db.query.dictionaries.findMany({
      where: eq(dictionaries.isPublic, true),
      limit: 100,
      columns: { slug: true },
    });
    
    const locales = ['en', 'fr', 'de', 'es', 'tr'];
    return locales.flatMap((locale) => 
      publicDicts
        .filter((d) => d.slug)
        .map((d) => ({ locale, slug: d.slug! }))
    );
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; locale: string }> 
}): Promise<Metadata> {
  const { slug, locale } = await params;
  
  const dict = await db.query.dictionaries.findFirst({
    where: and(eq(dictionaries.slug, slug), eq(dictionaries.isPublic, true)),
    with: {
      user: { columns: { username: true } },
      words: { columns: { id: true } }
    },
  });

  if (!dict) return { title: 'Not Found - Lingdb' };

  // Use AI-generated SEO title if available, otherwise fallback
  const title = dict.seoTitle || `${dict.title} - Lingdb Library`;
  const description = dict.seoDescription 
    ? dict.seoDescription.replace(/<[^>]*>/g, '').slice(0, 160) // Strip HTML for meta
    : `Learn ${dict.language} with ${dict.words.length} words. Created by ${dict.user.username}. ${dict.description || ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${APP_URL}/en/library/${dict.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/en/library/${dict.slug}`,
    },
    // Only index English locale pages
    robots: locale !== 'en' ? { index: false, follow: true } : undefined,
  };
}

export default async function DictionaryLibraryPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
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
    where: and(eq(dictionaries.slug, slug), eq(dictionaries.isPublic, true)),
    with: {
      user: { columns: { username: true } },
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: { examplePhrases: true },
      },
    },
  });

  if (!dict) notFound();

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

  const isAdmin = dbUser?.role === 'ADMIN';

  const processedDict = {
    ...dict,
    _count: { forks: forksData[0]?.count || 0 },
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <DictionaryJsonLd dictionary={processedDict} />

      <DictionaryPreviewClient 
        dictionary={processedDict} 
        hasForked={hasForked} 
        isLoggedIn={!!user}
      />

      {/* Visually hidden SEO rich content for crawlers */}
      {dict.seoDescription && (
        <section
          className="sr-only"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: dict.seoDescription }}
        />
      )}

      {isAdmin && (
        <AdminSeoEditor 
          dictionaryId={dict.id}
          currentSeoTitle={dict.seoTitle}
          currentSeoDescription={dict.seoDescription}
          seoGeneratedAt={dict.seoGeneratedAt?.toISOString() || null}
        />
      )}
    </main>
  );
}
