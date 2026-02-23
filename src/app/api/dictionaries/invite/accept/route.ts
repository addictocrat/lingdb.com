import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dictionaryEditors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { APP_URL } from '@/lib/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const editorLog = await db.query.dictionaryEditors.findFirst({
      where: and(
        eq(dictionaryEditors.inviteToken, token),
        eq(dictionaryEditors.status, 'PENDING')
      ),
    });

    if (!editorLog) {
      return NextResponse.redirect(`${APP_URL}/en/dashboard?error=invalid_or_expired_invite`);
    }

    // Accept the invite
    await db
      .update(dictionaryEditors)
      .set({
        status: 'ACCEPTED',
        inviteToken: null,
        updatedAt: new Date(),
      })
      .where(eq(dictionaryEditors.id, editorLog.id));

    // Redirect user to the dictionary page
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'en';
    return NextResponse.redirect(`${APP_URL}/${locale}/dictionary/${editorLog.dictionaryId}`);
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
