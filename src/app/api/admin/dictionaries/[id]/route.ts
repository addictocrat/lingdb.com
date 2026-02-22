import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, dictionaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
    const [deleted] = await db
      .delete(dictionaries)
      .where(eq(dictionaries.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
    }

    // Revalidate library paths
    if (deleted.slug) {
      revalidatePath(`/en/library/${deleted.slug}`);
    }
    revalidatePath('/en/library');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin dictionary delete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
