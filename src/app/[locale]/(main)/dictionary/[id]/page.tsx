import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { dictionaries, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import DictionaryDetailClient from "@/components/dictionary/DictionaryDetailClient";

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
    const { getOrCreateDbUser } = await import("@/lib/db/auth-helper");
    try {
      dbUser = await getOrCreateDbUser(user);
    } catch (error) {
      console.error(
        "Error getting/creating DB user in dictionary page:",
        error,
      );
    }
  }

  const dict = await db.query.dictionaries.findFirst({
    where: eq(dictionaries.id, id),
    with: {
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: {
          examplePhrases: true,
          lastModifiedBy: { columns: { username: true } },
        },
      },
      user: { columns: { username: true } },
      dictionaryEditors: {
        where: (editors, { eq }) => eq(editors.status, "ACCEPTED"),
        with: { user: { columns: { username: true } } },
      },
    },
  });

  if (!dict) notFound();

  const isOwner = dbUser?.id === dict.userId;
  const isEditor = dict.dictionaryEditors.some(
    (ed: any) => ed.userId === dbUser?.id,
  );

  if (!dict.isPublic && !isOwner && !isEditor) {
    redirect(`/${locale}/dashboard`);
  }

  // Determine if we should show the dictionary tour
  let showTour = false;
  if (dbUser && isOwner && !dbUser.hasCompletedDictTour) {
    const dictCount = await db.query.dictionaries.findMany({
      where: eq(dictionaries.userId, dbUser.id),
      limit: 2,
    });
    // Trigger only when user creates their first dictionary and navigates to it
    if (dictCount.length === 1) {
      showTour = true;
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <DictionaryDetailClient
        dictionary={dict as any}
        isOwner={isOwner}
        currentUserId={dbUser?.id}
        showTour={showTour}
      />
    </main>
  );
}
