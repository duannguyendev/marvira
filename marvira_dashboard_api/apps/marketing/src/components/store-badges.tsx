import { SITE, STORE_READY } from '@/lib/site';
import type { ContentPack } from '@/lib/i18n';

function QrPlaceholder({ label, target }: { label: string; target: string }) {
  const cells = Array.from({ length: 81 }, (_, i) => {
    const seed = (i * 17 + target.length * 3) % 7;
    return seed < 3;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid grid-cols-9 gap-0.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-ink/10"
        aria-hidden>
        {cells.map((on, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-[1px] ${on ? 'bg-ink' : 'bg-transparent'}`}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-ink/65">{label}</p>
    </div>
  );
}

export function StoreBadges({ content }: { content: ContentPack }) {
  const appTarget = SITE.appStoreUrl || `${SITE.url}/download`;
  const playTarget = SITE.playStoreUrl || `${SITE.url}/download`;
  const qrLabel = STORE_READY
    ? content.download.qrLabel
    : content.download.qrLabelSoon;

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="flex flex-col items-start gap-4">
        {STORE_READY ? (
          <a
            href={SITE.appStoreUrl}
            className="inline-flex rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-mist transition hover:bg-forest"
            rel="noopener noreferrer"
            target="_blank">
            {content.home.ctaAppStore}
          </a>
        ) : (
          <span className="inline-flex rounded-xl bg-ink/50 px-5 py-3 text-sm font-semibold text-mist">
            {content.home.ctaAppStore} · {content.home.ctaComingSoon}
          </span>
        )}
        {STORE_READY ? (
          <QrPlaceholder
            label={`${qrLabel} · iOS`}
            target={appTarget}
          />
        ) : (
          <p className="text-xs font-medium text-ink/55">{qrLabel} · iOS</p>
        )}
      </div>
      <div className="flex flex-col items-start gap-4">
        {STORE_READY ? (
          <a
            href={SITE.playStoreUrl}
            className="inline-flex rounded-xl border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-forest/40"
            rel="noopener noreferrer"
            target="_blank">
            {content.home.ctaPlayStore}
          </a>
        ) : (
          <span className="inline-flex rounded-xl border border-ink/15 bg-white/70 px-5 py-3 text-sm font-semibold text-ink/70">
            {content.home.ctaPlayStore} · {content.home.ctaComingSoon}
          </span>
        )}
        {STORE_READY ? (
          <QrPlaceholder
            label={`${qrLabel} · Android`}
            target={playTarget}
          />
        ) : (
          <p className="text-xs font-medium text-ink/55">
            {qrLabel} · Android
          </p>
        )}
      </div>
    </div>
  );
}
