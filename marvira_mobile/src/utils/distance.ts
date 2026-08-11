import { Location } from '../types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km}km`;
}

/**
 * True when coordinates look like a real place (not the mapper's missing-places
 * fallback of 0,0 which would show ~12,000km from Vietnam).
 */
export function hasUsableCoordinates(
  location?: { latitude: number; longitude: number } | null,
): boolean {
  if (!location) {
    return false;
  }
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  return !(latitude === 0 && longitude === 0);
}

/**
 * Check if user is within range of a location
 */
export function isWithinRange(
  userLocation: Location,
  targetLocation: Location,
  rangeMeters: number = 100,
): boolean {
  const distance = calculateDistance(userLocation, targetLocation);
  return distance <= rangeMeters;
}
