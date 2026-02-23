import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { words, dictionaries, users, dictionaryEditors } from '@/lib/db/schema';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
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

  // Update dictionary timestamp and possibly email co-editors + owner
  const now = new Date();
  let latestEmailSent = dictToEdit.lastDailyUpdateSentAt;
  
  // Calculate if 24 hours passed
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const shouldSendEmail = !latestEmailSent || latestEmailSent < oneDayAgo;

  console.log(`[Word Email] shouldSendEmail=${shouldSendEmail}, lastDailyUpdateSentAt=${latestEmailSent?.toISOString() || 'null'}, oneDayAgo=${oneDayAgo.toISOString()}`);
  console.log(`[Word Email] editors count=${dictToEdit.dictionaryEditors.length}, ownerId=${dictToEdit.userId}, adderId=${dbUser.id}`);

  if (shouldSendEmail) {
    // Collect all user IDs to notify: editors + owner, excluding the person adding the word
    const recipientUserIds: string[] = [];
    
    // Add editors (excluding the person adding the word)
    dictToEdit.dictionaryEditors
      .filter((ed) => ed.userId !== dbUser.id)
      .forEach((ed) => recipientUserIds.push(ed.userId));
    
    // Add owner (if the person adding is not the owner)
    if (dictToEdit.userId !== dbUser.id) {
      recipientUserIds.push(dictToEdit.userId);
    }

    console.log(`[Word Email] recipientUserIds=${JSON.stringify(recipientUserIds)}`);

    if (recipientUserIds.length > 0) {
      latestEmailSent = now;
      // Send email without blocking response
      const recipientEmails = await db.query.users.findMany({
        where: inArray(users.id, recipientUserIds),
        columns: { email: true }
      });

      console.log(`[Word Email] recipientEmails=${JSON.stringify(recipientEmails)}`);

      const dictPath = dictToEdit.slug || dictToEdit.id;
      const dictionaryLink = `${APP_URL}/en/dictionary/${dictPath}`;
      
      Promise.all(
        recipientEmails.map((recipient) =>
          transporter.sendMail({
            from: `"LingDB" <${EMAILS.NOREPLY}>`,
            to: recipient.email,
            subject: `${dbUser.username} added ${result.data.title} to the ${dictToEdit.title} dictionary.`,
            html: getDictionaryUpdateEmailHtml(
              dbUser.username,
              dictToEdit.title,
              dictionaryLink
            ),
          })
        )
      ).then((results) => {
        console.log(`[Word Email] Successfully sent ${results.length} emails`);
      }).catch((err) => {
        console.error(`[Word Email] Failed to send emails:`, err);
      });
    } else {
      console.log(`[Word Email] No recipients to email`);
    }
  } else {
    console.log(`[Word Email] Skipped — last email was sent less than 24h ago`);
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
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://lingdb.com'}/api/dictionaries/generate-seo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
      body: JSON.stringify({ dictionaryId: dictToEdit.id }),
    }).catch(console.error);
  }

  return NextResponse.json({ word: newWord }, { status: 201 });
}
