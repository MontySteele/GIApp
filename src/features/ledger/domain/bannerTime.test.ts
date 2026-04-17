import { describe, it, expect } from 'vitest';
import {
  etWallToUtc,
  bannerPeriodBoundary,
  getBannerPeriodStart,
  addBannerPeriods,
  BANNER_DURATION_DAYS,
} from './bannerTime';

describe('etWallToUtc', () => {
  it('converts 5 PM EDT to 21:00 UTC during daylight saving (March)', () => {
    // Mar 17, 2026 is after DST start (2nd Sunday = Mar 8, 2026) → EDT (UTC-4).
    const d = etWallToUtc(2026, 3, 17, 17);
    expect(d.toISOString()).toBe('2026-03-17T21:00:00.000Z');
  });

  it('converts 5 PM EST to 22:00 UTC during standard time (January)', () => {
    // Jan 13, 2026 is before DST start → EST (UTC-5).
    const d = etWallToUtc(2026, 1, 13, 17);
    expect(d.toISOString()).toBe('2026-01-13T22:00:00.000Z');
  });

  it('converts 5 PM EST to 22:00 UTC in December', () => {
    const d = etWallToUtc(2026, 12, 15, 17);
    expect(d.toISOString()).toBe('2026-12-15T22:00:00.000Z');
  });

  it('handles DST transition boundary (early November)', () => {
    // Nov 1, 2026 = EDT (DST ends Nov 1 2026 at 2 AM local → first Sunday).
    // At 5 PM Eastern on Nov 1 2026, DST has ALREADY ended (EST). UTC-5.
    const d = etWallToUtc(2026, 11, 1, 17);
    expect(d.toISOString()).toBe('2026-11-01T22:00:00.000Z');
  });
});

describe('bannerPeriodBoundary', () => {
  it('returns Jan 13 2026 5 PM EST (= 22:00 UTC) for offset 0', () => {
    expect(bannerPeriodBoundary(0).toISOString()).toBe('2026-01-13T22:00:00.000Z');
  });

  it('returns Feb 3 2026 5 PM EST for offset 1 (21 days later)', () => {
    expect(bannerPeriodBoundary(1).toISOString()).toBe('2026-02-03T22:00:00.000Z');
  });

  it('crosses DST boundary: Mar 17 2026 returns 21:00 UTC (EDT)', () => {
    // Jan 13 + 63 days = Mar 17. By then DST is active (started Mar 8).
    expect(bannerPeriodBoundary(3).toISOString()).toBe('2026-03-17T21:00:00.000Z');
  });

  it('handles negative offsets (banners before the reference)', () => {
    // Jan 13 - 21 = Dec 23 2025, EST.
    expect(bannerPeriodBoundary(-1).toISOString()).toBe('2025-12-23T22:00:00.000Z');
  });
});

describe('getBannerPeriodStart', () => {
  it('returns the current period start for a timestamp inside it', () => {
    // Mar 20, 2026 is inside the Mar 17 → Apr 7 period.
    const d = new Date('2026-03-20T12:00:00.000Z');
    expect(getBannerPeriodStart(d).toISOString()).toBe('2026-03-17T21:00:00.000Z');
  });

  it('a timestamp before 5 PM ET on patch day belongs to the previous period', () => {
    // Mar 17 2 PM ET = 18:00 UTC (EDT). Before the Mar 17 21:00 UTC cutoff, so
    // this instant is still in the Feb 24 period.
    const d = new Date('2026-03-17T18:00:00.000Z');
    expect(getBannerPeriodStart(d).toISOString()).toBe('2026-02-24T22:00:00.000Z');
  });

  it('a timestamp at exactly 5 PM ET belongs to the new period', () => {
    const d = new Date('2026-03-17T21:00:00.000Z');
    expect(getBannerPeriodStart(d).toISOString()).toBe('2026-03-17T21:00:00.000Z');
  });

  it('user scenario: purchase at 2 PM ET on patch day lands in previous banner', () => {
    // Reproduces the user-reported case: they bought primos at "2 PM Eastern"
    // on Mar 17 (patch day). That belongs to the previous banner period, not
    // the new one that starts at 5 PM ET.
    const purchase2pmEt = etWallToUtc(2026, 3, 17, 14);
    const period = getBannerPeriodStart(purchase2pmEt);
    // Previous period = Feb 24 (21 days before Mar 17).
    expect(period.toISOString()).toBe('2026-02-24T22:00:00.000Z');
  });
});

describe('addBannerPeriods', () => {
  it('adds 1 period (21 calendar days at 5 PM ET)', () => {
    const start = bannerPeriodBoundary(0);
    expect(addBannerPeriods(start, 1).toISOString()).toBe(bannerPeriodBoundary(1).toISOString());
  });

  it('preserves 5 PM ET across DST boundary (hours shift by 1)', () => {
    // Jan 13 (EST) + 63 days = Mar 17 (EDT). Despite adding "21 days * 3"
    // worth of milliseconds, the result is 5 PM ET on Mar 17 (= 21:00 UTC),
    // not 22:00 UTC. This is the DST-aware guarantee.
    const start = bannerPeriodBoundary(0); // Jan 13 22:00 UTC
    const three = addBannerPeriods(start, 3);
    expect(three.toISOString()).toBe('2026-03-17T21:00:00.000Z');
  });

  it('BANNER_DURATION_DAYS is 21', () => {
    expect(BANNER_DURATION_DAYS).toBe(21);
  });
});
