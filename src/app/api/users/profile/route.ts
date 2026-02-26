import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';

const settingsSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  locale: z.enum(['en', 'fr', 'de', 'es', 'tr']).optional(),
  hasCompletedTour: z.boolean().optional(),
  hasCompletedDictTour: z.boolean().optional(),
});

// Used for fetching current profile or checking username availability
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkUsername = searchParams.get('checkUsername');

    // Handle username availability check
    if (checkUsername) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.username, checkUsername),
          ne(users.supabaseId, user.id) // Exclude current user
        ),
      });

      return NextResponse.json({ available: !existingUser });
    }

    // Otherwise return full profile
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Used for updating settings
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { username, locale, hasCompletedTour, hasCompletedDictTour } = result.data;

    // Double check username availability if it's being changed
    if (username) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.username, username),
          ne(users.supabaseId, user.id)
        ),
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    // Update user
    const updateData: any = { updatedAt: new Date() };
    if (username) updateData.username = username;
    if (locale) updateData.locale = locale;
    if (typeof hasCompletedTour === 'boolean') updateData.hasCompletedTour = hasCompletedTour;
    if (typeof hasCompletedDictTour === 'boolean') updateData.hasCompletedDictTour = hasCompletedDictTour;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.supabaseId, user.id))
      .returning();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
