import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventAvailabilityFilter } from '../types';

export const EVENT_LIST_FILTERS_STORAGE_KEY = '@marvira/event_list_filters';

export const DEFAULT_EVENT_LIST_RADIUS_METERS = 25000;

const AVAILABILITY_FILTERS: EventAvailabilityFilter[] = ['open', 'incoming'];

export type StoredEventListFilters = {
  /** meters; null = no radius filter */
  radius: number | null;
  status?: EventAvailabilityFilter;
};

function isValidRadius(value: unknown): value is number | null {
  if (value === null) {
    return true;
  }
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidStatus(
  value: unknown,
): value is EventAvailabilityFilter | undefined {
  if (value === undefined || value === null) {
    return true;
  }
  return (
    typeof value === 'string' &&
    AVAILABILITY_FILTERS.includes(value as EventAvailabilityFilter)
  );
}

export async function getEventListFilters(): Promise<StoredEventListFilters | null> {
  try {
    const raw = await AsyncStorage.getItem(EVENT_LIST_FILTERS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredEventListFilters>;
    if (!isValidRadius(parsed.radius) || !isValidStatus(parsed.status)) {
      return null;
    }
    return {
      radius: parsed.radius,
      status: parsed.status ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function setEventListFilters(
  filters: StoredEventListFilters,
): Promise<void> {
  await AsyncStorage.setItem(
    EVENT_LIST_FILTERS_STORAGE_KEY,
    JSON.stringify({
      radius: filters.radius,
      status: filters.status,
    }),
  );
}
