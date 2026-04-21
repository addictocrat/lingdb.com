import BlogEditor from "@/components/admin/blogs/BlogEditor";
import { db } from "@/lib/db/client";
import { blogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface TranslationData {
  title: string;
  description: string;
  content: string;
  keywords: string;
  seoTitle: string;
  seoDescription: string;
}

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, id),
    with: {
      translations: true,
    },
  });

  if (!blog) {
    notFound();
  }

  // Transform translations array into a locale-keyed object
  const translationsMap: Record<string, TranslationData> = {};
  for (const t of blog.translations) {
    translationsMap[t.locale] = {
      title: t.title,
      description: t.description ?? "",
      content:
        typeof t.content === "string"
          ? t.content
          : JSON.stringify(t.content ?? ""),
      keywords: t.keywords ?? "",
      seoTitle: t.seoTitle ?? "",
      seoDescription: t.seoDescription ?? "",
    };
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Edit Blog Post</h1>
        <p className="text-[var(--fg)]/60">
          Refine your content and SEO settings.
        </p>
      </div>

      <BlogEditor
        blog={blog}
        locale={locale}
        initialTranslations={translationsMap}
      />
    </div>
  );
}
