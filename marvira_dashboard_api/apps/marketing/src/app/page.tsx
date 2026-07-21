import type { Metadata } from 'next';
import Image from 'next/image';
import { PageShell } from '@/components/page-shell';
import { StoreCtas } from '@/components/store-ctas';
import { loadMarketingContent } from '@/lib/content-loader';
import { IMAGES, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'Marvira — City scavenger hunts on foot' },
  description:
    'Walk real places, answer challenges, and climb leaderboards. Marvira is a GPS scavenger-hunt app for players and organizers.',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  return (
    <PageShell content={content} locale={locale}>
      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src={IMAGES.hero}
          alt={content.home.heroAlt}
          fill
          priority
          className="object-cover animate-soft-pan"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/45 to-ink/25" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-10 md:px-8 md:pb-20">
          <p className="animate-fade-up font-display text-4xl font-extrabold tracking-tight text-white drop-shadow md:text-6xl lg:text-7xl">
            {SITE.name}
          </p>
          <h1 className="animate-fade-up-delay mt-4 max-w-2xl font-display text-2xl font-semibold leading-tight text-white/95 md:text-4xl">
            {content.home.headline}
          </h1>
          <p className="animate-fade-up-late mt-4 max-w-xl text-base text-white/85 md:text-lg">
            {content.home.support}
          </p>
          <div className="animate-fade-up-late mt-8">
            <StoreCtas content={content} light />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
