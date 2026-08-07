import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { loadMarketingContent } from '@/lib/content-loader';
import { LEGAL_DRAFT, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the Marvira app and website.',
};

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const { content, locale } = await loadMarketingContent(lang);

  return (
    <PageShell content={content} locale={locale}>
      <article className="prose-legal mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          {content.legal.termsTitle}
        </h1>
        <p className="mt-2 text-sm text-ink/55">{content.legal.updated}</p>
        {LEGAL_DRAFT && (
          <p className="mt-4 rounded-xl bg-sun/15 px-4 py-3 text-sm text-ink/80">
            {content.legal.counselNote}
          </p>
        )}

        <h2>1. Agreement</h2>
        <p>
          By using Marvira apps, APIs, or websites, you agree to these Terms. If
          you do not agree, do not use the service. Contact: {SITE.supportEmail}
          .
        </p>

        <h2>2. The service</h2>
        <p>
          Marvira is a location-based scavenger-hunt and city exploration
          platform. Features may include playing hunts, leaderboards, practice
          modes, creating events, and optional paid subscriptions (e.g. Marvira
          Plus). We may change or discontinue features with reasonable notice
          where required.
        </p>

        <h2>3. Accounts</h2>
        <ul>
          <li>
            You must provide accurate registration information and keep
            credentials secure.
          </li>
          <li>
            You may sign in with email/password or with Google, Apple, or
            Facebook. You are responsible for activity under your account,
            including activity through linked social login providers.
          </li>
          <li>
            We may suspend accounts that violate these Terms or harm other
            users.
          </li>
        </ul>

        <h2>4. Acceptable use</h2>
        <ul>
          <li>
            Do not cheat, spoof GPS, harass others, or reverse-engineer the
            service.
          </li>
          <li>
            Do not publish hunts that are illegal, unsafe, or infringe others’
            rights.
          </li>
          <li>
            Respect private property and local laws while playing outdoors.
          </li>
          <li>
            Do not scrape, overload, or attempt unauthorized access to systems.
          </li>
          <li>
            Do not create events, alternate accounts, or coordinated play solely
            to manipulate leaderboards or global rankings.
          </li>
        </ul>

        <h2>5. Scores & leaderboards</h2>
        <p>
          Marvira uses two separate scoring systems so event rewards stay fun
          without letting organizers mint global rank:
        </p>
        <ul>
          <li>
            <strong>Event score</strong> — based on place question points plus
            any completion reward points the organizer sets. This rank applies
            only within that hunt (including finish order and gift assignment).
          </li>
          <li>
            <strong>Global contribution</strong> — calculated by Marvira with a
            fixed formula (base credit, places completed, capped question
            credit, per-event and daily caps). Organizer reward points do{' '}
            <em>not</em> increase global rank.
          </li>
        </ul>
        <ul>
          <li>
            Completing a hunt you created does not add global contribution for
            that hunt.
          </li>
          <li>
            We may recalculate, withhold, or remove scores, adjust caps, and
            suspend accounts that abuse scoring or location integrity.
          </li>
        </ul>

        <h2>6. Organizer content</h2>
        <p>
          If you create hunts, you retain rights to your content but grant
          Marvira a license to host, display, and distribute it to operate the
          service. You represent you have rights to any media or questions you
          upload. Reward points you set affect that hunt’s event leaderboard
          only — not the global leaderboard.
        </p>

        <h2>7. Subscriptions & purchases</h2>
        <p>
          Paid features are billed through Apple App Store or Google Play (or
          other processors we designate). Billing, renewals, and refunds follow
          the store’s policies. Free tiers may include advertising.
        </p>

        <h2>8. Safety outdoors</h2>
        <p>
          You play at your own risk. Stay aware of traffic, weather, and
          surroundings. Marvira does not guarantee the accuracy of maps, place
          pins, or third-party locations.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The service is provided “as is” without warranties of uninterrupted or
          error-free operation to the fullest extent permitted by law.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Marvira and its affiliates are
          not liable for indirect, incidental, or consequential damages, or for
          injuries occurring while you explore outdoors. Our aggregate liability
          for claims relating to the service is limited to the amounts you paid
          us in the twelve months before the claim (or zero if you paid
          nothing).
        </p>

        <h2>11. Termination</h2>
        <p>
          You may stop using Marvira at any time. We may terminate or restrict
          access for violations of these Terms or to protect the service.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms. Continued use after changes become
          effective constitutes acceptance of the updated Terms.
        </p>

        <h2>13. Contact</h2>
        <p>Questions about these Terms: {SITE.supportEmail}.</p>
      </article>
    </PageShell>
  );
}
