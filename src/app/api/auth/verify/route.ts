import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '@/lib/utils/random-username';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/en/dashboard';

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error && data.user) {
      // Check if user already exists in our database
      const existingUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, data.user.id),
      });

      if (!existingUser) {
        // First login — create user record with random username
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
        // Notify admin about the new signup (fire and forget)
        sendAdminNewUserNotification(username, data.user.email!).catch(console.error);
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      let redirectPath = next;
      if (type === 'recovery') {
        redirectPath = '/en/reset-password';
      }

      const redirectUrl = isLocalEnv 
        ? `${origin}${redirectPath}` 
        : forwardedHost 
          ? `https://${forwardedHost}${redirectPath}` 
          : `${origin}${redirectPath}`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/en/login?error=verification_failed`);
}
