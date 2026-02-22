import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dictionaryEditors, dictionaries, words, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const dictionaryId = resolvedParams.id;
    const targetUserId = resolvedParams.userId;

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check authorization: Must be the dictionary owner, OR the target user quitting themselves
    const isOwnerQuery = await db.query.dictionaries.findFirst({
      where: and(
        eq(dictionaries.id, dictionaryId),
        eq(dictionaries.userId, dbUser.id)
      ),
    });

    const isOwner = !!isOwnerQuery;
    const isSelfQuitting = dbUser.id === targetUserId;

    if (!isOwner && !isSelfQuitting) {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }

    // Process Editor Removal
    await db
      .delete(dictionaryEditors)
      .where(
        and(
          eq(dictionaryEditors.dictionaryId, dictionaryId),
          eq(dictionaryEditors.userId, targetUserId)
        )
      );

    // If an editor gets removed or quits, unset their authored/modified words 
    // rather than deleting them, preserving the dictionary's integrity for the owner.
    await db
      .update(words)
      .set({ lastModifiedById: null })
      .where(
        and(
          eq(words.dictionaryId, dictionaryId),
          eq(words.lastModifiedById, targetUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing editor:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
