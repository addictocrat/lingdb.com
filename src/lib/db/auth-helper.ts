import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Look up a user in the DB by their Supabase ID.
 * Returns the user record or null if not found.
 * Does NOT auto-create — user creation only happens in auth routes.
 */
export async function getDbUser(supabaseId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseId),
  });
  return user ?? null;
}
