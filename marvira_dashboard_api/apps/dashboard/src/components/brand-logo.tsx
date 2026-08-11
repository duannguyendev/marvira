import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: { px: 32, className: 'h-8 w-8 rounded-lg' },
  md: { px: 36, className: 'h-9 w-9 rounded-xl shadow-sm' },
  lg: { px: 48, className: 'h-12 w-12 rounded-xl shadow-sm' },
} as const;

export function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  const { px, className: sizeClassName } = sizes[size];

  return (
    <Image
      src="/images/marvira-mark.png"
      alt="Marvira logo"
      width={px}
      height={px}
      priority={size === 'lg'}
      className={cn(sizeClassName, className)}
    />
  );
}
