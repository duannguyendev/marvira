export const ANTICHEAT_WARNING_MESSAGE =
  'We detected unusual location activity on your account. Please play fairly. Repeated issues may lead to account review.';

export const ANTICHEAT_CODES = {
  SUSPICIOUS_MOVEMENT: 'SUSPICIOUS_MOVEMENT',
  IMPOSSIBLE_TRAVEL: 'IMPOSSIBLE_TRAVEL',
  STALE_LOCATION: 'STALE_LOCATION',
  POOR_ACCURACY: 'POOR_ACCURACY',
} as const;

export type AnticheatCode = (typeof ANTICHEAT_CODES)[keyof typeof ANTICHEAT_CODES];

export const ANTICHEAT_DEFAULTS = {
  maxSpeedMps: 50,
  maxTravelSpeedMps: 35,
  minTravelFloorSec: 30,
  minHopDistanceM: 200,
  maxAccuracyM: 50,
  maxTimestampAgeSec: 30,
  warningCooldownSec: 900,
  autoResetCleanDays: 90,
  locationRedisTtlSec: 300,
};

function envNum(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function getAnticheatConfig() {
  return {
    maxSpeedMps: envNum('ANTICHEAT_MAX_SPEED_MPS', ANTICHEAT_DEFAULTS.maxSpeedMps),
    maxTravelSpeedMps: envNum('ANTICHEAT_MAX_TRAVEL_SPEED_MPS', ANTICHEAT_DEFAULTS.maxTravelSpeedMps),
    minTravelFloorSec: envNum('ANTICHEAT_MIN_TRAVEL_FLOOR_SEC', ANTICHEAT_DEFAULTS.minTravelFloorSec),
    minHopDistanceM: envNum('ANTICHEAT_MIN_HOP_DISTANCE_M', ANTICHEAT_DEFAULTS.minHopDistanceM),
    maxAccuracyM: envNum('ANTICHEAT_MAX_ACCURACY_M', ANTICHEAT_DEFAULTS.maxAccuracyM),
    maxTimestampAgeSec: envNum('ANTICHEAT_MAX_TIMESTAMP_AGE_SEC', ANTICHEAT_DEFAULTS.maxTimestampAgeSec),
    warningCooldownSec: envNum('ANTICHEAT_WARNING_COOLDOWN_SEC', ANTICHEAT_DEFAULTS.warningCooldownSec),
    autoResetCleanDays: envNum('ANTICHEAT_AUTO_RESET_CLEAN_DAYS', ANTICHEAT_DEFAULTS.autoResetCleanDays),
    locationRedisTtlSec: envNum('ANTICHEAT_LOCATION_REDIS_TTL_SEC', ANTICHEAT_DEFAULTS.locationRedisTtlSec),
    disabled:
      process.env.NODE_ENV === 'test' || process.env.DISABLE_LOCATION_ANTICHEAT === 'true',
  };
}
