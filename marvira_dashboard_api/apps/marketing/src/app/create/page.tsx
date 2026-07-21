import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { loadMarketingContent, withLang } from '@/lib/content-loader';

export const metadata: Metadata = {
  title: 'Create a scavenger hunt',
  description:
    'Design GPS hunts for events, tourism, venues, and schools. Download Marvira to create.',
};

export default async function CreatePage({
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
          {content.create.title}
        </h1>
        <p className="animate-fade-up-delay mt-4 max-w-2xl text-lg text-ink/70">
          {content.create.intro}
        </p>

        <ul className="mt-14 grid gap-10 md:grid-cols-3">
          {content.create.props.map((item) => (
            <li key={item.title}>
              <h2 className="font-display text-xl font-bold text-forest">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 max-w-xl rounded-3xl bg-forest px-6 py-8 text-mist">
          <p className="font-display text-xl font-bold">{content.create.ctaDownload}</p>
          <p className="mt-3 text-sm text-mist/80">{content.create.intro}</p>
          <Link
            href={withLang('/download', locale)}
            className="mt-6 inline-flex rounded-full bg-sun px-5 py-3 text-sm font-semibold text-ink"
          >
            {content.home.ctaDownload}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
