'use client';

import type { Place } from '@marvira/shared-types';

interface MapPickerProps {
  places: Place[];
  onPlaceMove: (placeId: string, lat: number, lng: number) => void;
}

export function MapPicker({ places, onPlaceMove }: MapPickerProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Set{' '}
          <code className="rounded bg-muted px-1">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB
          </code>{' '}
          to enable the interactive map.
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

  const center = places[0]
    ? { lat: places[0].latitude, lng: places[0].longitude }
    : { lat: 37.7749, lng: -122.4194 };

  const markers = places
    .map(
      (p, i) =>
        `markers=color:0x6A5AE0%7Clabel:${i + 1}%7C${p.latitude},${p.longitude}`,
    )
    .join('&');

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=14&size=800x400&maptype=roadmap&${markers}&key=${apiKey}`;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        <img
          src={mapUrl}
          alt="Event places map"
          className="h-[400px] w-full object-cover"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Edit coordinates in place cards below. Drag-and-drop map editing
        requires Google Maps JavaScript API integration.
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
