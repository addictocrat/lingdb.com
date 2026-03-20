import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchOpenRouterChatCompletion } from "@/lib/openrouter/chat";

const demoSuggestSchema = z.object({
  word: z.string().min(2).max(80),
  translation: z.string().min(1).max(120),
  language: z.string().min(2).max(10),
  sourceLanguage: z.string().min(2).max(10),
});

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const existing = rateLimitMap.get(clientKey);

  if (!existing || existing.resetAt < now) {
    rateLimitMap.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  existing.count += 1;
  rateLimitMap.set(clientKey, existing);
  return existing.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 },
      );
    }

    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = demoSuggestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { word, translation, language, sourceLanguage } = parsed.data;

    const response = await fetchOpenRouterChatCompletion({
      apiKey: openRouterKey,
      messages: [
        {
          role: "system",
          content: `You suggest vocabulary for language learners. Return ONLY a JSON array of exactly 3 objects in this exact format: [{"word":"...","translation":"..."}].

STRICT RULES:
- "word" must be in ${language}.
- "translation" must be in ${sourceLanguage}.
- Each "word" must be a single word only (one token): no spaces, no hyphens, no punctuation, no parentheses.
- Each "word" must be a close synonym of the seed word (not an explanation, phrase, or sentence).
- Do not include the seed word itself.
- No duplicates.
- No extra text, no markdown, no commentary.`,
        },
        {
          role: "user",
          content: `Seed word: ${word}. Seed translation: ${translation}. Return 3 one-word synonyms only.`,
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Demo magic words API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate demo suggestions" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let suggestions: Array<{ word: string; translation: string }> = [];
    try {
      const cleaned = content
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const parsedSuggestions = JSON.parse(cleaned);
      if (Array.isArray(parsedSuggestions)) {
        suggestions = parsedSuggestions
          .filter((item) => item?.word && item?.translation)
          .slice(0, 3)
          .map((item) => ({
            word: String(item.word),
            translation: String(item.translation),
          }));
      }
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Demo suggest words route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
