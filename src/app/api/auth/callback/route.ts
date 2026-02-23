import { NextResponse } from 'next/server';
import { APP_URL } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '@/lib/utils/random-username';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en/dashboard';

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/en/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('OAuth callback error:', error?.message);
    return NextResponse.redirect(`${APP_URL}/en/login?error=auth_callback_failed`);
  }

  // Check if user already exists in our DB
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, data.user.id),
    });

    if (!existingUser) {
      // Check for email conflict (same email registered via different method)
      if (data.user.email) {
        const emailConflict = await db.query.users.findFirst({
          where: eq(users.email, data.user.email),
        });
        if (emailConflict) {
          return NextResponse.redirect(`${APP_URL}/en/login?error=account_exists`);
        }
      }

      // First login — create user record
      let username = generateRandomUsername();
      for (let i = 0; i < 5; i++) {
        const taken = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        if (!taken) break;
        username = generateRandomUsername();
      }

      await db.insert(users).values({
        supabaseId: data.user.id,
        email: data.user.email!,
        username,
        locale: 'en',
        tier: 'FREE',
        aiCredits: 30,
      });

      sendAdminNewUserNotification(username, data.user.email!).catch(console.error);
    }
  } catch (dbError) {
    console.error('DB error during OAuth callback:', dbError);
  }

  return NextResponse.redirect(`${APP_URL}${next}`);
}
