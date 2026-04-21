import { http } from "@/lib/api/http";

export async function suggestAiWords(payload: Record<string, unknown>) {
  return http<{
    suggestions: Array<{
      word: string;
      translation: string;
      isAdded?: boolean;
    }>;
  }>("/api/ai/suggest-words", {
    method: "POST",
    body: payload,
  });
}

export async function suggestAiWordsDemo(payload: Record<string, unknown>) {
  return http<{ suggestions: Array<{ word: string; translation: string }> }>(
    "/api/ai/suggest-words-demo",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function suggestAiDemoPhrases(payload: Record<string, unknown>) {
  return http<{ phrase?: string; translation?: string }>(
    "/api/ai/suggest-demo-phrases",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function generateAiPhrases(wordId: string) {
  return http<{ phrases: unknown[]; creditsRemaining?: number }>(
    "/api/ai/generate-phrases",
    {
      method: "POST",
      body: { wordId },
    },
  );
}

export async function generateDictionarySeo(payload: Record<string, unknown>) {
  return http<{ seoTitle?: string; seoDescription?: string }>(
    "/api/dictionaries/generate-seo",
    {
      method: "POST",
      body: payload,
    },
  );
}
