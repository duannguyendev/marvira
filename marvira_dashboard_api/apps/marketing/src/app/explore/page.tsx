import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { ExploreSearch } from '@/components/explore-search';
import { loadMarketingContent, withLang } from '@/lib/content-loader';
import {
  fetchArticles,
  resolveArticleImage,
  ARTICLE_PLACEHOLDER_IMAGE,
  type PublicArticle,
} from '@/lib/articles';

export const metadata: Metadata = {
  title: 'Explore city hunts',
  description: 'Discover scavenger hunts published by Marvira organizers near you.',
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; search?: string; page?: string }>;
}) {
  const { lang, search, page: pageParam } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  let articles: PublicArticle[] = [];
  let totalPages = 1;
  let loadError = false;
  try {
    const result = await fetchArticles({ search, page: currentPage, pageSize: PAGE_SIZE });
    articles = result.items;
    totalPages = result.totalPages;
  } catch {
    loadError = true;
  }

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search?.trim()) params.set('search', search.trim());
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return withLang(`/explore${qs ? `?${qs}` : ''}`, locale);
  };

  const pageItems: (number | 'gap')[] = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
      pageItems.push(p);
    } else if (pageItems[pageItems.length - 1] !== 'gap') {
      pageItems.push('gap');
    }
  }

  return (
    <PageShell content={content} locale={locale}>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight md:text-5xl">
          {content.explore.title}
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-2xl text-lg text-ink/70">
          {content.explore.intro}
        </p>

        <ExploreSearch placeholder={content.explore.searchPlaceholder} />

        {loadError ? (
          <p className="mt-14 text-base text-ink/60">{content.explore.loadError}</p>
        ) : articles.length === 0 ? (
          <p className="mt-14 text-base text-ink/60">
            {search ? content.explore.noResults : content.explore.empty}
          </p>
        ) : (
          <>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            {articles.map((article, index) => (
              <article key={article.id} className="group">
                <Link href={withLang(`/explore/${article.slug}`, locale)} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-none bg-ink/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArticleImage(article.coverImage) || ARTICLE_PLACEHOLDER_IMAGE}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5 text-white">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sun">
                        {article.city ? `${article.placeName} · ${article.city}` : article.placeName}
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold">{article.title}</h2>
                    </div>
                  </div>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-ink/70">{article.excerpt}</p>
                <Link
                  href={withLang(`/explore/${article.slug}`, locale)}
                  className="mt-4 inline-flex text-sm font-semibold text-forest underline decoration-sun decoration-2 underline-offset-4"
                >
                  {content.explore.readMore}
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-16 flex flex-col items-center gap-4" aria-label="Pagination">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {currentPage > 1 && (
                  <Link
                    href={buildHref(currentPage - 1)}
                    rel="prev"
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-forest hover:text-forest"
                  >
                    {content.explore.pagination.previous}
                  </Link>
                )}
                {pageItems.map((item, i) =>
                  item === 'gap' ? (
                    <span key={`gap-${i}`} className="px-2 text-ink/40">
                      …
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={buildHref(item)}
                      aria-current={item === currentPage ? 'page' : undefined}
                      className={
                        item === currentPage
                          ? 'min-w-[2.5rem] rounded-full bg-forest px-4 py-2 text-center text-sm font-semibold text-white'
                          : 'min-w-[2.5rem] rounded-full border border-ink/15 px-4 py-2 text-center text-sm font-medium text-ink transition hover:border-forest hover:text-forest'
                      }
                    >
                      {item}
                    </Link>
                  ),
                )}
                {currentPage < totalPages && (
                  <Link
                    href={buildHref(currentPage + 1)}
                    rel="next"
                    className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink transition hover:border-forest hover:text-forest"
                  >
                    {content.explore.pagination.next}
                  </Link>
                )}
              </div>
              <p className="text-sm text-ink/50">
                {content.explore.pagination.pageOf
                  .replace('{current}', String(currentPage))
                  .replace('{total}', String(totalPages))}
              </p>
            </nav>
          )}
          </>
        )}
      </section>
    </PageShell>
  );
}
