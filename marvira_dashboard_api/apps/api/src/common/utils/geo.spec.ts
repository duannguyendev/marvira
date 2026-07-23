import { haversineDistanceMeters } from '@marvira/shared-utils';

describe('haversineDistanceMeters', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistanceMeters(37.77, -122.42, 37.77, -122.42)).toBe(0);
  });

  it('calculates distance between two points', () => {
    const distance = haversineDistanceMeters(
      37.7879,
      -122.4075,
      37.7956,
      -122.3933,
    );
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(2000);
  });
});
