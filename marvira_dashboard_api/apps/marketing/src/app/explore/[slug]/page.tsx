import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { Markdown } from '@/components/markdown';
import { loadMarketingContent, withLang } from '@/lib/content-loader';
import { fetchArticleBySlug, resolveArticleImage, ARTICLE_PLACEHOLDER_IMAGE } from '@/lib/articles';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug).catch(() => null);
  if (!article) {
    return { title: 'Hunt' };
  }
  const image = resolveArticleImage(article.coverImage) || `${SITE.url}${ARTICLE_PLACEHOLDER_IMAGE}`;
  const description = article.excerpt;
  return {
    title: article.title,
    description,
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default async function ExploreArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  const article = await fetchArticleBySlug(slug).catch(() => null);
  if (!article) {
    notFound();
  }

  const coverImage = resolveArticleImage(article.coverImage) || ARTICLE_PLACEHOLDER_IMAGE;
  const place = article.city ? `${article.placeName} · ${article.city}` : article.placeName;
  const appDeepLink = article.event ? `${SITE.deepLinkScheme}://e/${article.event.id}` : null;

  return (
    <PageShell content={content} locale={locale}>
      <article>
        <div className="relative min-h-[52vh] overflow-hidden bg-ink">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />
          <div className="relative z-10 mx-auto flex min-h-[52vh] max-w-4xl flex-col justify-end px-5 pb-12 pt-28 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-sun">{place}</p>
            <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">{article.excerpt}</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-5 py-14 md:px-8">
          <Link
            href={withLang('/explore', locale)}
            className="text-sm font-semibold text-forest underline decoration-sun decoration-2 underline-offset-4"
          >
            ← {content.explore.backToExplore}
          </Link>

          <div className="mt-8">
            <Markdown>{article.body}</Markdown>
          </div>

          {appDeepLink && (
            <div className="mt-12 rounded-3xl bg-forest px-6 py-8 text-mist">
              <p className="font-display text-2xl font-bold">{article.event?.title}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={appDeepLink}
                  className="inline-flex justify-center rounded-full bg-sun px-5 py-3 text-sm font-semibold text-ink"
                >
                  {content.explore.playCta}
                </a>
                <Link
                  href={withLang('/download', locale)}
                  className="inline-flex justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white"
                >
                  {content.event.downloadCta}
                </Link>
              </div>
            </div>
          )}

          {(article.prev || article.next) && (
            <nav
              className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:justify-between"
              aria-label="Article navigation"
            >
              {article.prev ? (
                <Link
                  href={withLang(`/explore/${article.prev.slug}`, locale)}
                  rel="prev"
                  className="group flex-1"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                    ← {content.explore.prevArticle}
                  </span>
                  <span className="mt-1 block font-display text-lg font-bold text-ink transition group-hover:text-forest">
                    {article.prev.title}
                  </span>
                </Link>
              ) : (
                <span className="flex-1" />
              )}
              {article.next ? (
                <Link
                  href={withLang(`/explore/${article.next.slug}`, locale)}
                  rel="next"
                  className="group flex-1 sm:text-right"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                    {content.explore.nextArticle} →
                  </span>
                  <span className="mt-1 block font-display text-lg font-bold text-ink transition group-hover:text-forest">
                    {article.next.title}
                  </span>
                </Link>
              ) : (
                <span className="flex-1" />
              )}
            </nav>
          )}
        </div>
      </article>
    </PageShell>
  );
}
