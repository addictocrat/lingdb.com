import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { words, dictionaries, users, dictionaryEditors } from '@/lib/db/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { z } from 'zod';
import { transporter, EMAILS } from '@/lib/email/client';
import { getDictionaryUpdateEmailHtml } from '@/lib/email/templates';
import { calculateNewStreak } from '@/lib/streak';
import { APP_URL } from '@/lib/utils/constants';

const addWordSchema = z.object({
  dictionaryId: z.string().uuid(),
  title: z.string().min(1, 'Word is required').max(100),
  translation: z.string().min(1, 'Translation is required').max(200),
});

// POST /api/words — add word to dictionary
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const result = addWordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation error', issues: result.error.issues },
      { status: 400 }
    );
  }

  // Verify dictionary ownership or editor access
  const dictToEdit = await db.query.dictionaries.findFirst({
    where: eq(dictionaries.id, result.data.dictionaryId),
    with: {
      dictionaryEditors: {
        where: eq(dictionaryEditors.status, 'ACCEPTED'),
      },
    }
  });

  if (!dictToEdit) {
    return NextResponse.json({ error: 'Dictionary not found' }, { status: 404 });
  }

  const isOwner = dictToEdit.userId === dbUser.id;
  const isEditor = dictToEdit.dictionaryEditors.some((ed) => ed.userId === dbUser.id);

  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: 'Dictionary not found or unauthorized' }, { status: 404 });
  }

  // Check 500 word limit
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(words)
    .where(eq(words.dictionaryId, dictToEdit.id));

  if (count >= 500) {
    return NextResponse.json(
      { error: 'Maximum 500 words per dictionary' },
      { status: 403 }
    );
  }

  // Get next order value
  const [newWord] = await db
    .insert(words)
    .values({
      title: result.data.title,
      translation: result.data.translation,
      dictionaryId: dictToEdit.id,
      order: count,
      lastModifiedById: dbUser.id,
    })
    .returning();

  // Update user stats (totalWords, streak, lastActive)
  const newStreak = calculateNewStreak(dbUser.lastActiveDate, dbUser.streakCount);
  await db
    .update(users)
    .set({ 
      totalWords: dbUser.totalWords + 1,
      streakCount: newStreak,
      lastActiveDate: new Date(),
    })
    .where(eq(users.id, dbUser.id));

  // Update dictionary timestamp and possibly email editors
  const now = new Date();
  let latestEmailSent = dictToEdit.lastDailyUpdateSentAt;
  
  // Calculate if 24 hours passed
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const shouldSendEmail = !latestEmailSent || latestEmailSent < oneDayAgo;

  if (shouldSendEmail && dictToEdit.dictionaryEditors.length > 0) {
    latestEmailSent = now;
    // Send email without blocking response
    const editorUserIds = dictToEdit.dictionaryEditors
      .filter((ed) => ed.userId !== dbUser.id) // Don't email the one adding the word
      .map((ed) => ed.userId);

    if (editorUserIds.length > 0) {
      const editorEmails = await db.query.users.findMany({
        where: sql`${users.id} IN ${editorUserIds}`,
        columns: { email: true }
      });

      const dictionaryLink = `${APP_URL}/en/dictionary/${dictToEdit.id}`;
      
      Promise.all(
        editorEmails.map((ed) =>
          transporter.sendMail({
            from: `"LingDB" <${EMAILS.NOREPLY}>`,
            to: ed.email,
            subject: `${dbUser.username} added a new word to "${dictToEdit.title}"`,
            html: getDictionaryUpdateEmailHtml(
              dbUser.username,
              dictToEdit.title,
              dictionaryLink
            ),
          })
        )
      ).catch(console.error); // Silently catch email errors
    }
  }

  await db
    .update(dictionaries)
    .set({ 
      updatedAt: now,
      lastDailyUpdateSentAt: latestEmailSent 
    })
    .where(eq(dictionaries.id, dictToEdit.id));

  if (dictToEdit.isPublic && dictToEdit.slug) {
    revalidatePath(`/en/library/${dictToEdit.slug}`);
  }

  // Auto-generate SEO metadata when dictionary reaches 5 words
  if (dictToEdit.isPublic && !dictToEdit.seoGeneratedAt && count + 1 === 5) {
    // Fire-and-forget: don't block the response
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dictionaries/generate-seo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ dictionaryId: dictToEdit.id }),
    }).catch(console.error);
  }

  return NextResponse.json({ word: newWord }, { status: 201 });
}
