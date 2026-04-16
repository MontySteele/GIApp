import { describe, it, expect } from 'vitest';
import { calculateIncomeRateTrend, calculateDailyRateFromSnapshots } from './historicalReconstruction';
import type { ResourceSnapshot, WishRecord, PrimogemEntry, BannerType, PrimogemSource } from '@/types';

function makePurchase(timestamp: string, amount: number, source: PrimogemSource = 'purchase'): PrimogemEntry {
  return {
    id: `purchase-${timestamp}-${Math.random()}`,
    timestamp,
    amount,
    source,
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

const PRIMOS_PER_PULL = 160;

function makeSnapshot(partial: Partial<ResourceSnapshot> & { id: string; timestamp: string }): ResourceSnapshot {
  return {
    primogems: 0,
    genesisCrystals: 0,
    intertwined: 0,
    acquaint: 0,
    starglitter: 0,
    stardust: 0,
    createdAt: partial.timestamp,
    ...partial,
  };
}

function makeWish(timestamp: string, bannerType: BannerType = 'character', id?: string): WishRecord {
  return {
    id: id ?? `wish-${timestamp}-${Math.random()}`,
    gachaId: `gacha-${timestamp}`,
    bannerType,
    bannerVersion: '5.3-phase1',
    timestamp,
    itemType: 'character',
    itemKey: 'test',
    rarity: 3,
  };
}

describe('calculateIncomeRateTrend', () => {
  describe('endSnapshot selection', () => {
    it('picks snapshot nearest to periodEnd when after-period snapshot is closer', () => {
      // Reference banner boundary is 2026-01-13. Target period: 2026-03-17..2026-04-07 (21 days)
      // Scenario mirrors the real bug: inside snapshot Mar 31 (7d before end),
      // after-period snapshot Apr 14 (7d after end), wishes Apr 1..Apr 7 excluded by old logic.
      const before = makeSnapshot({
        id: 'before',
        timestamp: '2026-03-16T00:00:00.000Z',
        primogems: 10000,
      });
      const insideLate = makeSnapshot({
        id: 'inside',
        timestamp: '2026-03-31T00:00:00.000Z',
        primogems: 0,
      });
      const afterPeriod = makeSnapshot({
        id: 'after',
        timestamp: '2026-04-14T00:00:00.000Z',
        primogems: 15000,
      });

      // 40 wishes during Apr 1..Apr 7 (inside the period, but after the last inside snapshot).
      // These would be excluded from income accounting if endSnapshot=inside.
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 40; i++) {
        const day = 1 + (i % 7);
        wishes.push(makeWish(`2026-04-0${day}T12:00:00.000Z`, 'character', `w-${i}`));
      }

      const result = calculateIncomeRateTrend([before, insideLate, afterPeriod], wishes, [], true);

      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(true);

      // Old (buggy) behaviour chose `inside` (Mar 31): income = max(0, 0 - 10000 + 0) = 0 → dailyRate = 0.
      // Fixed behaviour chooses `after` (Apr 14), same distance from periodEnd but wider span:
      // income = max(0, 15000 - 10000 + 40*160) = 11400 over 29 days ≈ 393/day.
      expect(period!.dailyRate).toBeGreaterThan(300);
      expect(period!.dailyRate).toBeLessThan(500);
    });

    it('still works when only an inside-period snapshot exists', () => {
      const before = makeSnapshot({
        id: 'before',
        timestamp: '2026-03-16T00:00:00.000Z',
        primogems: 1000,
      });
      const inside = makeSnapshot({
        id: 'inside',
        timestamp: '2026-03-25T00:00:00.000Z',
        primogems: 2000,
      });
      const result = calculateIncomeRateTrend([before, inside], [], [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(true);
    });

    it('still works when only an after-period snapshot exists', () => {
      const before = makeSnapshot({
        id: 'before',
        timestamp: '2026-03-16T00:00:00.000Z',
        primogems: 1000,
      });
      const after = makeSnapshot({
        id: 'after',
        timestamp: '2026-04-14T00:00:00.000Z',
        primogems: 5000,
      });
      const result = calculateIncomeRateTrend([before, after], [], [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(true);
    });

    it('prefers inside-period snapshot when it is closer to periodEnd', () => {
      // Inside snapshot 1 day before periodEnd, after-period snapshot 30 days later.
      // The closer (inside) snapshot should be selected.
      const before = makeSnapshot({
        id: 'before',
        timestamp: '2026-03-16T00:00:00.000Z',
        primogems: 1000,
      });
      const insideNearEnd = makeSnapshot({
        id: 'inside-late',
        timestamp: '2026-04-06T00:00:00.000Z',
        primogems: 1000 + 20 * PRIMOS_PER_PULL, // simulate 20 pulls worth of earned income
      });
      const afterFar = makeSnapshot({
        id: 'after-far',
        timestamp: '2026-05-07T00:00:00.000Z',
        primogems: 1000 + 200 * PRIMOS_PER_PULL, // huge later accumulation
      });
      const result = calculateIncomeRateTrend(
        [before, insideNearEnd, afterFar],
        [],
        [],
        true,
      );
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      // With inside snapshot chosen: income ~3200 over 21 days ~= 152/day
      // If after-far was wrongly chosen: rate would be computed over 52-day span then × 21 ~= way higher
      expect(period!.dailyRate).toBeLessThan(300);
    });
  });

  describe('excludePurchases filter (both calculators)', () => {
    // The "exclude purchases" path used to filter by !SPENDING_SOURCES.includes(source),
    // which inadvertently captured any non-cosmetic entry — including negative-amount
    // entries like wish_conversion. A negative purchases total subtracted from income
    // ADDED to the rate, making the excluded rate appear higher than the included rate.

    const makeSnapshotPair = () => {
      const firstTs = '2026-03-01T00:00:00.000Z';
      const lastTs = '2026-03-31T00:00:00.000Z';
      return [
        makeSnapshot({ id: 'first', timestamp: firstTs, primogems: 5000 }),
        makeSnapshot({ id: 'last', timestamp: lastTs, primogems: 20000 }),
      ];
    };

    it('calculateDailyRateFromSnapshots: excluded rate must not exceed included rate', () => {
      const snapshots = makeSnapshotPair();
      // Real purchase: +3000 primos
      // Wish conversion: -1600 primos (user converted some primos to fates manually)
      const purchases: PrimogemEntry[] = [
        makePurchase('2026-03-10T00:00:00.000Z', 3000, 'purchase'),
        makePurchase('2026-03-15T00:00:00.000Z', -1600, 'wish_conversion'),
      ];

      const rateIncluded = calculateDailyRateFromSnapshots(snapshots, [], 60, purchases, false);
      const rateExcluded = calculateDailyRateFromSnapshots(snapshots, [], 60, purchases, true);

      // Excluding purchases can never raise the rate above the included rate.
      expect(rateExcluded).toBeLessThanOrEqual(rateIncluded);
      // And the delta should equal the actual purchase inflow (3000 over 30 days = 100/day),
      // NOT be contaminated by the wish_conversion entry.
      expect(Math.abs((rateIncluded - rateExcluded) - 100)).toBeLessThan(0.01);
    });

    it('calculateIncomeRateTrend: excluded rate must not exceed included rate', () => {
      // Period 2026-03-17..2026-04-07
      const before = makeSnapshot({
        id: 'before',
        timestamp: '2026-03-16T00:00:00.000Z',
        primogems: 5000,
      });
      const after = makeSnapshot({
        id: 'after',
        timestamp: '2026-04-14T00:00:00.000Z',
        primogems: 20000,
      });
      const purchases: PrimogemEntry[] = [
        makePurchase('2026-03-25T00:00:00.000Z', 3000, 'purchase'),
        makePurchase('2026-03-28T00:00:00.000Z', -1600, 'wish_conversion'),
      ];

      const included = calculateIncomeRateTrend([before, after], [], purchases, false);
      const excluded = calculateIncomeRateTrend([before, after], [], purchases, true);

      const incl = included.find(r => r.periodStart === '2026-03-17');
      const excl = excluded.find(r => r.periodStart === '2026-03-17');
      expect(incl).toBeDefined();
      expect(excl).toBeDefined();

      expect(excl!.dailyRate).toBeLessThanOrEqual(incl!.dailyRate);
    });
  });
});
