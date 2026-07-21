import {Platform} from 'react-native';

// Set USE_MOCK_API=true in dev only when running without backend
export const USE_MOCK_DATA = false;

// Android emulator: 10.0.2.2 → host machine localhost
const DEV_API_HOST =
  Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = __DEV__
  ? `http://${DEV_API_HOST}:3001`
  : 'https://api.marvira.example.com'; // Replace before production release

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
