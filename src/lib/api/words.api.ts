import { http } from "@/lib/api/http";

export async function createWord(payload: Record<string, unknown>) {
  return http<unknown>("/api/words", {
    method: "POST",
    body: payload,
  });
}

export async function updateWord(id: string, payload: Record<string, unknown>) {
  return http<unknown>(`/api/words/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteWord(id: string) {
  return http<unknown>(`/api/words/${id}`, {
    method: "DELETE",
  });
}

export async function reorderWords(
  updates: Array<{ id: string; order: number }>,
) {
  return http<unknown>("/api/words/reorder", {
    method: "PATCH",
    body: { updates },
  });
}

export async function suggestWords(params: {
  q?: string;
  lang?: string;
  endpoint?: string;
}) {
  const url = new URL(
    params.endpoint || "/api/words/suggest",
    window.location.origin,
  );
  if (params.q) {
    url.searchParams.set("q", params.q);
  }
  if (params.lang) {
    url.searchParams.set("lang", params.lang);
  }
  return http<{ suggestions: string[] }>(url.toString());
}

export async function suggestTranslation(params: {
  word?: string;
  lang?: string;
  targetLang?: string;
  endpoint?: string;
}) {
  const url = new URL(
    params.endpoint || "/api/words/translate-suggest",
    window.location.origin,
  );
  if (params.word) {
    url.searchParams.set("word", params.word);
  }
  if (params.lang) {
    url.searchParams.set("lang", params.lang);
  }
  if (params.targetLang) {
    url.searchParams.set("targetLang", params.targetLang);
  }
  return http<{ suggestions: string[] }>(url.toString());
}
