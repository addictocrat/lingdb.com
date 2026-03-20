import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchOpenRouterChatCompletion } from "@/lib/openrouter/chat";

const demoPhraseSchema = z.object({
  word: z.string().min(2).max(80),
  translation: z.string().min(1).max(120),
  language: z.string().min(2).max(10),
  sourceLanguage: z.string().min(2).max(10),
  magicWords: z.array(z.string()).optional(),
});

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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
    const parsed = demoPhraseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { word, translation, language, sourceLanguage, magicWords } =
      parsed.data;

    const hintWords = magicWords?.length
      ? `Related vocabulary to optionally include: ${magicWords.join(", ")}.`
      : "";

    const response = await fetchOpenRouterChatCompletion({
      apiKey: openRouterKey,
      messages: [
        {
          role: "system",
          content: `You generate one beginner-friendly example sentence for language learners. Return ONLY JSON object format: {"phrase":"...","translation":"..."}. "phrase" must be in ${language}. "translation" must be in ${sourceLanguage}. Keep phrase natural and concise (5-14 words).`,
        },
        {
          role: "user",
          content: `Primary word: ${word}. Meaning: ${translation}. ${hintWords}`,
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Demo example phrase API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate demo phrase" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let phrase = "";
    let phraseTranslation = "";
    try {
      const cleaned = content
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const parsedObject = JSON.parse(cleaned);
      phrase =
        typeof parsedObject?.phrase === "string" ? parsedObject.phrase : "";
      phraseTranslation =
        typeof parsedObject?.translation === "string"
          ? parsedObject.translation
          : "";
    } catch {
      phrase = "";
      phraseTranslation = "";
    }

    return NextResponse.json({
      phrase,
      translation: phraseTranslation,
    });
  } catch (error) {
    console.error("Demo suggest phrase route error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
