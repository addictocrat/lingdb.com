import { db } from './client';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '../utils/random-username';
import { sendAdminNewUserNotification } from '../email/notify-admin';

export async function ensureDbUser(supabaseUser: { id: string; email?: string }, locale: string = 'en') {
  // 1. Try to find the user
  let dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseUser.id),
  });

  // 2. If found, return it
  if (dbUser) return dbUser;

  // 3. Fallback: Create the user on the fly if missing from DB
  // This prevents infinite redirect loops between dashboard and login
  let username = generateRandomUsername();
  
  // Quick check for uniqueness
  const taken = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (taken) {
    username = `${username}_${Math.floor(Math.random() * 1000)}`;
  }

  try {
    const [newUser] = await db
      .insert(users)
      .values({
        supabaseId: supabaseUser.id,
        email: supabaseUser.email!,
        username,
        locale: locale as any,
        tier: 'FREE',
        aiCredits: 30,
      })
      .returning();
      
    // Notify admin about the new signup
    await sendAdminNewUserNotification(username);
    
    return newUser;
  } catch (error) {
    console.error('Failed to auto-create user record in ensureDbUser:', error);
    return null;
  }
}
