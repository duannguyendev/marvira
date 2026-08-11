import { mapEvent } from './mappers';
import { ApiEvent } from '../types/api';
import { hasUsableCoordinates } from '../utils/distance';

describe('mapEvent location for nearby payloads', () => {
  const baseEvent: ApiEvent = {
    id: 'event-1',
    title: 'Near home',
    description: 'A hunt close by',
    city: 'Hà Nội',
    coverImage: null,
    difficulty: 'EASY',
    rewardPoints: 50,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    distanceMeters: 320,
    _count: { places: 2 },
  };

  it('uses nearestLatitude/Longitude when places are omitted', () => {
    const mapped = mapEvent({
      ...baseEvent,
      nearestLatitude: 21.0285,
      nearestLongitude: 105.8542,
    });
    expect(mapped.location).toEqual({
      latitude: 21.0285,
      longitude: 105.8542,
    });
    expect(mapped.distance).toBe(320);
    expect(hasUsableCoordinates(mapped.location)).toBe(true);
  });

  it('falls back to 0,0 without places or nearest coords (list must keep API distance)', () => {
    const mapped = mapEvent(baseEvent);
    expect(mapped.location).toEqual({ latitude: 0, longitude: 0 });
    expect(mapped.distance).toBe(320);
    expect(hasUsableCoordinates(mapped.location)).toBe(false);
  });

  it('prefers first place coordinates over nearest* fields', () => {
    const mapped = mapEvent({
      ...baseEvent,
      nearestLatitude: 1,
      nearestLongitude: 2,
      places: [
        {
          id: 'p1',
          eventId: 'event-1',
          title: 'Start',
          description: 'd',
          latitude: 21.03,
          longitude: 105.85,
          radiusMeters: 100,
          orderIndex: 0,
          hint: null,
        },
      ],
    });
    expect(mapped.location).toEqual({ latitude: 21.03, longitude: 105.85 });
  });
});
