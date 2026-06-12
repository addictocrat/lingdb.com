import { http } from "@/lib/api/http";

export interface AdminWordleGame {
  id: string;
  solution: string;
  language: string;
  noteToSolver: string | null;
  wordLength: number;
  maxTries: number;
  isOfficial: boolean;
  createdAt: string;
}

export async function listAdminWordles() {
  return http<AdminWordleGame[]>("/api/admin/wordle");
}

export async function createAdminWordle(payload: {
  solution: string;
  language: string;
  noteToSolver?: string;
  maxTries?: number;
}) {
  return http<AdminWordleGame>("/api/admin/wordle", {
    method: "POST",
    body: payload,
  });
}

export async function toggleAdminWordleOfficial(id: string, isOfficial: boolean) {
  return http<AdminWordleGame>(`/api/admin/wordle/${id}`, {
    method: "PATCH",
    body: { isOfficial },
  });
}

export async function deleteAdminWordle(id: string) {
  return http<unknown>(`/api/admin/wordle?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
