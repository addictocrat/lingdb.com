import { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/utils/constants';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/en', '/fr', '/de', '/es', '/tr',
          '/en/library',
          '/en/library/*',
          '/*/tiers',
          '/*/privacy',
          '/*/terms',
          '/*/cookies',
        ],
        disallow: [
          '/*/dashboard',
          '/*/profile',
          '/*/dictionary', // Authenticated edit view
          '/*/payment',
          '/api/*',
          '/fr/library/*',
          '/de/library/*',
          '/es/library/*',
          '/tr/library/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
