'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  function setLocale(next: 'en' | 'vi') {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'en') params.delete('lang');
    else params.set('lang', 'vi');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function localeHref(href: string) {
    return locale === 'vi' ? `${href}?lang=vi` : href;
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-mist shadow-[0_1px_0_rgba(30,41,59,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 md:px-8">
        <Link
          href={localeHref('/')}
          className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-forest md:text-[1.75rem]">
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

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map(item => (
            <Link
              key={item.href}
              href={localeHref(item.href)}
              className={cn(
                'text-sm font-medium text-ink/70 transition hover:text-forest',
                pathname === item.href &&
                  'text-forest underline decoration-sun decoration-2 underline-offset-8',
              )}>
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
              aria-label="English">
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
              aria-label="Tiếng Việt">
              VI
            </button>
          </div>
          <Link
            href={localeHref('/download')}
            className="hidden rounded-full bg-sun px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:brightness-105 sm:inline-flex">
            {content.nav.download}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-ink/5 md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(open => !open)}>
            <span className="relative block h-4 w-5" aria-hidden>
              <span
                className={cn(
                  'absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition',
                  menuOpen && 'top-1.5 rotate-45',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition',
                  menuOpen && 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition',
                  menuOpen && 'top-1.5 -rotate-45',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id={menuId}
        hidden={!menuOpen}
        className="border-t border-forest/10 bg-mist md:hidden">
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4"
          aria-label="Mobile">
          {links.map(item => (
            <Link
              key={item.href}
              href={localeHref(item.href)}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'rounded-xl px-3 py-3 text-base font-medium text-ink/80 transition hover:bg-forest/5 hover:text-forest',
                pathname === item.href && 'bg-forest/5 text-forest',
              )}>
              {content.nav[item.key]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
