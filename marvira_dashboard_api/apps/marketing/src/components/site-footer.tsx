import Image from 'next/image';
import Link from 'next/link';
import type { ContentPack } from '@/lib/i18n';
import type { Locale } from '@/lib/site';

export function SiteFooter({
  content,
  locale = 'en',
}: {
  content: ContentPack;
  locale?: Locale;
}) {
  const q = locale === 'vi' ? '?lang=vi' : '';

  return (
    <footer className="border-t border-forest/10 bg-ink text-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/marvira-mark.png"
              alt=""
              aria-hidden
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl"
            />
            <p className="font-display text-2xl font-bold tracking-tight">{content.footer.brand}</p>
          </div>
          <p className="mt-2 max-w-sm text-sm text-mist/75">{content.footer.line}</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-mist/80">
          <Link href={`/privacy${q}`} className="hover:text-white">
            {content.footer.privacy}
          </Link>
          <Link href={`/terms${q}`} className="hover:text-white">
            {content.footer.terms}
          </Link>
          <Link href={`/support${q}`} className="hover:text-white">
            {content.footer.support}
          </Link>
          <Link href={`/press${q}`} className="hover:text-white">
            {content.nav.press}
          </Link>
        </div>
      </div>
    </footer>
  );
}
