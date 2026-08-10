'use client';

import { useCallback, useMemo } from 'react';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
} from 'react-map-gl/mapbox';
import type { Place } from '@marvira/shared-types';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapPickerProps {
  places: Place[];
  onPlaceMove: (placeId: string, lat: number, lng: number) => void;
}

type LngLat = [number, number];

function circlePolygon(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  points = 64,
): { type: 'Polygon'; coordinates: LngLat[][] } {
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

export function MapPicker({ places, onPlaceMove }: MapPickerProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

  const center = places[0]
    ? { latitude: places[0].latitude, longitude: places[0].longitude }
    : { latitude: 37.7749, longitude: -122.4194 };

  const radiusCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: places.map(place => ({
        type: 'Feature' as const,
        properties: { id: place.id },
        geometry: circlePolygon(
          place.latitude,
          place.longitude,
          place.radiusMeters,
        ),
      })),
    }),
    [places],
  );

  const handleMarkerDragEnd = useCallback(
    (placeId: string, event: { lngLat: { lat: number; lng: number } }) => {
      onPlaceMove(placeId, event.lngLat.lat, event.lngLat.lng);
    },
    [onPlaceMove],
  );

  if (!token) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Interactive map is unavailable. Place coordinates are listed below —
          you can still edit them in each place card.
        </p>
        {places.length > 0 && (
          <div className="mt-4 space-y-2 text-left text-sm">
            {places.map((p, i) => (
              <div key={p.id} className="rounded border bg-card p-2">
                <span className="font-medium">
                  #{i + 1} {p.title}
                </span>
                <span className="ml-2 text-muted-foreground">
                  ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}) —{' '}
                  {p.radiusMeters}m radius
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <Map
          mapboxAccessToken={token}
          initialViewState={{
            longitude: center.longitude,
            latitude: center.latitude,
            zoom: 14,
          }}
          style={{ width: '100%', height: 400 }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}>
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="place-radii" type="geojson" data={radiusCollection}>
            <Layer
              id="place-radii-fill"
              type="fill"
              paint={{
                'fill-color': '#6A5AE0',
                'fill-opacity': 0.12,
              }}
            />
            <Layer
              id="place-radii-stroke"
              type="line"
              paint={{
                'line-color': '#6A5AE0',
                'line-width': 2,
              }}
            />
          </Source>
          {places.map((place, index) => (
            <Marker
              key={place.id}
              longitude={place.longitude}
              latitude={place.latitude}
              anchor="center"
              draggable
              onDragEnd={event => handleMarkerDragEnd(place.id, event)}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-primary-foreground shadow">
                {index + 1}
              </div>
            </Marker>
          ))}
        </Map>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag markers to update place coordinates. You can also edit values in
        the place cards below.
      </p>
      <div className="flex flex-wrap gap-2">
        {places.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {i + 1}
            </span>
            {p.title}
            <span className="text-muted-foreground">({p.radiusMeters}m)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
