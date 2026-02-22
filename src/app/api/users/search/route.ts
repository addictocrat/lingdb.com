import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { ilike, not, eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchQuery = `%${query.trim()}%`;

    const foundUsers = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          ilike(users.username, searchQuery),
          not(eq(users.id, user.id)) // Exclude current user
        )
      )
      .limit(10);

    return NextResponse.json({ users: foundUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
