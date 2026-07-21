import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { StoreBadges } from '@/components/store-badges';
import { loadMarketingContent } from '@/lib/content-loader';
import { STORE_READY } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Download',
  description: 'Get Marvira on the App Store or Google Play and start exploring.',
};

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  return (
    <PageShell content={content} locale={locale}>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight md:text-5xl">
          {content.download.title}
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-2xl text-lg text-ink/70">
          {content.download.intro}
        </p>

        <div className="animate-fade-up-late mt-12">
          <StoreBadges content={content} />
        </div>

        {!STORE_READY && (
          <p className="mt-10 max-w-xl rounded-2xl bg-sun/15 px-5 py-4 text-sm leading-relaxed text-ink/80">
            {content.download.storesSoon}
          </p>
        )}

        <p className="mt-8 max-w-xl text-sm text-ink/60">{content.download.deepLinkNote}</p>
      </section>
    </PageShell>
  );
}
