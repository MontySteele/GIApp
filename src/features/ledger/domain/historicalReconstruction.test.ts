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
  describe('boundary bracketing', () => {
    it('includes end-of-period wishes even when the nearest snapshot precedes them', () => {
      // Regression guard: before the interpolation refactor, the algorithm picked
      // a single "endSnapshot" and dropped wishes that landed between it and the
      // period end. With period-boundary interpolation, E(periodEnd) is computed
      // from the next-available snapshot (Apr 14), which captures those wishes.
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

      // 40 wishes during Apr 1..Apr 7 (inside the period, past the last inside snapshot).
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 40; i++) {
        const day = 1 + (i % 7);
        wishes.push(makeWish(`2026-04-0${day}T12:00:00.000Z`, 'character', `w-${i}`));
      }

      const result = calculateIncomeRateTrend([before, insideLate, afterPeriod], wishes, [], true);

      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(true);

      // E(afterPeriod) = 15000 + 40*160 = 21400. E(insideLate) = 0. E is
      // interpolated at Apr 7 21:00 UTC (between Mar 31 and Apr 14), capturing
      // roughly half the 21400 delta. earned(period) > 0 — the end-of-period
      // wishes are now visible, whereas the old algorithm reported 0.
      expect(period!.dailyRate).toBeGreaterThan(50);
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

  // ==========================================================================
  // INTENDED LOGIC — Conservation equation documentation
  // --------------------------------------------------------------------------
  // Snapshot-based rate derives from the identity:
  //   earned_income = (endTotal - startTotal) + pulls*160 + |cosmetic_spent| - purchases
  // where snapshotTotal = primogems + genesisCrystals + intertwined*160 + acquaint*160
  //
  // The value is clamped at 0 (negative "earned income" is nonsensical and
  // usually indicates missing wish history or untracked spending).
  //
  // For periods without direct bounding snapshots the algorithm extrapolates a
  // rate from the nearest snapshot span (assumes uniform earning within the
  // span). `dailyRate = snapshotSpanIncome / spanDays`, then
  // `periodIncome = dailyRate * periodDays`.
  // ==========================================================================
  describe('intended logic — conservation equation', () => {
    it('pure F2P: dailyRate reflects (endTotal - startTotal + pulls*160) / days', () => {
      // Period 2026-03-17 .. 2026-04-07 (21 days)
      // Before period at exactly periodStart so the span == the period exactly.
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 5000,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 7000,
      });
      // 10 character pulls during the period: costs 1600 primos.
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 10; i++) wishes.push(makeWish('2026-03-25T12:00:00.000Z', 'character', `w-${i}`));

      const result = calculateIncomeRateTrend([before, after], wishes, [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();

      // Expected earned income = (7000-5000) + 10*160 = 3600 over 21 days = ~171/day
      expect(period!.hasSnapshotData).toBe(true);
      expect(period!.totalIncome).toBeGreaterThanOrEqual(3600 - 50);
      expect(period!.totalIncome).toBeLessThanOrEqual(3600 + 50);
    });

    it('snapshot total counts genesis crystals and ALL fate types at 160 primos', () => {
      // Start: 1000 primos + 1000 genesis + 5 intertwined + 5 acquaint
      //      = 1000 + 1000 + 5*160 + 5*160 = 3600 equivalent primos
      // End:   0 primos + 0 genesis + 10 intertwined + 0 acquaint = 1600
      // With 0 wishes and 0 purchases, earned = max(0, 1600 - 3600) = 0 (clamped).
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z',
        primogems: 1000, genesisCrystals: 1000, intertwined: 5, acquaint: 5,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z',
        primogems: 0, genesisCrystals: 0, intertwined: 10, acquaint: 0,
      });
      const result = calculateIncomeRateTrend([before, after], [], [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.dailyRate).toBe(0); // clamped
    });

    it('standard-banner wishes must be counted (their acquaint fates are in snapshot total)', () => {
      // If a player pulled only on the standard banner, the acquaint fate in
      // their snapshot decreases. Only counting intertwined wishes would
      // leave those acquaint fates looking like "lost" income (→ 0 clamped).
      // The fix: calculateIncomeRateTrend uses sortedAllWishes for snapshot-span math.
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 0, acquaint: 10,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 0, acquaint: 0,
      });
      // 10 standard-banner pulls consume 10 acquaint fates (= 1600 primos equivalent)
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 10; i++) wishes.push(makeWish('2026-03-25T12:00:00.000Z', 'standard', `s-${i}`));

      const result = calculateIncomeRateTrend([before, after], wishes, [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      // endTotal - startTotal = 0 - 1600 = -1600; + 10*160 = 0 → exactly 0 earned.
      expect(period!.dailyRate).toBe(0);
    });

    it('cosmetic spending is added back to earned income (it is spent, not lost)', () => {
      // Before: 10000 primos. After: 5000 primos. No wishes. Cosmetic: -5000.
      // Earned = (5000-10000) + 0 - (-5000) = 0. Perfect accounting.
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 10000,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 5000,
      });
      const cosmetic: PrimogemEntry[] = [
        makePurchase('2026-03-20T00:00:00.000Z', -5000, 'cosmetic'),
      ];
      const result = calculateIncomeRateTrend([before, after], [], cosmetic, true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period!.dailyRate).toBe(0);
    });

    it('genesis purchase included: raises the rate', () => {
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 0,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 4200,
      });
      const purchases: PrimogemEntry[] = [
        makePurchase('2026-03-25T00:00:00.000Z', 3000, 'purchase'),
      ];
      const included = calculateIncomeRateTrend([before, after], [], purchases, false);
      const excluded = calculateIncomeRateTrend([before, after], [], purchases, true);

      const incl = included.find(r => r.periodStart === '2026-03-17')!;
      const excl = excluded.find(r => r.periodStart === '2026-03-17')!;

      // Included: 4200 / 21 = 200/day. Excluded: max(0, 4200 - 3000) / 21 = 57/day.
      expect(incl.dailyRate).toBe(200);
      expect(excl.dailyRate).toBe(57);
      expect(incl.dailyRate - excl.dailyRate).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Helper to distribute N wishes across [Mar 17 .. Apr 6] (21 days).
  // (Keeping helper local to the describe block below so it's co-located with
  // the only callers that rely on the 2026-03-17 period alignment.)
  // ==========================================================================

  // ==========================================================================
  // REAL-WORLD SCENARIO — Why does "Mar 17" show 211/day for the user?
  // --------------------------------------------------------------------------
  // User reports earning ~80 pulls of "free income" during 2026-03-17..04-07
  // and expects a rate closer to 610/day (80*160/21). The chart shows 211/day.
  //
  // The conservation equation reveals this is EXPECTED if the user also
  // tracked genesis crystal purchases during the period: those inflate the
  // snapshot-to-snapshot delta but are not earned income. Subtracting them
  // (the default "exclude purchases" toggle) reduces the earned component.
  //
  // This test documents the exact numbers so the user can compare against
  // their real data:
  //   earned = (endTotal - startTotal) + pulls*160 - purchasesBetween
  //          = 0 + 80*160 - 8369 = 4431
  //   rate   = 4431 / 21 ≈ 211 primos/day
  // ==========================================================================
  describe('real-world scenario reproducing user-reported 211/day', () => {
    it('80 pulls + 8369 primos of purchases during period → 211/day (excluded)', () => {
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 8286,
      });
      // endTotal intentionally = startTotal so the delta is entirely explained
      // by the 80 pulls (12800 spent) minus the 8369 purchased.
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 8286,
      });
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 80; i++) {
        // Spread across Mar 17..Apr 6 inclusive (21 days). Day offset 0..20.
        const offset = i % 21;
        const isMarch = offset < 15; // Mar 17..Mar 31 = offsets 0..14
        const dayNum = isMarch ? 17 + offset : offset - 14; // Apr 1..Apr 6 = offsets 15..20
        const day = String(dayNum).padStart(2, '0');
        const month = isMarch ? '03' : '04';
        wishes.push(makeWish(`2026-${month}-${day}T12:00:00.000Z`, 'character', `p-${i}`));
      }
      const purchases: PrimogemEntry[] = [
        makePurchase('2026-03-25T00:00:00.000Z', 8369, 'purchase'),
      ];

      const excluded = calculateIncomeRateTrend([before, after], wishes, purchases, true);
      const period = excluded.find(r => r.periodStart === '2026-03-17')!;

      expect(period.hasSnapshotData).toBe(true);
      // 4431 / 21 = 211.0 → rounds to 211
      expect(period.dailyRate).toBe(211);
      expect(period.totalIncome).toBe(4431);
    });

    it('same scenario with purchases included: +purchase/21 ≈ 610/day (aligns with user intuition)', () => {
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-17T00:00:00.000Z', primogems: 8286,
      });
      const after = makeSnapshot({
        id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 8286,
      });
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 80; i++) {
        // Spread across Mar 17..Apr 6 inclusive (21 days). Day offset 0..20.
        const offset = i % 21;
        const isMarch = offset < 15; // Mar 17..Mar 31 = offsets 0..14
        const dayNum = isMarch ? 17 + offset : offset - 14; // Apr 1..Apr 6 = offsets 15..20
        const day = String(dayNum).padStart(2, '0');
        const month = isMarch ? '03' : '04';
        wishes.push(makeWish(`2026-${month}-${day}T12:00:00.000Z`, 'character', `p-${i}`));
      }
      const purchases: PrimogemEntry[] = [
        makePurchase('2026-03-25T00:00:00.000Z', 8369, 'purchase'),
      ];

      const included = calculateIncomeRateTrend([before, after], wishes, purchases, false);
      const period = included.find(r => r.periodStart === '2026-03-17')!;

      // (0 + 80*160) / 21 ≈ 609.5 → rounds to 610
      expect(period.dailyRate).toBe(610);
    });
  });

  // ==========================================================================
  // INTENDED LOGIC — Fallback & edge-case behaviour
  // ==========================================================================
  describe('intended logic — fallback paths', () => {
    it('with NO bounding snapshots, falls back to wish-spending estimate', () => {
      // No snapshots at all in this period. Only wishes. hasSnapshotData=false
      // and totalIncome ≈ intertwined pulls × 160. Note: the banner cutoff is
      // 5 PM ET (=21:00 UTC during EDT); wishes at noon UTC on Mar 17 fall in
      // the PREVIOUS banner, so only 20 of the 21 wishes land inside Mar 17's
      // period.
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 21; i++) {
        const offset = i % 21;
        const isMarch = offset < 15;
        const dayNum = isMarch ? 17 + offset : offset - 14;
        const day = String(dayNum).padStart(2, '0');
        const month = isMarch ? '03' : '04';
        wishes.push(makeWish(`2026-${month}-${day}T12:00:00.000Z`, 'character', `f-${i}`));
      }
      const result = calculateIncomeRateTrend([], wishes, [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(false);
      expect(period!.totalIncome).toBe(20 * 160); // 3200: Mar 17 noon wish is in previous period
      expect(period!.dailyRate).toBeGreaterThanOrEqual(150);
      expect(period!.dailyRate).toBeLessThanOrEqual(160);
    });

    it('snapshotBefore only (no in-period, no after): falls back to wish spending', () => {
      const before = makeSnapshot({
        id: 'before', timestamp: '2026-03-16T00:00:00.000Z', primogems: 5000,
      });
      const wishes: WishRecord[] = [];
      for (let i = 0; i < 10; i++) wishes.push(makeWish('2026-03-25T12:00:00.000Z', 'character', `x-${i}`));

      const result = calculateIncomeRateTrend([before], wishes, [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      // No bounding snapshot inside/after → spendingInPeriod = 10*160
      expect(period!.hasSnapshotData).toBe(false);
      expect(period!.totalIncome).toBe(1600);
    });

    it('two snapshots on the same day: interpolation still yields a rate', () => {
      // Pre-refactor behaviour fell back to wish-based whenever both snapshots
      // landed on the same day. Interpolation handles this correctly: as long
      // as the two snapshot timestamps differ, a rate can be established (even
      // if extrapolation beyond the pair is needed).
      const a = makeSnapshot({
        id: 'a', timestamp: '2026-03-17T06:00:00.000Z', primogems: 1000,
      });
      const b = makeSnapshot({
        id: 'b', timestamp: '2026-03-17T23:59:00.000Z', primogems: 2000,
      });
      const wishes = [makeWish('2026-03-20T00:00:00.000Z', 'character', 'y-1')];
      const result = calculateIncomeRateTrend([a, b], wishes, [], true);
      const period = result.find(r => r.periodStart === '2026-03-17');
      expect(period).toBeDefined();
      expect(period!.hasSnapshotData).toBe(true);
    });
  });
});

// ==========================================================================
// KNOWN APPROXIMATIONS — Tests that DOCUMENT current behaviour so future
// changes (e.g., switching to period-boundary interpolation) are intentional.
// ==========================================================================
describe('diagnostics — breakdown fields for tooltip transparency', () => {
  it('populates all breakdown fields when snapshot data is available', () => {
    // Use noon UTC timestamps so that format() produces the same date in any local TZ
    const before = makeSnapshot({
      id: 'before', timestamp: '2026-03-16T12:00:00.000Z', primogems: 5000,
    });
    const after = makeSnapshot({
      id: 'after', timestamp: '2026-04-07T12:00:00.000Z', primogems: 8200,
    });
    const wishes: WishRecord[] = [];
    for (let i = 0; i < 10; i++) wishes.push(makeWish('2026-03-25T12:00:00.000Z', 'character', `d-${i}`));
    const purchases: PrimogemEntry[] = [
      makePurchase('2026-03-20T12:00:00.000Z', 1600, 'purchase'),
      makePurchase('2026-03-22T12:00:00.000Z', -500, 'cosmetic'),
    ];

    const result = calculateIncomeRateTrend([before, after], wishes, purchases, true);
    const period = result.find(r => r.periodStart === '2026-03-17')!;

    expect(period.hasSnapshotData).toBe(true);
    expect(period.diagnostics).toBeDefined();
    const d = period.diagnostics!;
    // Just verify YYYY-MM-DD format shape; exact date depends on local TZ
    expect(d.startSnapshotDate).toMatch(/^2026-03-\d{2}$/);
    expect(d.endSnapshotDate).toMatch(/^2026-04-\d{2}$/);

    // startTotal / endTotal are now interpolated E() values at the period
    // boundaries (5 PM ET cutoffs), not raw snapshot totals. Over the full
    // two-snapshot span the cumulative earned delta is:
    //   E(after) - E(before) = (8200 - 5000) + 10*160 - (-500) - 1600 = 3600
    // The 21-day period slice of that linear ramp is ~3600 * 21/22 ≈ 3436.
    // Field-level assertions target the conservation identity rather than the
    // absolute interpolated values (which depend on the exact time math).
    expect(d.endTotal - d.startTotal).toBe(d.snapshotDelta);
    expect(d.wishesBetween).toBe(10);
    expect(d.wishPrimosBetween).toBe(1600);
    expect(d.cosmeticRecovered).toBe(500); // flipped from -500
    expect(d.purchasesExcluded).toBe(1600);
    // spanDays == period length (21 days, up to sub-second drift from TZ math)
    expect(d.spanDays).toBeCloseTo(21, 3);
    // spanIncome = interpolated earned over the 21-day period. Must be positive
    // and strictly less than the total cross-span earned (3600), since the
    // period doesn't cover the full span.
    expect(d.spanIncome).toBeGreaterThan(3000);
    expect(d.spanIncome).toBeLessThan(3600);
    expect(d.spanRate).toBeCloseTo(d.spanIncome / d.spanDays, 1);
  });

  it('diagnostics undefined when no snapshot data available (fallback path)', () => {
    const wishes = [makeWish('2026-03-20T12:00:00.000Z', 'character', 'z-1')];
    const result = calculateIncomeRateTrend([], wishes, [], true);
    const period = result.find(r => r.periodStart === '2026-03-17');
    expect(period).toBeDefined();
    expect(period!.hasSnapshotData).toBe(false);
    expect(period!.diagnostics).toBeUndefined();
  });
});

describe('period-boundary interpolation — linear rate is consistent across periods', () => {
  it('wide-span snapshots produce uniform rate across contained periods', () => {
    // Snapshots 42 days apart span two banner periods. Rate is uniform at
    // 200/day. Period-boundary interpolation reports that rate for every
    // period inside (or straddling) the span.
    const before = makeSnapshot({
      id: 'before', timestamp: '2026-02-24T00:00:00.000Z', primogems: 0,
    });
    const after = makeSnapshot({
      id: 'after', timestamp: '2026-04-07T00:00:00.000Z', primogems: 8400,
    });
    const result = calculateIncomeRateTrend([before, after], [], [], true);

    const mar17 = result.find(r => r.periodStart === '2026-03-17');
    expect(mar17).toBeDefined();
    expect(mar17!.hasSnapshotData).toBe(true);
    // 200/day uniform rate
    expect(mar17!.dailyRate).toBe(200);
    // 200/day × 21 days = 4200
    expect(mar17!.totalIncome).toBeCloseTo(4200, -1);
  });
});

describe('bug regression — pre-snapshot periods do not extrapolate backward', () => {
  it('historical periods before the first snapshot fall back to wish-based estimate', () => {
    // Reproduces the user-reported regression where adding a pair of close
    // snapshots in Jan caused every historical period (Oct/Nov/Dec) to be
    // extrapolated at the Jan rate. With close-together snapshots that
    // captured an atypical earning burst, rates could reach ~11,000/day for
    // periods where nothing was actually known about earning.
    //
    // Guarantee: periods whose periodStart falls before the first snapshot
    // must use the wish-spending fallback (hasSnapshotData=false), not
    // extrapolation.
    const s1 = makeSnapshot({
      id: 's1', timestamp: '2026-01-20T00:00:00.000Z', primogems: 1000,
    });
    const s2 = makeSnapshot({
      // 1 day later, huge delta — would extrapolate to 10000/day if allowed.
      id: 's2', timestamp: '2026-01-21T00:00:00.000Z', primogems: 11000,
    });
    // A handful of wishes sprinkled across the Oct-Dec periods.
    const wishes: WishRecord[] = [
      makeWish('2025-11-05T12:00:00.000Z', 'character', 'h-1'),
      makeWish('2025-11-20T12:00:00.000Z', 'character', 'h-2'),
      makeWish('2025-12-10T12:00:00.000Z', 'character', 'h-3'),
    ];
    const result = calculateIncomeRateTrend([s1, s2], wishes, [], true);

    // Find any period with periodStart strictly before 2026-01-20.
    const preSnapshotPeriods = result.filter(r => r.periodStart < '2026-01-20');
    expect(preSnapshotPeriods.length).toBeGreaterThan(0);
    for (const p of preSnapshotPeriods) {
      expect(p.hasSnapshotData).toBe(false);
      // Rate must be bounded by wish-based estimate (≤ ~160/day per wish/day),
      // nowhere near the 10000/day that naïve extrapolation produced.
      expect(p.dailyRate).toBeLessThanOrEqual(200);
    }
  });
});

describe('bug regression — purchase in previous banner must not bleed into next', () => {
  it('purchase before periodStart (prior banner) does not inflate next banner rate', () => {
    // Scenario from user report: Mar 15 purchase of 8080 primos (previous
    // banner period), snapshots bracket both Mar 15 purchase and the Mar 17
    // banner. Old algorithm let the purchase bleed into the Mar 17 rate via
    // span-scaling. New interpolation isolates it.
    const s0 = makeSnapshot({
      id: 's0', timestamp: '2026-03-01T12:00:00.000Z', primogems: 5000,
    });
    const s1 = makeSnapshot({
      // After the Mar 15 purchase; snapshotTotal reflects the +8080.
      id: 's1', timestamp: '2026-03-16T00:00:00.000Z', primogems: 5000 + 8080,
    });
    const s2 = makeSnapshot({
      id: 's2', timestamp: '2026-04-07T12:00:00.000Z', primogems: 5000 + 8080,
    });
    const purchases: PrimogemEntry[] = [
      makePurchase('2026-03-15T12:00:00.000Z', 8080, 'purchase'),
    ];
    // 0 wishes during Mar 17 banner — the user earned nothing and made no
    // pulls. Any apparent income is accounting drift.
    const result = calculateIncomeRateTrend([s0, s1, s2], [], purchases, true);
    const mar17 = result.find(r => r.periodStart === '2026-03-17')!;
    expect(mar17.hasSnapshotData).toBe(true);
    // The Mar 15 purchase is the ONLY source of the 8080 delta, and it
    // occurred strictly before periodStart. Excluded rate must be ~0.
    expect(mar17.dailyRate).toBe(0);
    expect(mar17.totalIncome).toBe(0);
  });
});

describe('wish-based fallback must exclude standard banner pulls', () => {
  it('standard banner wishes are NOT counted as spending in the fallback', () => {
    // User hypothesis: "acquaint fates (standard banner pulls) are being
    // counted as spent wishes but not in reconstructed primogem income."
    // Verify that standard banner wishes are EXCLUDED from the wish-spending
    // proxy (they're funded by acquaint fates, not directly by primos).
    //
    // No snapshots → every period falls back to wish-based estimation.
    // 10 character-banner wishes + 10 standard-banner wishes in the same period.
    // Spending proxy should count 10 * 160 = 1600, NOT 20 * 160 = 3200.
    const wishes: WishRecord[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        makeWish(`2026-02-15T12:00:00.000Z`, 'character', `c-${i}`),
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeWish(`2026-02-15T12:00:00.000Z`, 'standard', `s-${i}`),
      ),
    ];
    const result = calculateIncomeRateTrend([], wishes, [], true);
    const feb3 = result.find(r => r.periodStart === '2026-02-03');
    expect(feb3).toBeDefined();
    expect(feb3!.hasSnapshotData).toBe(false);
    // estimate.wishesInPeriod counts intertwined wishes only.
    expect(feb3!.estimate!.wishesInPeriod).toBe(10);
    expect(feb3!.estimate!.wishPrimos).toBe(10 * 160);
    // If standard pulls were incorrectly counted, this would be 20.
  });
});

