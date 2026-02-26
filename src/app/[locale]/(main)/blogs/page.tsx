import { db } from "@/lib/db/client";
import { blogs, blogTranslations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import BlogCard from "@/components/blogs/BlogCard";

export default async function BlogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const allBlogs = await db.query.blogs.findMany({
    where: eq(blogs.status, "PUBLISHED"),
    orderBy: [desc(blogs.createdAt)],
    with: {
      author: {
        columns: { username: true },
      },
      translations: true,
    },
  });

  // Map blogs with locale-specific content
  const localizedBlogs = allBlogs.map((blog) => {
    if (locale === "en") {
      const { translations, ...rest } = blog;
      return rest;
    }
    const translation = blog.translations.find((t) => t.locale === locale);
    if (!translation) {
      const { translations, ...rest } = blog;
      return rest;
    }
    const { translations, ...rest } = blog;
    return {
      ...rest,
      title: translation.title,
      description: translation.description ?? rest.description,
      keywords: translation.keywords ?? rest.keywords,
      seoTitle: translation.seoTitle ?? rest.seoTitle,
      seoDescription: translation.seoDescription ?? rest.seoDescription,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-black tracking-tight text-[var(--fg)] sm:text-7xl">
          Lingdb <span className="text-primary-500">Blog</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-[var(--fg)]/60">
          Deep dives into language learning, linguistics, and the stories behind
          the words we love.
        </p>
      </div>

      {allBlogs.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[3rem] border-4 border-dashed border-[var(--border-color)] bg-[var(--surface)]/50 p-12 text-center">
          <div className="mb-6 rounded-full bg-[var(--bg)] p-6 shadow-xl">
            <span className="text-7xl">✍️</span>
          </div>
          <h2 className="text-3xl font-black">Coming Soon!</h2>
          <p className="mt-4 text-xl text-[var(--fg)]/60">
            Our linguists are busy writing some amazing content for you.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {localizedBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} locale={locale} />
          ))}
        </div>
      )}
    </main>
  );
}
