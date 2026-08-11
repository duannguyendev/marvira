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

export function clearImageMemoryCache(): Promise<void> {
  return FastImage.clearMemoryCache();
}

export function clearImageDiskCache(): Promise<void> {
  return FastImage.clearDiskCache();
}
