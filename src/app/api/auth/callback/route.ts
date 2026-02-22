import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateRandomUsername } from '@/lib/utils/random-username';

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
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/en/login?error=auth_callback_failed`);
}
