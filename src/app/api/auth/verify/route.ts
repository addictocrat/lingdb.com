import { NextResponse } from 'next/server';
import { APP_URL } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '@/lib/utils/random-username';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${APP_URL}/en/login?error=verification_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.user) {
    console.error('OTP verification failed:', error?.message);
    return NextResponse.redirect(`${APP_URL}/en/login?error=verification_failed`);
  }

  // For recovery, redirect to reset-password page (user is now authenticated)
  if (type === 'recovery') {
    return NextResponse.redirect(`${APP_URL}/en/reset-password`);
  }

  // For signup verification, ensure the user exists in our DB
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, data.user.id),
    });

    if (!existingUser) {
      // Check for email conflict (e.g. same email registered via OAuth)
      if (data.user.email) {
        const emailConflict = await db.query.users.findFirst({
          where: eq(users.email, data.user.email),
        });
        if (emailConflict) {
          return NextResponse.redirect(`${APP_URL}/en/login?error=account_exists`);
        }
      }

      // Create new user record
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
    console.error('DB error during verification:', dbError);
    // User is verified in Supabase even if DB insert fails — they can still log in
  }

  return NextResponse.redirect(`${APP_URL}/en/dashboard`);
}
