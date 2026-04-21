import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_URL } from "@/lib/utils/constants";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateRandomUsername } from "@/lib/utils/random-username";
import { sendAdminNewUserNotification } from "@/lib/email/notify-admin";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${APP_URL}/en/login?error=verification_failed`,
    );
  }

  const cookieStore = await cookies();
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

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  console.log("[Verify] verifyOtp result:", {
    hasUser: !!data.user,
    userId: data.user?.id,
    userEmail: data.user?.email,
    hasSession: !!data.session,
    error: error?.message,
    cookiesCollected: cookiesToForward.length,
  });

  if (error || !data.user) {
    console.error("[Verify] OTP verification failed:", error?.message);
    return NextResponse.redirect(
      `${APP_URL}/en/login?error=verification_failed`,
    );
  }

  // Determine redirect destination
  let redirectPath = "/en/dashboard";

  if (type === "recovery") {
    redirectPath = "/en/reset-password";
  } else {
    // For signup/magiclink verification, ensure user exists in our DB
    try {
      const existingUser = await db.query.users.findFirst({
        where: eq(users.supabaseId, data.user.id),
      });

      console.log("[Verify] DB lookup by supabaseId:", {
        supabaseId: data.user.id,
        found: !!existingUser,
      });

      if (!existingUser) {
        let hasEmailConflict = false;
        if (data.user.email) {
          const emailConflict = await db.query.users.findFirst({
            where: eq(users.email, data.user.email),
          });
          hasEmailConflict = !!emailConflict;
          console.log("[Verify] Email conflict check:", {
            email: data.user.email,
            hasConflict: hasEmailConflict,
          });
          if (emailConflict) {
            redirectPath = "/en/login?error=account_exists";
          }
        }

        if (!hasEmailConflict) {
          let username = generateRandomUsername();
          for (let i = 0; i < 5; i++) {
            const taken = await db.query.users.findFirst({
              where: eq(users.username, username),
            });
            if (!taken) break;
            username = generateRandomUsername();
          }

          const [newUser] = await db
            .insert(users)
            .values({
              supabaseId: data.user.id,
              email: data.user.email!,
              username,
              locale: "en",
              tier: "FREE",
              aiCredits: 30,
            })
            .returning();

          console.log("[Verify] DB user created:", {
            id: newUser.id,
            supabaseId: newUser.supabaseId,
            email: newUser.email,
            username: newUser.username,
          });

          sendAdminNewUserNotification(username, data.user.email!).catch(
            console.error,
          );
        }
      }
    } catch (dbError) {
      console.error("[Verify] DB error:", dbError);
    }
  }

  // Create redirect and forward all session cookies
  const response = NextResponse.redirect(`${APP_URL}${redirectPath}`);
  cookiesToForward.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  console.log(
    "[Verify] Redirecting to:",
    redirectPath,
    "with",
    cookiesToForward.length,
    "cookies",
  );

  return response;
}
