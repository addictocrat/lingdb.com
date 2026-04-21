import { http } from "@/lib/api/http";

export async function searchUsers(query: string) {
  return http<{ users: Array<{ id: string; username: string }> }>(
    `/api/users/search?q=${encodeURIComponent(query)}`,
  );
}

export async function checkUsernameAvailability(username: string) {
  return http<{ available: boolean }>(
    `/api/users/profile?checkUsername=${encodeURIComponent(username)}`,
  );
}
