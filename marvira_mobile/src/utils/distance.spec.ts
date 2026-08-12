import {
  hasSignificantLocationChange,
  toLocationQueryKey,
} from './distance';

describe('toLocationQueryKey', () => {
  it('drops timestamp/accuracy so GPS refresh does not change the key', () => {
    const a = toLocationQueryKey({
      latitude: 21.028511,
      longitude: 105.854222,
      accuracy: 8,
      timestamp: 1,
    });
    const b = toLocationQueryKey({
      latitude: 21.028509,
      longitude: 105.854219,
      accuracy: 12,
      timestamp: 2,
    });
    expect(a).toEqual(b);
  });

  it('returns null for missing or 0,0 fallback coords', () => {
    expect(toLocationQueryKey(undefined)).toBeNull();
    expect(toLocationQueryKey({ latitude: 0, longitude: 0 })).toBeNull();
  });
});

describe('hasSignificantLocationChange', () => {
  it('ignores sub-11m GPS jitter', () => {
    const prev = { latitude: 21.0285, longitude: 105.8542, timestamp: 1 };
    expect(
      hasSignificantLocationChange(prev, {
        ...prev,
        latitude: 21.02851,
        timestamp: 2,
      }),
    ).toBe(false);
  });

  it('treats first fix and ~100m moves as significant', () => {
    expect(
      hasSignificantLocationChange(null, {
        latitude: 21.0285,
        longitude: 105.8542,
      }),
    ).toBe(true);
    expect(
      hasSignificantLocationChange(
        { latitude: 21.0285, longitude: 105.8542 },
        { latitude: 21.0295, longitude: 105.8542 },
      ),
    ).toBe(true);
  });
});