describe('bug regression — negative interpolated delta falls back to wish-based', () => {
  it('period with impossible negative E() delta uses wish spending instead of 0', () => {
    // Reproduces the user-reported Jan 13 case: tooltip showed Earned Δ: -15,286
    // despite 385 wishes in the period. Root cause: purchase records
    // timestamped after the first snapshot even though those primos were
    // already absorbed into snapshotTotal(s1). That inflates E(s1) and makes
    // the delta E(s2)-E(s1) go negative.
    //
    // Simulate: first snapshot already has high primogems, followed by a
    // purchase recorded "after" the snapshot (data inconsistency), then a
    // later snapshot shows the same or lower total. With many wishes in the
    // period, clamping to 0 hides real activity; the fallback uses wishes.
    const s1 = makeSnapshot({
      id: 's1',
      timestamp: '2026-01-14T00:00:00.000Z',
      primogems: 20000, // already includes the "post-snapshot" purchase
    });
    const s2 = makeSnapshot({
      id: 's2',
      timestamp: '2026-02-02T00:00:00.000Z',
      primogems: 5000, // spent most of it on wishes
    });
    // Purchase timestamped AFTER s1, but the +8080 is already in s1's total.
    // E(s1) = 20000 + 0 - (-0) - 8080 = 11920 effectively (purchase subtracts).
    // Actually E(ts) for ts > purchase subtracts 8080. So at s2 timestamp,
    // E(s2) = 5000 + wishes*160 - 8080 ... can easily go negative delta.
    const purchases: PrimogemEntry[] = [
      makePurchase('2026-01-14T06:00:00.000Z', 8080, 'purchase'),
    ];
    // Many wishes in the Jan 13 period — mirrors the user's real data where
    // 385 wishes (61,600 primos of spending) greatly exceeds ~29k of purchases.
    // 100 wishes = 16,000 primos spending >> 8080 purchase.
    const wishes: WishRecord[] = Array.from({ length: 100 }, (_, i) =>
      makeWish(
        `2026-01-${String(15 + (i % 15)).padStart(2, '0')}T12:00:00.000Z`,
        'character',
        `w-${i}`,
      ),
    );
    const result = calculateIncomeRateTrend([s1, s2], wishes, purchases, true);

    // Find the Jan 13 banner period (starts 2026-01-13, 5 PM ET = Jan 13 22:00 UTC).
    const jan13 = result.find(r => r.periodStart === '2026-01-13');
    expect(jan13).toBeDefined();
    // Fallback signals it's estimated, not interpolated.
    expect(jan13!.hasSnapshotData).toBe(false);
    // Rate should reflect wish activity net of purchases (spending-purchases),
    // not the misleading 0 that a clamp-to-zero on negative delta would
    // produce, and not the inflated spending-only value that would ignore
    // the "exclude purchases" toggle.
    expect(jan13!.dailyRate).toBeGreaterThan(0);
    // Must be less than raw wish-spending rate (which would be 100*160/21 ≈ 762),
    // because 8080 of purchases are subtracted.
    const rawSpendingRate = (100 * 160) / 21;
    expect(jan13!.dailyRate).toBeLessThan(rawSpendingRate);
  });

  it('wish-based fallback respects excludePurchases toggle', () => {
    // Pre-snapshot period with wishes + in-period purchase. Excluding
    // purchases should subtract them from the wish-spending estimate;
    // including purchases should not.
    const s1 = makeSnapshot({
      id: 's1', timestamp: '2026-03-01T00:00:00.000Z', primogems: 1000,
    });
    // Period before s1: Feb 10 banner (Feb 10 → Mar 3). Put wishes and a
    // purchase inside this pre-snapshot period to exercise fallback.
    const wishes: WishRecord[] = Array.from({ length: 30 }, (_, i) =>
      makeWish(
        `2026-02-${String(15 + (i % 10)).padStart(2, '0')}T12:00:00.000Z`,
        'character',
        `w-${i}`,
      ),
    );
    const purchases: PrimogemEntry[] = [
      makePurchase('2026-02-20T12:00:00.000Z', 1600, 'purchase'),
    ];

    const excluded = calculateIncomeRateTrend([s1], wishes, purchases, true);
    const included = calculateIncomeRateTrend([s1], wishes, purchases, false);

    // Feb 3 banner period (Feb 3 → Feb 24) contains all the wishes and the
    // purchase. Find it by label/start so we don't accidentally match an
    // earlier empty pre-snapshot period.
    const feb3Excluded = excluded.find(r => r.periodStart === '2026-02-03');
    const feb3Included = included.find(r => r.periodStart === '2026-02-03');
    expect(feb3Excluded).toBeDefined();
    expect(feb3Included).toBeDefined();
    expect(feb3Excluded!.hasSnapshotData).toBe(false);
    expect(feb3Included!.hasSnapshotData).toBe(false);

    // Included: 30 wishes * 160 = 4800 primos of spending treated as income.
    // Excluded: 4800 - 1600 purchase = 3200 primos of "earned" income.
    // Including purchases ⇒ strictly higher rate than excluding.
    expect(feb3Included!.totalIncome).toBe(4800);
    expect(feb3Excluded!.totalIncome).toBe(3200);
    expect(feb3Included!.dailyRate).toBeGreaterThan(feb3Excluded!.dailyRate);
  });
});

