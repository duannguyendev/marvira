'use client';

import { useEffect, useMemo, useState } from 'react';
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

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

interface LocationMapFieldProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  onChange: (latitude: number, longitude: number) => void;
  height?: number;
}

export function LocationMapField({
  latitude,
  longitude,
  radiusMeters = 100,
  onChange,
  height = 320,
}: LocationMapFieldProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? '';

  const lat = Number.isFinite(latitude) ? latitude : 37.7749;
  const lng = Number.isFinite(longitude) ? longitude : -122.4194;
  const radius =
    Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : 100;

  const [viewState, setViewState] = useState({
    longitude: lng,
    latitude: lat,
    zoom: 15,
  });

  // Recenter when coordinates jump from outside the map (e.g. typed inputs / place switch).
  useEffect(() => {
    const dLat = Math.abs(viewState.latitude - lat);
    const dLng = Math.abs(viewState.longitude - lng);
    if (dLat > 0.002 || dLng > 0.002) {
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to pin coords
  }, [lat, lng]);

  const radiusCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: circlePolygon(lat, lng, radius),
        },
      ],
    }),
    [lat, lng, radius],
  );

  if (!token) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        Set{' '}
        <code className="rounded bg-muted px-1">
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        </code>{' '}
        to pick a location on the map. You can still enter coordinates below.
      </div>
    );
  }

  const handleMapClick = (event: MapLayerMouseEvent) => {
    onChange(event.lngLat.lat, event.lngLat.lng);
  };

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <Map
          mapboxAccessToken={token}
          {...viewState}
          onMove={event => setViewState(event.viewState)}
          style={{ width: '100%', height }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          attributionControl={false}
          onClick={handleMapClick}
          cursor="crosshair">
          <NavigationControl position="top-right" showCompass={false} />
          <Source id="pick-radius" type="geojson" data={radiusCollection}>
            <Layer
              id="pick-radius-fill"
              type="fill"
              paint={{
                'fill-color': '#6A5AE0',
                'fill-opacity': 0.12,
              }}
            />
            <Layer
              id="pick-radius-stroke"
              type="line"
              paint={{
                'line-color': '#6A5AE0',
                'line-width': 2,
              }}
            />
          </Source>
          <Marker
            longitude={lng}
            latitude={lat}
            anchor="center"
            draggable
            onDragEnd={event =>
              onChange(event.lngLat.lat, event.lngLat.lng)
            }>
            <div className="h-7 w-7 rounded-full border-2 border-white bg-primary shadow" />
          </Marker>
        </Map>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the map or drag the pin to set the place location. Unlock radius
        is shown as the purple circle.
      </p>
    </div>
  );
}
