import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { FeedbackForm } from '@/components/feedback-form';
import { loadMarketingContent } from '@/lib/content-loader';

export const metadata: Metadata = {
  title: 'Support & FAQ',
  description: 'Help for players and organizers using Marvira.',
};

export default async function SupportPage({
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
          {content.support.title}
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-2xl text-lg text-ink/70">
          {content.support.intro}
        </p>

        <div className="mt-12 max-w-3xl space-y-6">
          {content.support.faqs.map(item => (
            <details
              key={item.q}
              className="group border-b border-forest/10 pb-5 open:pb-5">
              <summary className="cursor-pointer list-none font-display text-lg font-semibold text-ink marker:content-none">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span className="text-canopy transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-16 max-w-2xl">
          <FeedbackForm content={content.support.form} />
        </div>
      </section>
    </PageShell>
  );
}
