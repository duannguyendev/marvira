import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * Crawl policy:
 * - Allow marketing / SEO pages (/, how-it-works, download, create, explore, press, support, legal).
 * - Disallow auth utility pages (no SEO value; avoid indexing password flows).
 * - Do NOT disallow /e/* — invite OG previews (Facebook/WhatsApp) need crawl access;
 *   those pages use meta robots noindex instead.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/forgot-password',
          '/reset-password',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
