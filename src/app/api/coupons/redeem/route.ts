import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { coupons, couponRedemptions, users, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { addMonths } from 'date-fns';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'CODE_REQUIRED' }, { status: 400 });
    }

    // 1. Find the coupon
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    });

    if (!coupon) {
      return NextResponse.json({ error: 'INVALID_CODE' }, { status: 400 });
    }

    // 2. Check if expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'EXPIRED_CODE' }, { status: 400 });
    }

    // 3. Check if max uses reached
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'MAX_USES_REACHED' }, { status: 400 });
    }

    // 4. Check if user already redeemed THIS coupon
    const existingRedemption = await db.query.couponRedemptions.findFirst({
      where: and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.userId, dbUser.id)
      ),
    });

    if (existingRedemption) {
      return NextResponse.json({ error: 'ALREADY_REDEEMED' }, { status: 400 });
    }

    // 5. Execute redemption in a transaction
    await db.transaction(async (tx) => {
      // Increment used count
      await tx
        .update(coupons)
        .set({ usedCount: coupon.usedCount + 1 })
        .where(eq(coupons.id, coupon.id));

      // Record redemption
      await tx.insert(couponRedemptions).values({
        couponId: coupon.id,
        userId: dbUser.id,
      });

      // Update user tier and AI credits
      await tx
        .update(users)
        .set({
          tier: 'PREMIUM',
          aiCredits: dbUser.aiCredits + 100, // Grant 100 AI credits
        })
        .where(eq(users.id, dbUser.id));

      // Update or create subscription
      const existingSub = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, dbUser.id),
      });

      const newPeriodEnd = addMonths(new Date(), 1);

      if (existingSub) {
        await tx
          .update(subscriptions)
          .set({
            status: 'ACTIVE',
            currentPeriodEnd: newPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub.id));
      } else {
        await tx.insert(subscriptions).values({
          userId: dbUser.id,
          status: 'ACTIVE',
          currentPeriodEnd: newPeriodEnd,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to redeem coupon:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
