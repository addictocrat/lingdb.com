import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { examplePhrases, words, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// DELETE /api/example-phrases/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const phrase = await db.query.examplePhrases.findFirst({
    where: eq(examplePhrases.id, id),
    with: { word: { with: { dictionary: true } } },
  });

  if (!phrase || phrase.word.dictionary.userId !== dbUser.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(examplePhrases).where(eq(examplePhrases.id, id));

  return NextResponse.json({ success: true });
}
