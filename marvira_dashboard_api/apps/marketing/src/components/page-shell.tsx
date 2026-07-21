import { Suspense, type ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import type { ContentPack } from '@/lib/i18n';
import type { Locale } from '@/lib/site';

export function PageShell({
  content,
  locale,
  children,
}: {
  content: ContentPack;
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<div className="h-[72px]" />}>
        <SiteHeader content={content} />
      </Suspense>
      <main className="flex-1">{children}</main>
      <SiteFooter content={content} locale={locale} />
    </div>
  );
}
