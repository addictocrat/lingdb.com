import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, subscriptions, activityLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DEACTIVATED: Simulated free upgrade is disabled as we are moving to real Iyzico integration
    return NextResponse.json(
      { error: 'Simulated payment is currently deactivated. Please wait for the real Iyzico integration.' },
      { status: 501 }
    );

    /* 
    // The code below is deactivated but kept for reference as requested
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // SIMULATION MODE: Directly upgrade user to PREMIUM without real Iyzico processing
    // In production, this endpoint would initialize the Iyzico form and return the HTML/tokens
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    await db.transaction(async (tx) => {
      // 1. Upgrade user tier and grant premium credits
      await tx
        .update(users)
        .set({
          tier: 'PREMIUM',
          aiCredits: 100, // Premium users get 100
        })
        .where(eq(users.id, dbUser.id));

      // 2. Create simulated subscription record
      await tx.insert(subscriptions).values({
        userId: dbUser.id,
        status: 'ACTIVE',
        iyzicoSubId: `sim_${Date.now()}`,
        currentPeriodEnd: thirtyDaysFromNow,
      });

      // 3. Log activity
      await tx.insert(activityLogs).values({
        userId: dbUser.id,
        type: 'subscription_upgraded',
        metadata: { plan: 'premium', amount: 1.49 },
      });
    });

    return NextResponse.json({ success: true, message: 'Simulated payment successful' });
    */
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
