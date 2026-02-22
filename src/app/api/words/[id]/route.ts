import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { words, dictionaries, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateWordSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  translation: z.string().min(1).max(200).optional(),
});

// PATCH /api/words/[id]
export async function PATCH(
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

  // Get word + verify ownership
  const word = await db.query.words.findFirst({
    where: eq(words.id, id),
    with: { 
      dictionary: {
        with: {
          dictionaryEditors: {
            where: (editors, { eq }) => eq(editors.status, 'ACCEPTED'),
          }
        }
      } 
    },
  });

  if (!word) {
    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isOwner = word.dictionary.userId === dbUser.id;
  const isEditor = word.dictionary.dictionaryEditors.some(ed => ed.userId === dbUser.id);

  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = updateWordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: result.error.issues },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(words)
    .set({ ...result.data, lastModifiedById: dbUser.id })
    .where(eq(words.id, id))
    .returning();

  if (word.dictionary.isPublic && word.dictionary.slug) {
    revalidatePath(`/en/library/${word.dictionary.slug}`);
  }

  return NextResponse.json({ word: updated });
}

// DELETE /api/words/[id]
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

  const word = await db.query.words.findFirst({
    where: eq(words.id, id),
    with: { 
      dictionary: {
        with: {
          dictionaryEditors: {
            where: (editors, { eq }) => eq(editors.status, 'ACCEPTED'),
          }
        }
      } 
    },
  });

  if (!word) {
    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isOwner = word.dictionary.userId === dbUser.id;
  const isEditor = word.dictionary.dictionaryEditors.some(ed => ed.userId === dbUser.id);

  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(words).where(eq(words.id, id));

  // Decrement totalWords
  await db
    .update(users)
    .set({ totalWords: Math.max(0, dbUser.totalWords - 1) })
    .where(eq(users.id, dbUser.id));

  // Update dictionary timestamp
  await db
    .update(dictionaries)
    .set({ updatedAt: new Date() })
    .where(eq(dictionaries.id, word.dictionaryId));

  if (word.dictionary.isPublic && word.dictionary.slug) {
    revalidatePath(`/en/library/${word.dictionary.slug}`);
  }

  return NextResponse.json({ success: true });
}
