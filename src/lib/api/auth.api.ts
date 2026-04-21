import { http } from "@/lib/api/http";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  locale: string;
  tier: "FREE" | "PREMIUM";
  aiCredits: number;
  totalWords: number;
  totalFlashcards: number;
  totalQuizzes: number;
  streakCount: number;
  hasCompletedTour: boolean;
  role: "USER" | "ADMIN";
}

export async function getUserProfileBySupabaseId(supabaseId: string) {
  return http<{ profile: UserProfile }>(
    `/api/user/profile?supabaseId=${encodeURIComponent(supabaseId)}`,
  );
}

export async function patchUserProfile(payload: Record<string, unknown>) {
  return http<{ user?: UserProfile; available?: boolean; error?: string }>(
    "/api/users/profile",
    {
      method: "PATCH",
      body: payload,
    },
  );
}
