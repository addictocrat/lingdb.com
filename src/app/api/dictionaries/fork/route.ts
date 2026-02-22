import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { dictionaries, users, words, examplePhrases, forks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
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

    const { sourceDictionaryId } = await request.json();

    if (!sourceDictionaryId) {
      return NextResponse.json(
        { error: 'sourceDictionaryId is required' },
        { status: 400 }
      );
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

    // Check if already forked
    const existingFork = await db.query.forks.findFirst({
      where: and(
        eq(forks.sourceDictionaryId, sourceDictionaryId),
        eq(forks.forkedById, dbUser.id)
      ),
    });

    if (existingFork) {
      return NextResponse.json(
        { error: 'You have already forked this dictionary' },
        { status: 400 }
      );
    }

    // Fetch source dictionary with all words and phrases
    const sourceDict = await db.query.dictionaries.findFirst({
      where: and(
        eq(dictionaries.id, sourceDictionaryId),
        eq(dictionaries.isPublic, true)
      ),
      with: {
        words: {
          with: { examplePhrases: true },
        },
      },
    });

    if (!sourceDict) {
      return NextResponse.json(
        { error: 'Public dictionary not found' },
        { status: 404 }
      );
    }

    // Prevent forking own dictionary
    if (sourceDict.userId === dbUser.id) {
      return NextResponse.json(
        { error: 'You cannot fork your own dictionary' },
        { status: 400 }
      );
    }

    const newDictionaryId = randomUUID();
    const newTitle = `${sourceDict.title} (Forked)`;

    const newWordsToInsert: typeof words.$inferInsert[] = [];
    const newPhrasesToInsert: typeof examplePhrases.$inferInsert[] = [];

    for (const oldWord of sourceDict.words) {
      const newWordId = randomUUID();
      newWordsToInsert.push({
        id: newWordId,
        dictionaryId: newDictionaryId,
        title: oldWord.title,
        translation: oldWord.translation,
        order: oldWord.order,
      });

      for (const oldPhrase of oldWord.examplePhrases) {
        newPhrasesToInsert.push({
          id: randomUUID(),
          wordId: newWordId,
          phrase: oldPhrase.phrase,
          translation: oldPhrase.translation,
          isAiGenerated: oldPhrase.isAiGenerated,
        });
      }
    }

    await db.transaction(async (tx) => {
      // 1. Insert new Dictionary
      await tx.insert(dictionaries).values({
        id: newDictionaryId,
        userId: dbUser.id,
        title: newTitle,
        description: sourceDict.description,
        language: sourceDict.language,
        isPublic: false,
      });

      // 2. Insert Words in chunks (Postgres has parameter limits, but 500 words = ~2500 params, well within limits)
      if (newWordsToInsert.length > 0) {
        await tx.insert(words).values(newWordsToInsert);
      }

      // 3. Insert Phrases
      if (newPhrasesToInsert.length > 0) {
        await tx.insert(examplePhrases).values(newPhrasesToInsert);
      }

      // 4. Record Fork
      await tx.insert(forks).values({
        sourceDictionaryId: sourceDict.id,
        forkedById: dbUser.id,
      });
    });

    return NextResponse.json({ success: true, dictionaryId: newDictionaryId });
  } catch (error) {
    console.error('Forking error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
