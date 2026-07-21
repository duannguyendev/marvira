/**
 * Resolve upload paths to a browser-loadable URL.
 * Uses CDN base when set (production S3/CloudFront); otherwise relative /uploads rewrite.
 */
export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;

  const normalized = url.startsWith('/') ? url : `/${url}`;
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, '');
  if (cdnBase) {
    return `${cdnBase}${normalized}`;
  }

  return normalized;
}
