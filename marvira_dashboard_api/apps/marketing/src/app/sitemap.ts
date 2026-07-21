import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/how-it-works',
    '/download',
    '/create',
    '/explore',
    '/press',
    '/support',
    '/privacy',
    '/terms',
    '/explore/discover-downtown-san-francisco',
    '/explore/golden-gate-adventure',
    '/e/seed-event-downtown',
    '/e/seed-event-golden-gate',
  ];

  return routes.map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date('2026-07-20'),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/e/') ? 0.7 : 0.8,
  }));
}
