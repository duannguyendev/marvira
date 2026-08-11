'use client';

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react';
import { ARTICLE_PLACEHOLDER_IMAGE } from '@/lib/articles';

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  /** Shown when src is empty or fails to load. */
  fallbackSrc?: string;
};

/**
 * <img> that falls back to a placeholder when the URL is missing or load fails.
 * Keeps overlay text readable on explore cards / heroes.
 */
export function SafeImage({
  src,
  fallbackSrc = ARTICLE_PLACEHOLDER_IMAGE,
  alt = '',
  onError,
  ...rest
}: SafeImageProps) {
  const resolved = (src?.trim() || fallbackSrc).trim();
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc((src?.trim() || fallbackSrc).trim());
  }, [src, fallbackSrc]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={currentSrc} alt={alt} onError={handleError} {...rest} />
  );
}
