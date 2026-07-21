'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/cn';
import type { ContentPack } from '@/lib/i18n';

const links = [
  { href: '/how-it-works', key: 'how' as const },
  { href: '/explore', key: 'explore' as const },
  { href: '/create', key: 'create' as const },
  { href: '/download', key: 'download' as const },
];

export function SiteHeader({ content }: { content: ContentPack }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get('lang') === 'vi' ? 'vi' : 'en';

  function setLocale(next: 'en' | 'vi') {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'en') params.delete('lang');
    else params.set('lang', 'vi');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-mist shadow-[0_1px_0_rgba(30,41,59,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link
          href={locale === 'vi' ? '/?lang=vi' : '/'}
          className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-forest md:text-[1.75rem]"
        >
          <Image
            src="/images/marvira-mark.png"
            alt={`${SITE.name} logo`}
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-xl shadow-sm"
          />
          {SITE.name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={locale === 'vi' ? `${item.href}?lang=vi` : item.href}
              className={cn(
                'text-sm font-medium text-ink/70 transition hover:text-forest',
                pathname === item.href &&
                  'text-forest underline decoration-sun decoration-2 underline-offset-8',
              )}
            >
              {content.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-ink/5 p-0.5 text-xs font-semibold text-ink backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={cn(
                'rounded-full px-2.5 py-1 transition',
                locale === 'en'
                  ? 'bg-forest text-white'
                  : 'opacity-80 hover:opacity-100',
              )}
              aria-label="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale('vi')}
              className={cn(
                'rounded-full px-2.5 py-1 transition',
                locale === 'vi'
                  ? 'bg-forest text-white'
                  : 'opacity-80 hover:opacity-100',
              )}
              aria-label="Tiếng Việt"
            >
              VI
            </button>
          </div>
          <Link
            href={locale === 'vi' ? '/download?lang=vi' : '/download'}
            className="rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:brightness-105"
          >
            {content.nav.download}
          </Link>
        </div>
      </div>
    </header>
  );
}
