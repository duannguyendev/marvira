const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Brand placeholder shown when an article has no cover image. */
export const ARTICLE_PLACEHOLDER_IMAGE = '/images/article-placeholder.png';

export interface ArticleLink {
  slug: string;
  title: string;
}

export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  placeName: string;
  city: string | null;
  excerpt: string;
  body: string;
  coverImage: string | null;
  publishedAt: string | null;
  event?: { id: string; title: string; city: string } | null;
  prev?: ArticleLink | null;
  next?: ArticleLink | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

/**
 * Resolve an article cover image to a browser-loadable URL.
 * Absolute URLs (S3/CDN) pass through; relative /uploads paths are served by the API host.
 */
export function resolveArticleImage(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');
  const base = cdnBase || API_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function fetchArticles(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<PublicArticle>> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set('search', params.search.trim());
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_URL}/articles?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load articles');
  const json = (await res.json()) as Envelope<Paginated<PublicArticle>>;
  return json.data;
}

export async function fetchArticleBySlug(
  slug: string,
): Promise<PublicArticle | null> {
  const res = await fetch(`${API_URL}/articles/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load article');
  const json = (await res.json()) as Envelope<PublicArticle>;
  return json.data;
}
