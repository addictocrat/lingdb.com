import { inngest } from "../client";
import { db } from "@/lib/db/client";
import { users, activityLogs } from "@/lib/db/schema";
import { eq, and, lt, isNull, or } from "drizzle-orm";
import { subDays } from "date-fns";

export const inactivityReminder = inngest.createFunction(
  { id: "inactivity-reminder" },
  { cron: "0 0 * * *" }, // Run daily at midnight
  async ({ step }) => {
    const twentyEightDaysAgo = subDays(new Date(), 28);

    const inactiveUsers = await step.run("fetch-inactive-users", async () => {
      return db.query.users.findMany({
        where: and(
          eq(users.isDeleted, false),
          eq(users.emailOptOut, false),
          lt(users.lastActiveDate, twentyEightDaysAgo),
          or(
            isNull(users.lastReminderSentAt),
            lt(users.lastReminderSentAt, twentyEightDaysAgo)
          )
        ),
        // Get the last word they learned for a personalized touch
        with: {
          activityLogs: {
            where: eq(activityLogs.type, 'word_added'),
            orderBy: (logs, { desc }) => [desc(logs.createdAt)],
            limit: 1,
          }
        }
      });
    });

    const results = [];
    for (const user of inactiveUsers) {
      const lastWord = user.activityLogs?.[0]?.metadata as { title?: string } | undefined;

      const result = await step.run(`send-reminder-${user.id}`, async () => {
        // Use our internal email API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: "We miss you on Lingdb!",
            template: 'reminder',
            data: {
              username: user.username,
              lastWordTitle: lastWord?.title,
              dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
            }
          })
        });

        if (response.ok) {
          await db.update(users)
            .set({ lastReminderSentAt: new Date() })
            .where(eq(users.id, user.id));
          return { email: user.email, status: 'sent' };
        }
        return { email: user.email, status: 'failed' };
      });
      results.push(result);
    }

    return { sent: results.length, details: results };
  }
);
