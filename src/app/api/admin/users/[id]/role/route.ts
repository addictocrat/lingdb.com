import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
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
  const result = updateRoleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ role: result.data.role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Admin role update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
