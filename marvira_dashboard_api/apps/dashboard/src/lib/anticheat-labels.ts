export const ANTICHEAT_CODE_LABELS: Record<string, string> = {
  SUSPICIOUS_MOVEMENT:
    'Moving too fast between GPS updates (possible location spoofing)',
  IMPOSSIBLE_TRAVEL:
    'Reached the next place faster than physically possible',
  STALE_LOCATION: 'GPS timestamp is outdated or delayed',
  POOR_ACCURACY: 'GPS accuracy is too poor (large uncertainty radius)',
};

export function anticheatCodeLabel(code: string | null | undefined): string {
  if (!code) return 'Unknown reason';
  return ANTICHEAT_CODE_LABELS[code] ?? code;
}

export function formatWarningPayloadDetail(
  payload: Record<string, unknown> | null | undefined,
): string[] {
  if (!payload) return [];

  const details: string[] = [];
  const accuracy = payload.accuracy;
  if (typeof accuracy === 'number') {
    details.push(`GPS accuracy: ${Math.round(accuracy)} m`);
  }

  const timestamp = payload.timestamp;
  if (typeof timestamp === 'number') {
    const ageSec = Math.abs(Date.now() - timestamp) / 1000;
    details.push(`GPS age at check: ${Math.round(ageSec)} s`);
  }

  const triggered = payload.triggeredCodes;
  if (Array.isArray(triggered) && triggered.length > 1) {
    details.push(
      `Also flagged: ${(triggered as string[])
        .slice(1)
        .map(c => anticheatCodeLabel(c))
        .join('; ')}`,
    );
  }

  return details;
}
