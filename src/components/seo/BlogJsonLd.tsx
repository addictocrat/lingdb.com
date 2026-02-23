import type { Blog } from '@/lib/db/schema';

interface BlogJsonLdProps {
  blog: Blog & { author?: { username: string | null } };
}

export default function BlogJsonLd({ blog }: BlogJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.description,
    author: {
      '@type': 'Person',
      name: blog.author?.username || 'Lingdb Team',
    },
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt,
    keywords: blog.keywords,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://lingdb.com/blogs/${blog.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lingdb',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lingdb.com/logo.png', // Replace with actual logo URL if available
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
