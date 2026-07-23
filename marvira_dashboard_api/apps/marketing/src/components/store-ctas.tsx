import Link from 'next/link';
import { SITE, STORE_READY } from '@/lib/site';
import type { ContentPack } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export function StoreCtas({
  content,
  className,
  light = false,
}: {
  content: ContentPack;
  className?: string;
  light?: boolean;
}) {
  const primary = light
    ? 'bg-sun text-ink hover:brightness-105'
    : 'bg-ink text-mist hover:bg-forest';
  const secondary = light
    ? 'border border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
    : 'border border-ink/15 bg-white text-ink hover:border-forest/40';

  if (!STORE_READY) {
    return (
      <div className={cn('flex flex-wrap gap-3', className)}>
        <Link
          href="/download"
          className={cn(
            'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition',
            primary,
          )}>
          {content.home.ctaDownload}
        </Link>
        <Link
          href="/how-it-works"
          className={cn(
            'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition',
            secondary,
          )}>
          {content.home.ctaHow}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <a
        href={SITE.appStoreUrl}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition',
          primary,
        )}
        rel="noopener noreferrer"
        target="_blank">
        {content.home.ctaAppStore}
      </a>
      <a
        href={SITE.playStoreUrl}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition',
          secondary,
        )}
        rel="noopener noreferrer"
        target="_blank">
        {content.home.ctaPlayStore}
      </a>
    </div>
  );
}
