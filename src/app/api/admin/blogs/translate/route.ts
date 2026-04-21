import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { users, blogs, blogTranslations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const translateBlogSchema = z.object({
  blogId: z.string().uuid(),
});

const LOCALES = ["fr", "es", "tr", "de"] as const;

const LOCALE_NAMES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  tr: "Turkish",
  de: "German",
};

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  });

  return dbUser?.role === "ADMIN" ? dbUser : null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const result = translateBlogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 },
      );
    }

    const { blogId } = result.data;

    // Fetch the English blog
    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, blogId),
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Translate to all locales in parallel
    const translationPromises = LOCALES.map(async (locale) => {
      const langName = LOCALE_NAMES[locale];

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
              {
                role: "system",
                content: `You are a professional translator specializing in language-learning content. Translate the following blog content from English to ${langName}.

RULES:
1. Translate the title, description, content (HTML), keywords, seoTitle, and seoDescription.
2. Preserve ALL HTML tags and structure exactly as they are. Only translate the text content inside the tags.
3. Keep technical terms, brand names ("Lingdb"), and URLs unchanged.
4. The seoTitle should be max 60 characters in ${langName}.
5. The seoDescription should be max 160 characters in ${langName}.
6. Maintain the same tone: helpful, educational, and engaging.

Return ONLY a valid JSON object:
{
  "title": "translated title",
  "description": "translated description",
  "content": "translated HTML content",
  "keywords": "translated, comma, separated, keywords",
  "seoTitle": "translated SEO title",
  "seoDescription": "translated SEO meta description"
}

CRITICAL: Return ONLY raw JSON, no markdown fences.`,
              },
              {
                role: "user",
                content: JSON.stringify({
                  title: blog.title,
                  description: blog.description,
                  content: blog.content,
                  keywords: blog.keywords,
                  seoTitle: blog.seoTitle,
                  seoDescription: blog.seoDescription,
                }),
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Translation error for ${locale}:`, errorText);
        throw new Error(`Translation to ${langName} failed`);
      }

      const data = await response.json();
      const raw = data.choices[0]?.message?.content || "{}";
      const cleaned = raw
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return { locale, ...parsed };
    });

    const translations = await Promise.all(translationPromises);

    // Upsert translations into the database
    for (const t of translations) {
      const existing = await db.query.blogTranslations.findFirst({
        where: and(
          eq(blogTranslations.blogId, blogId),
          eq(blogTranslations.locale, t.locale),
        ),
      });

      if (existing) {
        await db
          .update(blogTranslations)
          .set({
            title: t.title,
            description: t.description,
            content: t.content,
            keywords: t.keywords,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
            updatedAt: new Date(),
          })
          .where(eq(blogTranslations.id, existing.id));
      } else {
        await db.insert(blogTranslations).values({
          blogId,
          locale: t.locale,
          title: t.title,
          description: t.description,
          content: t.content,
          keywords: t.keywords,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        });
      }
    }

    return NextResponse.json({
      success: true,
      translations: translations.reduce(
        (acc, t) => {
          acc[t.locale] = {
            title: t.title,
            description: t.description,
            content: t.content,
            keywords: t.keywords,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    });
  } catch (error) {
    console.error("Blog translation API error:", error);
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 },
    );
  }
}
