import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { SafeNextCover } from '@/components/safe-next-cover';
import { getInviteEvent } from '@/lib/events';
import { loadMarketingContent, withLang } from '@/lib/content-loader';
import { SITE, STORE_READY } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function coverNeedsUnoptimized(src: string): boolean {
  if (src.startsWith('/')) return false;
  try {
    const host = new URL(src).hostname;
    return host !== 'images.unsplash.com' && host !== 'localhost';
  } catch {
    return true;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getInviteEvent(id);
  if (!event) {
    return { title: 'Hunt invite', robots: { index: false, follow: false } };
  }
  return {
    title: event.shareTitle,
    description: event.shareDescription,
    /** Shareable invites: allow social OG fetch, keep out of Google index. */
    robots: { index: false, follow: true },
    openGraph: {
      title: event.shareTitle,
      description: event.shareDescription,
      images: [
        { url: event.coverImage, width: 1200, height: 630, alt: event.title },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.shareTitle,
      description: event.shareDescription,
      images: [event.coverImage],
    },
  };
}

export default async function EventInvitePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);
  const event = await getInviteEvent(id);

  if (!event) {
    notFound();
  }

  const appDeepLink = `${SITE.deepLinkScheme}://e/${event.id}`;
  const storeHref = STORE_READY
    ? SITE.appStoreUrl || SITE.playStoreUrl
    : withLang('/download', locale);
  const unoptimized = coverNeedsUnoptimized(event.coverImage);

  return (
    <PageShell content={content} locale={locale}>
      <article>
        <div className="relative min-h-[52vh] overflow-hidden bg-ink">
          <SafeNextCover
            src={event.coverImage}
            alt={event.title}
            priority
            unoptimized={unoptimized}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
          <div className="relative z-10 mx-auto flex min-h-[52vh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-sun">
              {event.city}
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {event.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              {event.shareDescription}
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_0.8fr] md:px-8">
          <div>
            <p className="text-base leading-relaxed text-ink/80">
              {event.longBody}
            </p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-canopy">
                  {content.event.when}
                </dt>
                <dd className="mt-2 text-sm text-ink/75">{event.when}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-canopy">
                  {content.event.where}
                </dt>
                <dd className="mt-2 text-sm text-ink/75">{event.where}</dd>
              </div>
            </dl>
            <div className="mt-10">
              <h2 className="font-display text-xl font-bold">
                {content.event.how}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                {STORE_READY
                  ? content.event.howBody
                  : content.event.howBodySoon}
              </p>
            </div>
            <p className="mt-8 text-sm text-ink/55">
              {content.event.leaderboardEmpty}
            </p>
          </div>

          <aside className="h-fit rounded-3xl bg-forest px-6 py-8 text-mist">
            <p className="font-display text-2xl font-bold">
              {content.event.joinCta}
            </p>
            <p className="mt-3 text-sm text-mist/75">
              {STORE_READY
                ? content.event.joinHint
                : content.event.joinHintSoon}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {STORE_READY ? (
                <a
                  href={appDeepLink}
                  className="inline-flex justify-center rounded-full bg-sun px-5 py-3 text-sm font-semibold text-ink">
                  {content.event.joinCta}
                </a>
              ) : null}
              <Link
                href={storeHref || withLang('/download', locale)}
                className="inline-flex justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white">
                {STORE_READY
                  ? content.event.downloadCta
                  : content.event.downloadCtaSoon}
              </Link>
            </div>
          </aside>
        </div>
      </article>
    </PageShell>
  );
}
