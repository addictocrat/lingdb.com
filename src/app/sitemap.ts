import { MetadataRoute } from 'next';
import { db } from '@/lib/db/client';
import { dictionaries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { APP_URL } from '@/lib/utils/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;
  const locales = ['en', 'fr', 'de', 'es', 'tr'];

  // Fetch all public dictionaries with slugs
  const publicDicts = await db.query.dictionaries.findMany({
    where: eq(dictionaries.isPublic, true),
    columns: { slug: true, updatedAt: true },
  });

  const routes = [
    '',
    '/library',
    '/tiers',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/cookies',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // Basic routes — all locales
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  // Dynamic dictionaries — English only, using slug
  for (const dict of publicDicts) {
    if (dict.slug) {
      sitemapEntries.push({
        url: `${baseUrl}/en/library/${dict.slug}`,
        lastModified: dict.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return sitemapEntries;
}
