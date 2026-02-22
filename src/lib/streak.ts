import { isYesterday, isToday } from 'date-fns';

/**
 * Calculates the new streak count based on the user's last active date.
 * @param lastActiveDate The date the user was last active.
 * @param currentStreak The user's current streak count.
 * @returns The new streak count.
 */
export function calculateNewStreak(lastActiveDate: Date | null, currentStreak: number): number {
  if (!lastActiveDate) return 1;

  if (isToday(lastActiveDate)) {
    return currentStreak; // Already active today, streak remains the same
  }

  if (isYesterday(lastActiveDate)) {
    return currentStreak + 1; // Active yesterday, increment streak
  }

  // Not active yesterday or today, streak resets to 1
  return 1;
}
