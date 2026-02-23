import { db } from '@/lib/db/client';
import { blogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import AdminBlogList from '@/components/admin/blogs/AdminBlogList';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function AdminBlogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const allBlogs = await db.query.blogs.findMany({
    orderBy: [desc(blogs.createdAt)],
    with: {
      author: {
        columns: { username: true }
      }
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Blogs Management</h1>
          <p className="text-[var(--fg)]/60">Create and manage your blog posts.</p>
        </div>
        <Link href={`/${locale}/admin/blogs/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Blog Post
          </Button>
        </Link>
      </div>

      <AdminBlogList initialBlogs={allBlogs} locale={locale} />
    </div>
  );
}
