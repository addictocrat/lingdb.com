import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, words, users, dictionaryEditors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateDictionarySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  activeMagicWords: z.array(z.any()).optional(),
});

// Helper: verify ownership
async function verifyOwnership(dictionaryId: string, supabaseUserId: string) {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, supabaseUserId),
  });
  if (!dbUser) return null;

  const dict = await db.query.dictionaries.findFirst({
    where: and(
      eq(dictionaries.id, dictionaryId),
      eq(dictionaries.userId, dbUser.id)
    ),
    with: { words: { orderBy: (w, { asc }) => [asc(w.order)] } },
  });

  return dict ? { dbUser, dict } : null;
}

// GET /api/dictionaries/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Public dictionaries can be viewed by anyone
  const dict = await db.query.dictionaries.findFirst({
    where: eq(dictionaries.id, id),
    with: {
      words: {
        orderBy: (w, { asc }) => [asc(w.order)],
        with: { 
          examplePhrases: true,
          lastModifiedBy: { columns: { username: true } },
        },
      },
      user: { columns: { username: true } },
      dictionaryEditors: {
        where: eq(dictionaryEditors.status, 'ACCEPTED'),
        with: { user: { columns: { username: true } } },
      },
    },
  });

  if (!dict) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Check if public or owned by user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!dict.isPublic) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = dict.userId === dbUser.id;
    const isEditor = dict.dictionaryEditors.some(ed => ed.userId === dbUser.id);

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.json({ dictionary: dict });
}

// PATCH /api/dictionaries/[id]
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

  const ownership = await verifyOwnership(id, user.id);
  if (!ownership) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }

  const body = await request.json();
  const result = updateDictionarySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: result.error.issues },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(dictionaries)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(dictionaries.id, id))
    .returning();

  if (updated.isPublic) {
    revalidatePath(`/en/library/${id}`);
    revalidatePath(`/fr/library/${id}`);
    revalidatePath(`/de/library/${id}`);
    revalidatePath(`/es/library/${id}`);
    revalidatePath(`/tr/library/${id}`);
    revalidatePath('/en/library');
  }

  return NextResponse.json({ dictionary: updated });
}

// DELETE /api/dictionaries/[id]
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

  const ownership = await verifyOwnership(id, user.id);
  if (!ownership) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }

  // Cascade delete handles words + phrases
  await db.delete(dictionaries).where(eq(dictionaries.id, id));

  // Decrement user's totalWords
  const wordCount = ownership.dict.words?.length || 0;
  if (wordCount > 0) {
    await db
      .update(users)
      .set({ totalWords: Math.max(0, ownership.dbUser.totalWords - wordCount) })
      .where(eq(users.id, ownership.dbUser.id));
  }

  if (ownership.dict.isPublic) {
    revalidatePath(`/en/library/${id}`);
    revalidatePath(`/fr/library/${id}`);
    revalidatePath(`/de/library/${id}`);
    revalidatePath(`/es/library/${id}`);
    revalidatePath(`/tr/library/${id}`);
    revalidatePath('/en/library');
  }

  return NextResponse.json({ success: true });
}
