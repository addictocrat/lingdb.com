import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { words, dictionaries, users } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const updateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number(),
    })
  ),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: result.error },
        { status: 400 }
      );
    }

    const { updates } = result.data;

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
      columns: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Security check: ensure all words belong to a dictionary owned by the user
    const wordIds = updates.map((u) => u.id);
    const existingWords = await db.query.words.findMany({
      where: inArray(words.id, wordIds),
      with: {
        dictionary: { columns: { userId: true, isPublic: true } },
      },
    });

    if (existingWords.length !== wordIds.length) {
      return NextResponse.json(
        { error: 'One or more words not found' },
        { status: 404 }
      );
    }

    const isOwner = existingWords.every(
      (w) => w.dictionary.userId === dbUser.id
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized to modify these words' },
        { status: 403 }
      );
    }

    // Execute updates in a transaction
    await db.transaction(async (tx) => {
      // Drizzle doesn't have a single bulk update yet, so we map them
      for (const update of updates) {
        await tx
          .update(words)
          .set({ order: update.order })
          .where(eq(words.id, update.id));
      }
    });

    const dictionaryId = existingWords[0]?.dictionaryId;
    const isPublic = existingWords[0]?.dictionary?.isPublic;
    const dictSlug = (existingWords[0]?.dictionary as any)?.slug;

    if (dictionaryId && isPublic && dictSlug) {
      revalidatePath(`/en/library/${dictSlug}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
