import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import SettingsForm from '@/components/profile/SettingsForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('settings');
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

  if (!dbUser) redirect(`/${locale}/login`);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/${locale}/profile`}
          className="rounded-lg p-2 text-[var(--fg)]/70 transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-lg font-semibold uppercase tracking-wider text-[var(--fg)]/50">
          {t('account_settings')}
        </span>
      </div>

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--surface)] p-8 sm:p-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[var(--fg)]">
          {t('title')}
        </h1>
        <p className="mb-8 text-[var(--fg)]/60">
          {t('description')}
        </p>

        <SettingsForm user={dbUser} />
      </div>
    </main>
  );
}
