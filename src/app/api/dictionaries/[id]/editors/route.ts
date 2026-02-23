import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dictionaryEditors, dictionaries, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { transporter, EMAILS } from '@/lib/email/client';
import { getDictionaryInvitationEmailHtml } from '@/lib/email/templates';
import { APP_URL } from '@/lib/utils/constants';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership
    const dict = await db.query.dictionaries.findFirst({
      where: and(
        eq(dictionaries.id, dictionaryId),
        eq(dictionaries.userId, dbUser.id)
      ),
    });

    if (!dict) {
      return NextResponse.json(
        { error: 'Dictionary not found or unauthorized' },
        { status: 404 }
      );
    }

    const editors = await db
      .select({
        id: dictionaryEditors.id,
        status: dictionaryEditors.status,
        createdAt: dictionaryEditors.createdAt,
        user: {
          id: users.id,
          username: users.username,
        },
      })
      .from(dictionaryEditors)
      .innerJoin(users, eq(dictionaryEditors.userId, users.id))
      .where(eq(dictionaryEditors.dictionaryId, dictionaryId));

    return NextResponse.json({ editors });
  } catch (error) {
    console.error('Error fetching editors:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'Editor user ID is required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const dictionaryId = resolvedParams.id;

    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userId === dbUser.id) {
      return NextResponse.json(
        { error: 'Cannot invite yourself' },
        { status: 400 }
      );
    }

    // Check if dictionary exists and user is owner
    const dict = await db.query.dictionaries.findFirst({
      where: and(
        eq(dictionaries.id, dictionaryId),
        eq(dictionaries.userId, dbUser.id)
      ),
      with: {
        words: true,
      },
    });

    if (!dict) {
      return NextResponse.json(
        { error: 'Dictionary not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if already invited
    const existing = await db.query.dictionaryEditors.findFirst({
      where: and(
        eq(dictionaryEditors.dictionaryId, dictionaryId),
        eq(dictionaryEditors.userId, userId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already an editor or has a pending invite' },
        { status: 400 }
      );
    }

    // Fetch invited user details for email
    const invitedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Invited user not found' },
        { status: 404 }
      );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Create invite
    await db.insert(dictionaryEditors).values({
      dictionaryId,
      userId,
      inviteToken,
      status: 'PENDING',
    });

    // Send email
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const origin = host ? `${protocol}://${host}` : APP_URL;
    
    const inviteLink = `${origin}/api/dictionaries/invite/accept?token=${inviteToken}`;
    
    await transporter.sendMail({
      from: `"LingDB" <${EMAILS.NOREPLY}>`,
      to: invitedUser.email,
      subject: `${dbUser.username || 'Someone'} invited you to co-edit a dictionary`,
      html: getDictionaryInvitationEmailHtml(
        dbUser.username || 'Someone',
        dict.title,
        dict.words.length,
        inviteLink
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
