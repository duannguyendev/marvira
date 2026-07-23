import { Alert } from 'react-native';
import i18n from '../i18n';
import { LocationWarning } from '../types';

export function showLocationWarnings(warnings?: LocationWarning[]) {
  if (!warnings?.length) {
    return;
  }

  const message = warnings[0]?.message || i18n.t('anticheat.message');

  Alert.alert(i18n.t('anticheat.title'), message, [
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
