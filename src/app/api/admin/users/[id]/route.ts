import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createAdminClient } from '@/lib/supabase/admin';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  return dbUser?.role === 'ADMIN' ? dbUser : null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;

  try {
    // 1. Get user to find Supabase ID
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Delete from Supabase first (using admin client)
    const supabaseAdmin = createAdminClient();
    const { error: supabaseError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.supabaseId);
    
    // We log but proceed even if Supabase delete fails (user might already be gone)
    if (supabaseError) console.error('Supabase delete error:', supabaseError);

    // 3. Delete from DB (cascade handles related data)
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
