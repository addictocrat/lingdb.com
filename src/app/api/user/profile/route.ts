import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
        role: true,
      },
    });

    if (!profile) {
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
