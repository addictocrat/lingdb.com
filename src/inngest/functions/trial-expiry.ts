import { inngest } from "../client";
import { db } from "@/lib/db/client";
import { users, subscriptions } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

export const trialExpiry = inngest.createFunction(
  { id: "trial-expiry" },
  { cron: "0 2 * * *" }, // Run daily at 2 AM
  async ({ step }) => {
    const now = new Date();

    const expiredTrials = await step.run("fetch-expired-trials", async () => {
      return db.query.subscriptions.findMany({
        where: and(
          eq(subscriptions.status, 'TRIAL'),
          lt(subscriptions.trialEndsAt, now)
        )
      });
    });

    const results = [];
    for (const sub of expiredTrials) {
      const result = await step.run(`downgrade-user-${sub.userId}`, async () => {
        await db.transaction(async (tx) => {
          // 1. Downgrade user tier
          await tx.update(users)
            .set({ tier: 'FREE' })
            .where(eq(users.id, sub.userId));
            
          // 2. Update subscription status
          await tx.update(subscriptions)
            .set({ 
              status: 'EXPIRED',
              updatedAt: new Date()
            })
            .where(eq(subscriptions.id, sub.id));
        });
        
        return { userId: sub.userId, status: 'downgraded' };
      });
      results.push(result);
    }

    return { expiredCount: results.length };
  }
);
