export type WordleCellState = "correct" | "present" | "absent";

export function normalizeWord(value: string, locale?: string) {
  if (locale) {
    try {
      return value.trim().toLocaleUpperCase(locale);
    } catch {
      return value.trim().toUpperCase();
    }
  }
  return value.trim().toUpperCase();
}

export function isAlphabeticWord(value: string) {
  return /^\p{L}+$/u.test(value);
}

export function evaluateWordleGuess(
  solution: string,
  guess: string,
): WordleCellState[] {
  const answer = solution.toUpperCase().split("");
  const attempt = guess.toUpperCase().split("");
  const states: WordleCellState[] = new Array(answer.length).fill("absent");

  const remainingCounts = new Map<string, number>();

  for (let i = 0; i < answer.length; i += 1) {
    if (attempt[i] === answer[i]) {
      states[i] = "correct";
    } else {
      remainingCounts.set(answer[i], (remainingCounts.get(answer[i]) || 0) + 1);
    }
  }

  for (let i = 0; i < answer.length; i += 1) {
    if (states[i] === "correct") {
      continue;
    }

    const letter = attempt[i];
    const remaining = remainingCounts.get(letter) || 0;

    if (remaining > 0) {
      states[i] = "present";
      remainingCounts.set(letter, remaining - 1);
    }
  }

  return states;
}
