import { appAlert } from './appAlert';
import i18n from '../i18n';
import { Location, LocationWarning } from '../types';
import { locationService } from '../services/location.service';
import { isWithinRange } from './distance';
import { LOCATION_ACCURACY_THRESHOLD } from './constants';

export type FreshLocationError = 'unavailable' | 'poor_accuracy' | 'out_of_range';

export async function getFreshLocationForPlace(
  placeLocation: { latitude: number; longitude: number },
  radiusMeters: number,
): Promise<
  { ok: true; location: Location } | { ok: false; error: FreshLocationError }
> {
  let location: Location;
  try {
    location = await locationService.getCurrentLocation({ maximumAge: 0 });
  } catch {
    return { ok: false, error: 'unavailable' };
  }

  if (
    location.accuracy != null &&
    location.accuracy > LOCATION_ACCURACY_THRESHOLD
  ) {
    return { ok: false, error: 'poor_accuracy' };
  }

  if (!isWithinRange(location, placeLocation, radiusMeters)) {
    return { ok: false, error: 'out_of_range' };
  }

  return { ok: true, location };
}

export function showLocationWarnings(warnings?: LocationWarning[]) {
  if (!warnings?.length) {
    return;
  }

  const message = warnings[0]?.message || i18n.t('anticheat.message');

  appAlert.alert(i18n.t('anticheat.title'), message, [
    { text: i18n.t('anticheat.ok'), style: 'default' },
  ]);
}

function buildLocationPayload(location: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}) {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    ...(location.accuracy != null ? { accuracy: location.accuracy } : {}),
    ...(location.timestamp != null ? { timestamp: location.timestamp } : {}),
  };
}

export { buildLocationPayload };
