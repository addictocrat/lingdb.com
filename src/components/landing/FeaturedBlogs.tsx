import { db } from "@/lib/db/client";
import { blogs as blogsTable } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import BlogCard from "@/components/blogs/BlogCard";
import { getTranslations } from "next-intl/server";

interface FeaturedBlogsProps {
  locale: string;
}

export default async function FeaturedBlogs({ locale }: FeaturedBlogsProps) {
  const t = await getTranslations("landing");

  // The 3 requested blog slugs
  const requestedSlugs = [
    "quizlet-vs-lingdb-compare-language-tools",
    "duolingo-vs-lingdb-compare-complement",
    "lingvist-vs-lingdb-compare-language-learning",
  ];

  const featuredBlogs = await db.query.blogs.findMany({
    where: inArray(blogsTable.slug, requestedSlugs),
    with: {
      author: {
        columns: { username: true },
      },
      translations: true,
    },
  });

  // Sort by the order of requestedSlugs to maintain the user's preferred order if possible
  const sortedBlogs = featuredBlogs.sort((a, b) => {
    return requestedSlugs.indexOf(a.slug) - requestedSlugs.indexOf(b.slug);
  });

  // Map blogs with locale-specific content (logic matches BlogsPage)
  const localizedBlogs = sortedBlogs.map((blog) => {
    const translation =
      locale === "en"
        ? null
        : blog.translations?.find((t) => t.locale === locale);

    const { translations, ...rest } = blog;

    if (!translation) {
      return rest;
    }

    return {
      ...rest,
      title: translation.title,
      description: translation.description ?? rest.description,
    };
  });

  if (localizedBlogs.length === 0) return null;

  return (
    <section className="py-20 md:py-22">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t("featured_blogs_title") || "From the Blog"}
          </h2>
          <p className="mt-2 text-lg leading-8 text-[var(--fg)]/60">
            {t("featured_blogs_description") ||
              "Learn more about how Lingdb compares to other tools and how to improve your learning."}
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {localizedBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
