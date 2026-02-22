import { inngest } from "../client";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq, lt, sql } from "drizzle-orm";
import { subDays } from "date-fns";

export const creditReset = inngest.createFunction(
  { id: "credit-reset" },
  { cron: "0 1 * * *" }, // Run daily at 1 AM
  async ({ step }) => {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const usersToReset = await step.run("fetch-users-needing-reset", async () => {
      return db.query.users.findMany({
        where: lt(users.creditsResetAt, thirtyDaysAgo)
      });
    });

    const results = [];
    for (const user of usersToReset) {
      const result = await step.run(`reset-credits-${user.id}`, async () => {
        const newCredits = user.tier === 'PREMIUM' ? 100 : 30;
        
        await db.update(users)
          .set({ 
            aiCredits: newCredits,
            creditsResetAt: new Date()
          })
          .where(eq(users.id, user.id));
          
        return { user: user.username, credits: newCredits };
      });
      results.push(result);
    }

    return { resetCount: results.length };
  }
);
