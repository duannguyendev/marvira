import type { Metadata } from 'next';
import { PageShell } from '@/components/page-shell';
import { loadMarketingContent } from '@/lib/content-loader';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Marvira collects, uses, and protects your information.',
};

export default async function PrivacyPage({
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
          {content.legal.privacyTitle}
        </h1>
        <p className="mt-2 text-sm text-ink/55">{content.legal.updated}</p>
        <p className="mt-4 rounded-xl bg-sun/15 px-4 py-3 text-sm text-ink/80">
          {content.legal.counselNote}
        </p>

        <h2>1. Who we are</h2>
        <p>
          Marvira (“we”, “us”) provides a GPS scavenger-hunt and city
          exploration app, related websites (including this marketing site), and
          organizer tools. Contact: {SITE.supportEmail}.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li>
            Account data: name, email, authentication identifiers (including
            OAuth).
          </li>
          <li>
            Location data: device GPS while you play, to check in at hunt places
            and prevent cheating. Location is essential to core gameplay.
          </li>
          <li>
            Gameplay data: event participation, answers, scores, leaderboard
            rankings.
          </li>
          <li>
            Device and usage data: app version, crash logs, approximate
            diagnostics.
          </li>
          <li>
            Organizer content: event titles, descriptions, places, and media you
            upload when creating hunts.
          </li>
        </ul>

        <h2>3. How we use information</h2>
        <ul>
          <li>
            Operate hunts, leaderboards, practice modes, and creator tools.
          </li>
          <li>
            Authenticate users, secure accounts, and detect abuse or cheating.
          </li>
          <li>Improve product performance and fix bugs.</li>
          <li>
            Send service messages; send marketing only with consent where
            required.
          </li>
          <li>Comply with law and store review requirements.</li>
        </ul>

        <h2>4. Sharing</h2>
        <p>
          We do not sell personal information. We may share data with
          infrastructure providers (hosting, analytics, email,
          payments/subscriptions, ad partners if you use a free ad- supported
          experience), and when required by law. Public leaderboards may show
          display names and scores for events you join. Public invite pages
          never expose answers, exact GPS spoilers, or private participant
          lists.
        </p>

        <h2>5. Retention & security</h2>
        <p>
          We retain data as long as your account is active and as needed for
          legitimate business or legal purposes. We use industry-standard
          safeguards; no method of transmission is 100% secure.
        </p>

        <h2>6. Your choices</h2>
        <ul>
          <li>Update profile data in the app.</li>
          <li>
            Revoke location permission in device settings (gameplay may stop
            working).
          </li>
          <li>
            Request access, correction, or deletion by emailing{' '}
            {SITE.supportEmail}.
          </li>
          <li>
            Unsubscribe from marketing emails via the link in those messages.
          </li>
        </ul>

        <h2>7. Children</h2>
        <p>
          Marvira is not directed to children under 13 (or the minimum age in
          your country). We do not knowingly collect data from children under
          that age.
        </p>

        <h2>8. International transfers</h2>
        <p>
          If you use Marvira from outside the country where servers are located,
          your data may be processed in other regions with appropriate
          safeguards.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update this policy. Material changes will be posted on this
          page with a new “Last updated” date.
        </p>
      </article>
    </PageShell>
  );
}
