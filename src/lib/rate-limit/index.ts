import { db } from "@/lib/db/client";
import { activityLogs } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

interface RateLimitOptions {
  limit?: number;
  windowMs?: number;
}

/**
 * Checks if a user has exceeded the rate limit for a specific activity type.
 * Returns true if allowed, false if denied.
 */
export async function checkRateLimit(
  userId: string,
  type: string,
  options: RateLimitOptions = {},
) {
  const { limit = 5, windowMs = 60 * 1000 } = options;
  const windowStart = new Date(Date.now() - windowMs);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.type, type),
        gte(activityLogs.createdAt, windowStart),
      ),
    );

  return count < limit;
}

/**
 * Logs an activity into the activity_logs table.
 */
export async function logActivity(
  userId: string,
  type: string,
  metadata?: unknown,
) {
  await db.insert(activityLogs).values({
    userId,
    type,
    metadata: metadata || null,
  });
}
