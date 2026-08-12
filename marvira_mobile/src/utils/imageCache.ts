import FastImage from '@d11/react-native-fast-image';

/** Decoded / in-RAM budget for list scrolling. */
export const IMAGE_CACHE_MEMORY_BYTES = 50 * 1024 * 1024;

/** On-device file cache for revisit without network. */
export const IMAGE_CACHE_DISK_BYTES = 75 * 1024 * 1024;

/** Drop unused disk entries after this age (iOS SDWebImage). Android is size-LRU. */
export const IMAGE_CACHE_DISK_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

export function isRemoteHttpUri(uri: string): boolean {
  return /^https?:\/\//i.test(uri.trim());
}

/**
 * Percent-encode path segments for URLSession / SDWebImage / Glide (FastImage).
 * Unencoded commas, parentheses, etc. in object keys fail on both iOS and Android.
 */
export function encodeRemoteImageUri(uri: string): string {
  const trimmed = uri.trim();
  if (!isRemoteHttpUri(trimmed) && !trimmed.startsWith('/')) {
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
      // keep raw
    }
    return encodeURIComponent(decoded).replace(
      /[!'()*]/g,
      char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  };

  if (isRemoteHttpUri(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const path = parsed.pathname.split('/').map(encodeSegment).join('/');
      return `${parsed.origin}${path}${parsed.search}${parsed.hash}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed.split('/').map(encodeSegment).join('/');
}

export function clearImageMemoryCache(): Promise<void> {
  return FastImage.clearMemoryCache();
}

export function clearImageDiskCache(): Promise<void> {
  return FastImage.clearDiskCache();
}
