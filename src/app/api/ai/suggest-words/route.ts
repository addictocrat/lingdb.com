import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { users, dictionaries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, logActivity } from "@/lib/rate-limit";

const suggestSchema = z.object({
  dictionaryId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  language: z.string().min(2),
  sourceLanguage: z.string().min(2),
  existingWords: z.array(
    z.object({
      title: z.string(),
      translation: z.string(),
    }),
  ),
  isRefresh: z.boolean().optional(),
  excludedWords: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = suggestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: result.error.issues },
        { status: 400 },
      );
    }

    const {
      dictionaryId,
      title,
      description,
      language,
      sourceLanguage,
      existingWords,
      isRefresh,
      excludedWords,
    } = result.data;

    // Minimum words check
    if (existingWords.length < 2) {
      return NextResponse.json(
        { error: "Add at least 2 words to get magic suggestions" },
        { status: 400 },
      );
    }

    // Get DB user for credits
    const dbUser = await db.query.users.findFirst({
      where: eq(users.supabaseId, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limiting: 5 requests per minute
    const isAllowed = await checkRateLimit(dbUser.id, "suggest_words", { limit: 5 });

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 },
      );
    }

    // Log the request
    await logActivity(dbUser.id, "suggest_words", { dictionaryId });

    const wordListString = existingWords
      .map((w) => `${w.title} (${w.translation})`)
      .join(", ");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL
            ? `https://${process.env.NEXT_PUBLIC_APP_URL}`
            : "http://localhost:3000",
          "X-Title": "Lingdb",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-small-creative",
          messages: [
            {
              role: "system",
              content: `You are a helpful language learning assistant. Your task is to suggest 3 new vocabulary words that fit the SEMANTIC THEME of the user's dictionary.

Target Language: '${language}'
Source Language: '${sourceLanguage}'

Dictionary Context:
- Title: ${title}
- Description: ${description || "No description"}
- Existing Vocabulary: ${wordListString}
${excludedWords && excludedWords.length > 0 ? `- Words to EXCLUDE (Already shown, do not suggest): ${excludedWords.join(", ")}` : ""}

CRITICAL INSTRUCTIONS:
1. SEMANTIC PRIORITY: Analyze the existing vocabulary words. Identify the dominant semantic theme or cluster.
2. DOMINANCE RULE: The theme of the EXISTING WORDS is MORE IMPORTANT than the Title or Description.
3. UNIQUENESS: Suggested words MUST NOT be any of the existing words, their close synonyms, or listed excluded words.
4. FORMAT: Return ONLY a JSON array of 3 objects: {"word": "...", "translation": "..."}.
5. LANGUAGE: "word" must be in ${language}, "translation" must be in ${sourceLanguage}. Keep translations concise (1-2 words).

No markdown, no explanations.`,
            },
            {
              role: "user",
              content: `Analyze the theme of these words: ${wordListString}. Suggest 3 more related words for this dictionary in ${language}.`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter suggestion error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate suggestions" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";

    let suggestions = [];
    try {
      const cleaned = content
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      suggestions = JSON.parse(cleaned);
      if (Array.isArray(suggestions)) {
        suggestions = suggestions.map((s) => ({ ...s, isAdded: false }));
      }
    } catch {
      suggestions = [];
    }

    if (suggestions.length > 0) {
      await db
        .update(dictionaries)
        .set({ activeMagicWords: suggestions })
        .where(eq(dictionaries.id, dictionaryId));
    }

    return NextResponse.json({
      suggestions,
      creditsRemaining: dbUser.aiCredits,
    });
  } catch (error) {
    console.error("Magic words API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
