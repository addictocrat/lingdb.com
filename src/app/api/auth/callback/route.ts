import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_URL } from "@/lib/utils/constants";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRandomUsername } from "@/lib/utils/random-username";
import { sendAdminNewUserNotification } from "@/lib/email/notify-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${APP_URL}/en/login?error=auth_callback_failed`,
    );
  }

  const cookieStore = await cookies();

  // Collect cookies so we can forward them to the redirect response
  const cookiesToForward: {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToForward.push(...cookiesToSet);
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth callback error:", error?.message);
    return NextResponse.redirect(
      `${APP_URL}/en/login?error=auth_callback_failed`,
    );
  }

  let redirectPath = next;

  // Check if user already exists in our DB
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, data.user.id),
    });

    if (!existingUser) {
      if (data.user.email) {
        const emailConflict = await db.query.users.findFirst({
          where: eq(users.email, data.user.email),
        });
        if (emailConflict) {
          redirectPath = "/en/login?error=account_exists";
        }
      }

      if (redirectPath === next) {
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
          locale: "en",
          tier: "FREE",
          aiCredits: 30,
        });

        sendAdminNewUserNotification(username, data.user.email!).catch(
          console.error,
        );
      }
    }
  } catch (dbError) {
    console.error("DB error during OAuth callback:", dbError);
  }

  // Create redirect and forward all session cookies
  const response = NextResponse.redirect(`${APP_URL}${redirectPath}`);
  cookiesToForward.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
