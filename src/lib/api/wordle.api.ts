import { http } from "@/lib/api/http";

export async function getWordleGame(gameId: string) {
  return http<{ game: Record<string, unknown> }>(`/api/wordle/game/${gameId}`);
}

export async function createWordleGame(payload: Record<string, unknown>) {
  return http<{ gameId: string; sharePath: string; shareUrl: string }>(
    "/api/wordle/create",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function submitWordleGuess(payload: {
  gameId: string;
  guess: string;
}) {
  return http<{
    guess: string;
    pattern: Array<"correct" | "present" | "absent">;
    isWin?: boolean;
    solverNote?: string | null;
  }>("/api/wordle/guess", {
    method: "POST",
    body: payload,
  });
}
