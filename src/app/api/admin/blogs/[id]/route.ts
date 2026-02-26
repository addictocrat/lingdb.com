import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { users, blogs, blogTranslations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const translationSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.any(),
  keywords: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const blogUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  keywords: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  schemaData: z.any().optional(),
  translations: z.record(z.string(), translationSchema).optional(),
});

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  try {
    const blog = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
      with: {
        author: {
          columns: { username: true, email: true },
        },
        translations: true,
      },
    });

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Transform translations array into a locale-keyed object
    const translationsMap: Record<string, any> = {};
    for (const t of blog.translations) {
      translationsMap[t.locale] = {
        title: t.title,
        description: t.description,
        content: t.content,
        keywords: t.keywords,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
      };
    }

    return NextResponse.json({ ...blog, translations: translationsMap });
  } catch (error) {
    console.error("Get blog error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json();
    const result = blogUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", issues: result.error.issues },
        { status: 400 },
      );
    }

    const currentBlog = await db.query.blogs.findFirst({
      where: eq(blogs.id, id),
    });

    if (!currentBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const { translations: translationsData, ...blogFields } = result.data;
    const updates = { ...blogFields, updatedAt: new Date() };

    // Set publishedAt if status is changing to PUBLISHED
    if (
      result.data.status === "PUBLISHED" &&
      currentBlog.status !== "PUBLISHED"
    ) {
      (updates as any).publishedAt = new Date();
    }

    const [updatedBlog] = await db
      .update(blogs)
      .set(updates)
      .where(eq(blogs.id, id))
      .returning();

    // Upsert translations if provided
    if (translationsData) {
      for (const [locale, data] of Object.entries(translationsData)) {
        const existing = await db.query.blogTranslations.findFirst({
          where: and(
            eq(blogTranslations.blogId, id),
            eq(blogTranslations.locale, locale),
          ),
        });

        if (existing) {
          await db
            .update(blogTranslations)
            .set({
              title: data.title,
              description: data.description,
              content: data.content,
              keywords: data.keywords,
              seoTitle: data.seoTitle,
              seoDescription: data.seoDescription,
              updatedAt: new Date(),
            })
            .where(eq(blogTranslations.id, existing.id));
        } else {
          await db.insert(blogTranslations).values({
            blogId: id,
            locale,
            title: data.title,
            description: data.description,
            content: data.content,
            keywords: data.keywords,
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription,
          });
        }
      }
    }

    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error("Update blog error:", error);
    if ((error as any).code === "23505") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(blogs)
      .where(eq(blogs.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete blog error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
