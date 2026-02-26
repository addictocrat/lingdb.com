import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users, words, forks } from '@/lib/db/schema';
import { eq, ilike, sql, desc, and } from 'drizzle-orm';
import LibraryControls from '@/components/library/LibraryControls';
import LibraryCard from '@/components/library/LibraryCard';

export default async function LibraryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No mandatory redirect - library is public

  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const lang = typeof resolvedParams.lang === 'string' ? resolvedParams.lang : '';
  const sort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'newest';
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const conditions = [eq(dictionaries.isPublic, true)];
  if (q) {
    conditions.push(ilike(dictionaries.title, `%${q}%`));
  }
  if (lang && lang !== 'all') {
    conditions.push(eq(dictionaries.language, lang));
  }

  // Count words and forks
  const wordCountQuery = sql<number>`count(distinct ${words.id})`.mapWith(Number);
  const forkCountQuery = sql<number>`count(distinct ${forks.id})`.mapWith(Number);

  let sortOrder = desc(dictionaries.createdAt);
  if (sort === 'most_words') sortOrder = desc(sql`count(distinct ${words.id})`);
  if (sort === 'most_forked') sortOrder = desc(sql`count(distinct ${forks.id})`);

  const whereCondition = and(...conditions);

  // Get DB user to check ownership
  const { getOrCreateDbUser } = await import('@/lib/db/auth-helper');
  
  let dbUser = null;
  if (user) {
    try {
      dbUser = await getOrCreateDbUser(user);
    } catch (error) {
      console.error('Error getting/creating DB user in library:', error);
    }
  }

  const t = await import('next-intl/server').then(m => m.getTranslations('library'));
  const tCommon = await import('next-intl/server').then(m => m.getTranslations('common'));

  const libraryItems = await db
    .select({
      id: dictionaries.id,
      title: dictionaries.title,
      description: dictionaries.description,
      language: dictionaries.language,
      userId: dictionaries.userId,
      slug: dictionaries.slug,
      createdAt: dictionaries.createdAt,
      wordCount: wordCountQuery,
      forkCount: forkCountQuery,
      username: users.username,
      isShared: sql<boolean>`EXISTS(SELECT 1 FROM dictionary_editors de WHERE de.dictionary_id = ${dictionaries.id} AND de.status = 'ACCEPTED')`.mapWith(Boolean),
    })
    .from(dictionaries)
    .leftJoin(users, eq(users.id, dictionaries.userId))
    .leftJoin(words, eq(words.dictionaryId, dictionaries.id))
    .leftJoin(forks, eq(forks.sourceDictionaryId, dictionaries.id))
    .where(whereCondition)
    .groupBy(dictionaries.id, users.username)
    .orderBy(sortOrder)
    .limit(limit)
    .offset(offset);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--fg)] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-xl text-[var(--fg)]/60">
          {t('discover_desc')}
        </p>
      </div>

      <LibraryControls />

      {libraryItems.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface)]/50 p-8 text-center">
          <div className="mb-4 rounded-full bg-[var(--bg)] p-4 shadow-sm">
            <span className="text-5xl text-[var(--fg)]/40">📚</span>
          </div>
          <h2 className="text-2xl font-bold">{t('no_results')}</h2>
          <p className="mt-2 text-[var(--fg)]/60">
            {q || lang ? t('try_adjusting') : t('none_available')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {libraryItems.map((item) => (
            <LibraryCard 
              key={item.id} 
              dictionary={item} 
              currentUserId={dbUser?.id}
            />
          ))}
        </div>
      )}

      {/* Basic Pagination Controls (Next/Prev) */}
      <div className="mt-12 flex items-center justify-center gap-4">
        {page > 1 && (
          <a
            href={`?${new URLSearchParams({ ...(resolvedParams as Record<string, string>), page: String(page - 1) }).toString()}`}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2 text-lg font-medium hover:bg-[var(--border-color)] transition-colors"
          >
            &larr; {tCommon('previous_page')}
          </a>
        )}
        {libraryItems.length === limit && (
          <a
            href={`?${new URLSearchParams({ ...(resolvedParams as Record<string, string>), page: String(page + 1) }).toString()}`}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-4 py-2 text-lg font-medium hover:bg-[var(--border-color)] transition-colors"
          >
            {tCommon('next_page')} &rarr;
          </a>
        )}
      </div>
    </main>
  );
}
