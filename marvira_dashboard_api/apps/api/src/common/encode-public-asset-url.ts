/**
 * Percent-encode URL path segments so React Native FastImage (Glide / SDWebImage)
 * can load CDN object keys that contain commas, parentheses, spaces, etc.
 */
export function encodePublicAssetUrl(
  url: string | null | undefined,
): string | null | undefined {
  if (url == null) {
    return url;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  const encodeSegment = (segment: string): string => {
    if (!segment) {
      return segment;
    }
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      // keep raw segment
    }
    return encodeURIComponent(decoded).replace(
      /[!'()*]/g,
      char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const path = parsed.pathname.split('/').map(encodeSegment).join('/');
      return `${parsed.origin}${path}${parsed.search}${parsed.hash}`;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed.split('/').map(encodeSegment).join('/');
  }

  return trimmed;
}
