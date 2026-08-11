'use client';

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react';
import { cn } from '@/lib/utils';

type SafeImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  /** Classes for the muted placeholder box when image is missing/fails. */
  placeholderClassName?: string;
};

/**
 * Dashboard thumbnail/preview: shows muted placeholder if src is empty or load fails.
 */
export function SafeImg({
  src,
  alt = '',
  className,
  placeholderClassName,
  onError,
  ...rest
}: SafeImgProps) {
  const [failed, setFailed] = useState(false);
  const resolved = src?.trim() ?? '';

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const showPlaceholder = !resolved || failed;

  if (showPlaceholder) {
    return (
      <div
        className={cn('bg-muted', placeholderClassName ?? className)}
        aria-hidden
      />
    );
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setFailed(true);
    onError?.(event);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
