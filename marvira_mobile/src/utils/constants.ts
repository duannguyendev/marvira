import { Platform } from 'react-native';

// Set USE_MOCK_API=true in dev only when running without backend
export const USE_MOCK_DATA = false;

// Android emulator: 10.0.2.2 → host machine localhost
const DEV_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

function requireReleaseUrl(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `${name} is missing in this release build. ` +
        'Codemagic: set Secure ENV. Local release: set it in .env.local.',
    );
  }
  return trimmed;
}

/** Debug/Metro → localhost. Release → Codemagic ENV or .env.local (inlined by Babel). */
export const API_BASE_URL = __DEV__
  ? `http://${DEV_API_HOST}:3001`
  : requireReleaseUrl('API_BASE_URL', process.env.API_BASE_URL);

/** Marketing site used for share / invite HTTPS links (`/e/{eventId}`). */
export const MARKETING_SITE_URL = __DEV__
  ? 'http://localhost:3000'
  : requireReleaseUrl('MARKETING_SITE_URL', process.env.MARKETING_SITE_URL);

// Location Configuration
export const DEFAULT_UNLOCK_RADIUS_METERS = 100;
export const LOCATION_UPDATE_INTERVAL = 5000;
export const LOCATION_ACCURACY_THRESHOLD = 50;

// Map Configuration
export const DEFAULT_MAP_REGION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Animation Durations
export const ANIMATION_DURATION = {
  short: 200,
  medium: 300,
  long: 500,
};

// Event Status Labels
export const EVENT_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};
