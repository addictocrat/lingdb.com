import { http } from "@/lib/api/http";

export async function completeFlashcardSession(dictionaryId: string) {
  return http<unknown>("/api/study/flashcard/complete", {
    method: "POST",
    body: { dictionaryId },
  });
}

export async function completeQuiz(payload: {
  dictionaryId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  questionTypes: string[];
  duration: number;
}) {
  return http<unknown>("/api/study/quiz/complete", {
    method: "POST",
    body: payload,
  });
}
