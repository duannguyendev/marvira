import Mapbox from '@rnmapbox/maps';

const PLACEHOLDER = 'your-mapbox-access-token';

type LngLat = [number, number];

export type CirclePolygon = {
  type: 'Polygon';
  coordinates: LngLat[][];
};

/**
 * Public runtime token from Codemagic ENV or .env.local (Babel-inlined).
 */
export function getMapboxAccessToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? '';
  return typeof token === 'string' ? token.trim() : '';
}

export function initMapbox(): void {
  const token = getMapboxAccessToken();
  if (!token || token === PLACEHOLDER) {
    console.warn(
      'MAPBOX_ACCESS_TOKEN is missing. Set it in .env.local or Codemagic Secure ENV.',
    );
  }
  Mapbox.setAccessToken(token || null);
}

/** Approx circle polygon in meters around a lat/lng (for FillLayer). */
export function circlePolygon(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  points = 64,
): CirclePolygon {
  const coords: LngLat[] = [];
  const earthRadius = 6371000;
  for (let i = 0; i <= points; i++) {
    const bearing = (i / points) * 2 * Math.PI;
    const latOffset = (radiusMeters * Math.cos(bearing)) / earthRadius;
    const lngOffset =
      (radiusMeters * Math.sin(bearing)) /
      (earthRadius * Math.cos((latitude * Math.PI) / 180));
    coords.push([
      longitude + (lngOffset * 180) / Math.PI,
      latitude + (latOffset * 180) / Math.PI,
    ]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}

export function zoomFromLatitudeDelta(latitudeDelta: number): number {
  // Rough conversion from react-native-maps-style latitudeDelta to Mapbox zoom.
  const zoom = Math.log2(360 / Math.max(latitudeDelta, 0.0001));
  return Math.min(20, Math.max(1, zoom));
}

export const MAPBOX_STYLE = Mapbox.StyleURL.Street;
