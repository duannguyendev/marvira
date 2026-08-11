'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { IMAGES } from '@/lib/site';

type SafeNextCoverProps = {
  src: string;
  alt: string;
  unoptimized?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fallbackSrc?: string;
};

/** next/image cover with load-error fallback (invite / hero surfaces). */
export function SafeNextCover({
  src,
  alt,
  unoptimized,
  className,
  priority,
  sizes = '100vw',
  fallbackSrc = IMAGES.ogDefault,
}: SafeNextCoverProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      priority={priority}
      unoptimized={unoptimized}
      className={className}
      sizes={sizes}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
