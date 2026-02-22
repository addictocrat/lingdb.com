import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { generateRandomUsername } from '@/lib/utils/random-username';
import { sendAdminNewUserNotification } from '@/lib/email/notify-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabaseId = searchParams.get('supabaseId');

  if (!supabaseId) {
    return NextResponse.json(
      { error: 'supabaseId is required' },
      { status: 400 }
    );
  }

  try {
    const profile = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId),
      columns: {
        id: true,
        username: true,
        email: true,
        locale: true,
        tier: true,
        aiCredits: true,
        totalWords: true,
        totalFlashcards: true,
        totalQuizzes: true,
        streakCount: true,
        hasCompletedTour: true,
      },
    });

    if (!profile) {
      // Missing profile fallback (e.g. if they bypassed local verification)
      const supabase = await createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && currentUser.id === supabaseId) {
        let username = generateRandomUsername();
        
        // Ensure username uniqueness
        for (let i = 0; i < 5; i++) {
          const taken = await db.query.users.findFirst({
            where: eq(users.username, username),
          });
          if (!taken) break;
          username = generateRandomUsername();
        }

        const [newProfile] = await db.insert(users).values({
          supabaseId: currentUser.id,
          email: currentUser.email!,
          username,
          locale: 'en',
          tier: 'FREE',
          aiCredits: 30,
        }).returning({
          id: users.id,
          username: users.username,
          email: users.email,
          locale: users.locale,
          tier: users.tier,
          aiCredits: users.aiCredits,
          totalWords: users.totalWords,
          totalFlashcards: users.totalFlashcards,
          totalQuizzes: users.totalQuizzes,
          streakCount: users.streakCount,
          hasCompletedTour: users.hasCompletedTour,
        });

        // Notify admin about the new signup
        sendAdminNewUserNotification(username, currentUser.email!).catch(console.error);

        return NextResponse.json({ profile: newProfile });
      }

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
