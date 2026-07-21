import {mapPlace} from './mappers';
import {ApiPlace} from '../types/api';

describe('mapPlace unlock semantics', () => {
  const basePlace: ApiPlace = {
    id: 'place-1',
    eventId: 'event-1',
    title: 'Start',
    description: 'First stop',
    latitude: 37.77,
    longitude: -122.42,
    radiusMeters: 100,
    orderIndex: 0,
    hint: null,
  };

  it('maps GPS unlock separately from sequence access', () => {
    const accessibleNotUnlocked = mapPlace({
      ...basePlace,
      accessible: true,
      unlocked: false,
      completed: false,
    });
    expect(accessibleNotUnlocked.isAccessible).toBe(true);
    expect(accessibleNotUnlocked.isUnlocked).toBe(false);

    const gpsUnlocked = mapPlace({
      ...basePlace,
      accessible: true,
      unlocked: true,
      completed: false,
    });
    expect(gpsUnlocked.isUnlocked).toBe(true);
  });

  it('defaults accessible and unlocked to false when omitted', () => {
    const mapped = mapPlace(basePlace);
    expect(mapped.isAccessible).toBe(false);
    expect(mapped.isUnlocked).toBe(false);
  });
});
