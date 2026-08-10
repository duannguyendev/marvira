import type { MetadataRoute } from 'next';
import { fetchArticles } from '@/lib/articles';
import { SITE } from '@/lib/site';

/** Static marketing routes that should appear in Google Search. */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}[] = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/create', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/explore', changeFrequency: 'daily', priority: 0.9 },
  { path: '/press', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(route => ({
    url: `${SITE.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const { items } = await fetchArticles({ page: 1, pageSize: 200 });
    articleEntries = items.map(article => ({
      url: `${SITE.url}/explore/${article.slug}`,
      lastModified: article.publishedAt
        ? new Date(article.publishedAt)
        : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // API unavailable at build/request time — keep static routes only.
  }

  return [...staticEntries, ...articleEntries];
}
