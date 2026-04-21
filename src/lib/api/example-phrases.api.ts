import { http } from "@/lib/api/http";

export async function listExamplePhrases(wordId: string) {
  return http<{ phrases: unknown[] }>(
    `/api/example-phrases?wordId=${encodeURIComponent(wordId)}`,
  );
}

export async function createExamplePhrase(payload: {
  wordId: string;
  phrase: string;
  translation: string;
}) {
  return http<{ phrase: Record<string, unknown> }>("/api/example-phrases", {
    method: "POST",
    body: payload,
  });
}

export async function deleteExamplePhrase(id: string) {
  return http<unknown>(`/api/example-phrases/${id}`, {
    method: "DELETE",
  });
}
