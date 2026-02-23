import BlogEditor from '@/components/admin/blogs/BlogEditor';
import { db } from '@/lib/db/client';
import { blogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, id),
  });

  if (!blog) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Edit Blog Post</h1>
        <p className="text-[var(--fg)]/60">Refine your content and SEO settings.</p>
      </div>

      <BlogEditor blog={blog} locale={locale} />
    </div>
  );
}
