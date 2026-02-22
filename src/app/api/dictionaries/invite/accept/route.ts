import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dictionaryEditors } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

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
      // Possibly already accepted or invalid token
      return NextResponse.redirect(new URL('/en/dashboard?error=invalid_or_expired_invite', request.url));
    }

    // Accept the invite
    await db
      .update(dictionaryEditors)
      .set({
        status: 'ACCEPTED',
        inviteToken: null, // Clear token after use
        updatedAt: new Date(),
      })
      .where(eq(dictionaryEditors.id, editorLog.id));

    // Redirect user to the dictionary page
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'en';
    return NextResponse.redirect(new URL(`/${locale}/dictionary/${editorLog.dictionaryId}`, request.url));
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
