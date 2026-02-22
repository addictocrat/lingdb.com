import { db } from '@/lib/db/client';
import { dictionaries, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import DictionaryModerationClient from '@/components/admin/DictionaryModerationClient';

export default async function AdminDictionariesPage() {
  const allDictionaries = await db.query.dictionaries.findMany({
    orderBy: [desc(dictionaries.updatedAt)],
    with: {
      user: {
        columns: {
          username: true,
          email: true
        }
      },
      words: {
        columns: {
          id: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dictionary Moderation</h1>
        <p className="text-[var(--fg)]/60">Monitor and manage all dictionaries.</p>
      </div>

      <DictionaryModerationClient initialDictionaries={allDictionaries} />
    </div>
  );
}
