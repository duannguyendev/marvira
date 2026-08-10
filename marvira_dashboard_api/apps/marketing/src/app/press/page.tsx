import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { loadMarketingContent } from '@/lib/content-loader';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Báo chí & đối tác',
  description:
    'Marvira — giải mật thư ngoài trời cho thành phố, địa điểm, trường học và người tổ chức.',
};

export default async function PressPage({
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
          {content.press.title}
        </h1>
        <p className="animate-fade-up-delay mt-6 max-w-3xl text-lg leading-relaxed text-ink/75">
          {content.press.onePager}
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {content.press.audiences.map(item => (
            <div key={item.title}>
              <h2 className="font-display text-xl font-bold text-forest">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <blockquote className="mt-16 max-w-3xl border-l-4 border-sun pl-5 text-lg font-medium leading-relaxed text-ink">
          {content.press.boilerplate}
        </blockquote>

        <p className="mt-10 text-sm text-ink/55">
          Media & partnerships: {SITE.supportEmail}
        </p>
        <p className="mt-6">
          <a
            href="/press/marvira-one-pager.pdf"
            download
            className="inline-flex items-center font-medium text-forest underline decoration-sun/60 underline-offset-4 transition hover:text-canopy"
          >
            {content.press.downloadPdf}
          </a>
        </p>
      </section>
    </PageShell>
  );
}
