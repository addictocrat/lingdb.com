import BlogEditor from '@/components/admin/blogs/BlogEditor';

export default async function AdminBlogNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create New Blog</h1>
        <p className="text-[var(--fg)]/60">Share your knowledge with everyone.</p>
      </div>

      <BlogEditor locale={locale} />
    </div>
  );
}
