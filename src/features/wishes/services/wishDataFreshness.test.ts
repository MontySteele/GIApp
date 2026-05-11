import { describe, expect, it } from 'vitest';
import { getWishDataFreshness, type WishDataSnapshot } from './wishDataFreshness';

function makeSnapshot(lastUpdatedAt: string | null, source: WishDataSnapshot['source'] = 'import'): WishDataSnapshot {
  return {
    lastUpdatedAt,
    hasWishData: Boolean(lastUpdatedAt),
    source,
  };
}

describe('getWishDataFreshness', () => {
  const now = new Date('2026-05-10T12:00:00.000Z');

  it('marks wish data missing when no import or wish records exist', () => {
    const freshness = getWishDataFreshness(null, now);

    expect(freshness.status).toBe('missing');
    expect(freshness.label).toBe('Import wish history');
  });

  it('marks recent wish imports fresh', () => {
    const freshness = getWishDataFreshness(
      makeSnapshot('2026-05-09T12:00:00.000Z', 'import'),
      now
    );

    expect(freshness.status).toBe('fresh');
    expect(freshness.daysSinceUpdate).toBe(1);
    expect(freshness.detail).toContain('wish history import');
    expect(freshness.detail).toContain('yesterday');
  });

  it('marks old wish data stale', () => {
    const freshness = getWishDataFreshness(
      makeSnapshot('2026-04-20T12:00:00.000Z', 'records'),
      now
    );

    expect(freshness.status).toBe('stale');
    expect(freshness.daysSinceUpdate).toBe(20);
    expect(freshness.detail).toContain('wish record update');
  });

  it('marks unparseable wish timestamps stale', () => {
    const freshness = getWishDataFreshness(
      {
        lastUpdatedAt: 'not-a-date',
        hasWishData: true,
        source: 'import',
      },
      now
    );

    expect(freshness.status).toBe('stale');
    expect(freshness.daysSinceUpdate).toBeNull();
    expect(freshness.detail).toContain('timestamp could not be read');
  });
});
