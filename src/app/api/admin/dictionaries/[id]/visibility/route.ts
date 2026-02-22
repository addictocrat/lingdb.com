import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, dictionaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const visibilitySchema = z.object({
  isPublic: z.boolean(),
});

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  return dbUser?.role === 'ADMIN' ? dbUser : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const result = visibilitySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(dictionaries)
      .set({ isPublic: result.data.isPublic, updatedAt: new Date() })
      .where(eq(dictionaries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    // Revalidate library paths
    if (updated.slug) {
      revalidatePath(`/en/library/${updated.slug}`);
    }
    revalidatePath('/en/library');

    return NextResponse.json({ dictionary: updated });
  } catch (error) {
    console.error('Admin dictionary visibility update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
