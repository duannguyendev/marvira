import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { loadMarketingContent } from '@/lib/content-loader';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Find a hunt, walk to places, answer challenges, climb the leaderboard.',
};

export default async function HowItWorksPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  return (
    <PageShell content={content} locale={locale}>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="animate-fade-up font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {content.how.title}
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-2xl text-lg text-ink/70">
          {content.how.intro}
        </p>

        <ol className="mt-14 grid gap-10 md:grid-cols-2">
          {content.how.steps.map((step, index) => (
            <li
              key={step.title}
              className="animate-fade-up"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <span className="font-display text-sm font-bold tracking-widest text-canopy">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink">{step.title}</h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink/70">{step.body}</p>
              <div
                className="mt-6 h-px w-24 bg-gradient-to-r from-canopy to-transparent"
                aria-hidden
              />
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
