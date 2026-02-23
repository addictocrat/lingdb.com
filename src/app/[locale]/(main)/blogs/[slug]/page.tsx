import { db } from '@/lib/db/client';
import { blogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import BlogJsonLd from '@/components/seo/BlogJsonLd';
import BlogContent from '@/components/blogs/BlogContent';
import { Calendar, User, Tag, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

interface BlogDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.slug, slug),
  });

  if (!blog) return { title: 'Not Found' };

  return {
    title: blog.seoTitle || blog.title,
    description: (blog.seoDescription || blog.description) ?? undefined,
    keywords: blog.keywords ?? undefined,
    openGraph: {
      title: blog.seoTitle || blog.title,
      description: (blog.seoDescription || blog.description) ?? undefined,
      type: 'article',
      publishedTime: (blog.publishedAt || blog.createdAt).toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.slug, slug),
    with: {
      author: {
        columns: { username: true }
      }
    }
  });

  if (!blog || (blog.status !== 'PUBLISHED' && process.env.NODE_ENV === 'production')) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20">
      <BlogJsonLd blog={blog} />
      
      <Link 
        href={`/${locale}/blogs`}
        className="mb-8 flex items-center gap-2 text-lg font-bold text-primary-500 hover:gap-3 transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
        Back to Blogs
      </Link>

      <header className="mb-12 space-y-6">
        <h1 className="text-4xl font-black leading-tight tracking-tight text-[var(--fg)] sm:text-6xl">
          {blog.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-6 text-lg text-[var(--fg)]/60">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(locale, { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-500" />
            <span className="font-bold">{blog.author?.username || 'Lingdb Team'}</span>
          </div>
       
        </div>
      </header>

      <BlogContent content={blog.content as string} />

      <footer className="mt-20 rounded-[3rem] bg-[var(--surface)] p-10 text-center border-2 border-[var(--border-color)]">
        <h3 className="text-2xl font-black mb-4">Enjoyed this article?</h3>
        <p className="text-lg text-[var(--fg)]/60 mb-8">
          Join Lingdb today and start building your own dictionaries and learning vocabulary effectively!
        </p>
        <Link href={`/${locale}/signup`}>
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-8 py-4 text-xl font-bold text-white shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all hover:scale-105 active:scale-95">
            Get Started for Free
          </div>
        </Link>
      </footer>

         {blog.keywords && (
            <div className="flex flex-wrap items-center gap-2 py-16">
              <Tag className="h-5 w-5 text-primary-500" />
              <div className="flex flex-wrap gap-2">
                {blog.keywords.split(',').map(kw => (
                  <span key={kw} className="bg-primary-500/20 p-2 rounded-xl whitespace-nowrap text-sm font-semibold opacity-70">#{kw.trim()}</span>
                ))}
              </div>
            </div>
          )}
    </article>
  );
}
