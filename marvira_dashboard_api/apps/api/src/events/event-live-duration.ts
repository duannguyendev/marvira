/** Code fallback when the DB row is missing (should be rare after migration/seed). */
export const DEFAULT_EVENT_LIVE_DURATION_DAYS = 2;

export const APP_SETTING_EVENT_LIVE_DURATION_DAYS =
  'event_live_duration_days';

export function parseEventLiveDurationDays(
  raw: string | null | undefined,
): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_EVENT_LIVE_DURATION_DAYS;
}

export function computeEndsAtFromDays(
  days: number,
  from: Date = new Date(),
): Date {
  const safeDays =
    Number.isFinite(days) && days > 0
      ? days
      : DEFAULT_EVENT_LIVE_DURATION_DAYS;
  const ms = safeDays * 24 * 60 * 60 * 1000;
  return new Date(from.getTime() + ms);
}

export function scheduledEndJobId(eventId: string) {
  // BullMQ custom jobId cannot contain ':'
  return `event-end-${eventId}`;
}
