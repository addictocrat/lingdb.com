import { NextResponse } from 'next/server';
import { APP_URL } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '@/lib/utils/random-username';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user already exists in our database
      const existingUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, data.user.id),
      });

      if (!existingUser) {
        // First login — create user record with random username
        let username = generateRandomUsername();

        // Ensure username uniqueness (retry up to 5 times)
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
        // Notify admin about the new signup
        try {
          await sendAdminNewUserNotification(username, data.user.email!);
        } catch (e) {
          console.error('Failed to send admin notification:', e);
        }
      }

      return NextResponse.redirect(`${APP_URL}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${APP_URL}/en/login?error=auth_callback_failed`);
}
