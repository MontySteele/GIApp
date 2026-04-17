import { parseISO, format, addDays, isBefore, isAfter, startOfDay, differenceInDays } from 'date-fns';
import type { ResourceSnapshot, WishRecord, PrimogemEntry, BannerType } from '@/types';
import { SPENDING_SOURCES } from './resourceCalculations';
import {
  addBannerPeriods,
  getBannerPeriodStart,
} from './bannerTime';

const PRIMOGEMS_PER_PULL = 160;

/**
 * Calculate the total primogem-equivalent value of a snapshot.
 * Includes primogems, genesis crystals (1:1 convertible to primos),
 * intertwined fates, and acquaint fates (160 primos each).
 *
 * Acquaint fates must be included because players can convert primogems
 * to acquaint fates. Without tracking them, those primos become an
 * unaccounted resource drain that makes the income formula go negative
 * when purchases are excluded.
 */
function snapshotTotal(snapshot: ResourceSnapshot): number {
  return snapshot.primogems
    + (snapshot.genesisCrystals ?? 0)
    + (snapshot.intertwined * PRIMOGEMS_PER_PULL)
    + ((snapshot.acquaint ?? 0) * PRIMOGEMS_PER_PULL);
}

/**
 * Banner types that use intertwined fates (cost primogems)
 * Standard banner uses acquaint fates which are obtained separately
 */
const INTERTWINED_FATE_BANNERS: BannerType[] = ['character', 'weapon', 'chronicled'];

/**
 * Filter wishes to only include those that cost primogems (intertwined fates)
 */
export function filterToIntertwinedWishes(wishes: WishRecord[]): WishRecord[] {
  return wishes.filter(w => INTERTWINED_FATE_BANNERS.includes(w.bannerType));
}

export interface HistoricalDataPoint {
  date: string;
  label: string;
  primogems: number;
  primogemsWithPurchases: number;
  isSnapshot: boolean;
  isToday: boolean;
  cumulativePulls: number;
  cumulativePurchases: number;
}

export interface ProjectionDataPoint {
  date: string;
  label: string;
  projected: number;
  projectedWithPurchases: number;
  isToday: boolean;
}

export interface ChartDataPoint {
  date: string;
  label: string;
  // Historical values (undefined for future dates)
  historical?: number;
  historicalWithPurchases?: number;
  // Projection values (undefined for past dates)
  projected?: number;
  projectedWithPurchases?: number;
  // Metadata
  isSnapshot: boolean;
  isToday: boolean;
  cumulativePulls: number;
  cumulativePurchases: number;
}

export interface TransactionLogEntry {
  id: string;
  date: string;
  type: 'snapshot' | 'purchase' | 'wish_spending' | 'cosmetic_spending';
  description: string;
  amount: number; // positive for gains, negative for spending
  notes?: string;
  // For editable entries
  editable: boolean;
  originalEntry?: PrimogemEntry | ResourceSnapshot | WishRecord[];
}

/** Filter entries to only non-wish spending (cosmetic, etc.) */
function filterSpendingEntries(entries: PrimogemEntry[]): PrimogemEntry[] {
  return entries.filter(e => SPENDING_SOURCES.includes(e.source));
}

/**
 * Build historical primogem data by working backwards from snapshots
 * and accounting for wish spending (each pull = 160 primos)
 */
export function buildHistoricalData(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  purchases: PrimogemEntry[],
  lookbackDays: number = 90
): HistoricalDataPoint[] {
  if (snapshots.length === 0) {
    // No snapshots - can't reconstruct history
    return [];
  }

  const now = startOfDay(new Date());
  const startDate = addDays(now, -lookbackDays);

  // Sort snapshots by date ascending
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Sort ALL wishes by date ascending (all banner types, since snapshot total includes acquaint fates)
  const sortedWishes = [...wishes].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Split purchases from spending entries.
  // Filter strictly to source==='purchase': the negated-cosmetic check previously included
  // wish_conversion (negative) entries, contaminating purchase totals on the same day.
  const purchaseOnlyEntries = purchases.filter(p => p.source === 'purchase');
  const spendingEntries = filterSpendingEntries(purchases);

  // Sort purchases by date ascending
  const sortedPurchases = [...purchaseOnlyEntries].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Build a map of daily wish counts
  const wishCountByDate = new Map<string, number>();
  for (const wish of sortedWishes) {
    const dateKey = format(parseISO(wish.timestamp), 'yyyy-MM-dd');
    wishCountByDate.set(dateKey, (wishCountByDate.get(dateKey) ?? 0) + 1);
  }

  // Build a map of daily purchase amounts (positive, genesis crystal purchases only)
  const purchaseByDate = new Map<string, number>();
  for (const purchase of sortedPurchases) {
    const dateKey = format(parseISO(purchase.timestamp), 'yyyy-MM-dd');
    purchaseByDate.set(dateKey, (purchaseByDate.get(dateKey) ?? 0) + purchase.amount);
  }

  // Build a map of daily cosmetic spending amounts (negative values)
  const cosmeticSpendByDate = new Map<string, number>();
  for (const entry of spendingEntries) {
    const dateKey = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
    cosmeticSpendByDate.set(dateKey, (cosmeticSpendByDate.get(dateKey) ?? 0) + entry.amount);
  }

  // Build snapshot lookup by date
  const snapshotByDate = new Map<string, ResourceSnapshot>();
  for (const snapshot of sortedSnapshots) {
    const dateKey = format(parseISO(snapshot.timestamp), 'yyyy-MM-dd');
    snapshotByDate.set(dateKey, snapshot);
  }

  const result: HistoricalDataPoint[] = [];

  // Find the most recent and oldest snapshots
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const oldestSnapshot = sortedSnapshots[0];
  if (!latestSnapshot || !oldestSnapshot) return [];

  const latestSnapshotDate = startOfDay(parseISO(latestSnapshot.timestamp));
  const oldestSnapshotDate = startOfDay(parseISO(oldestSnapshot.timestamp));

  // Only go back to oldest snapshot (we can't reconstruct before we have ground truth data)
  // But also respect the lookback limit if it's more recent than the oldest snapshot
  const effectiveStartDate = isBefore(oldestSnapshotDate, startDate) ? startDate : oldestSnapshotDate;

  // Work backwards from latest snapshot
  // Include intertwined fates as primogem-equivalent to avoid dips when converting primos to fates
  const latestSnapshotTotal = snapshotTotal(latestSnapshot);
  let currentPrimogems = latestSnapshotTotal;
  let currentPrimogemsWithPurchases = latestSnapshotTotal;
  let cumulativePulls = 0;
  let cumulativePurchases = 0;

  // Calculate total purchases up to latest snapshot
  for (const purchase of sortedPurchases) {
    const purchaseDate = parseISO(purchase.timestamp);
    if (!isAfter(purchaseDate, latestSnapshotDate)) {
      cumulativePurchases += purchase.amount;
    }
  }

  // First, build data from latest snapshot forward to today
  let currentDate = latestSnapshotDate;
  while (!isAfter(currentDate, now)) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const isToday = differenceInDays(now, currentDate) === 0;

    // Check if there's a snapshot on this date
    const snapshotOnDate = snapshotByDate.get(dateKey);
    if (snapshotOnDate && !isBefore(currentDate, latestSnapshotDate)) {
      // Use snapshot value directly (include intertwined fates as primogem-equivalent)
      // The snapshot is ground truth and already reflects any wishes made before it was taken
      const snapTotal = snapshotTotal(snapshotOnDate);
      currentPrimogems = snapTotal;
      currentPrimogemsWithPurchases = snapTotal;
    }

    // Apply wish spending for the day - but only if there's no snapshot
    // (snapshots already reflect spending that occurred before they were taken)
    const wishesToday = wishCountByDate.get(dateKey) ?? 0;
    if (wishesToday > 0) {
      cumulativePulls += wishesToday;
      if (!snapshotOnDate) {
        currentPrimogems -= wishesToday * PRIMOGEMS_PER_PULL;
        currentPrimogemsWithPurchases -= wishesToday * PRIMOGEMS_PER_PULL;
      }
    }

    // Apply cosmetic spending for the day (negative values reduce primogems)
    // Only apply if no snapshot (snapshot already reflects spending before it was taken)
    const cosmeticToday = cosmeticSpendByDate.get(dateKey) ?? 0;
    if (cosmeticToday !== 0 && isAfter(currentDate, latestSnapshotDate) && !snapshotOnDate) {
      currentPrimogems += cosmeticToday; // cosmeticToday is negative
      currentPrimogemsWithPurchases += cosmeticToday;
    }

    // Apply purchases for the day (only affects "with purchases" line)
    // Only apply if no snapshot (snapshot already reflects purchases before it was taken)
    const purchasesToday = purchaseByDate.get(dateKey) ?? 0;
    if (purchasesToday > 0 && isAfter(currentDate, latestSnapshotDate) && !snapshotOnDate) {
      cumulativePurchases += purchasesToday;
      currentPrimogemsWithPurchases += purchasesToday;
    }

    result.push({
      date: dateKey,
      label: format(currentDate, 'MMM d'),
      primogems: Math.max(0, currentPrimogems),
      primogemsWithPurchases: Math.max(0, currentPrimogemsWithPurchases),
      isSnapshot: !!snapshotOnDate,
      isToday,
      cumulativePulls,
      cumulativePurchases,
    });

    currentDate = addDays(currentDate, 1);
  }

  // Now work backwards from latest snapshot to fill in historical data
  currentDate = addDays(latestSnapshotDate, -1);
  currentPrimogems = latestSnapshotTotal;
  currentPrimogemsWithPurchases = latestSnapshotTotal;

  const historicalData: HistoricalDataPoint[] = [];

  while (!isBefore(currentDate, effectiveStartDate)) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');
    const nextDay = addDays(currentDate, 1);
    const nextDayKey = format(nextDay, 'yyyy-MM-dd');
    const nextDayHasSnapshot = snapshotByDate.has(nextDayKey);

    // Check for snapshot on this date
    const snapshotOnDate = snapshotByDate.get(dateKey);
    if (snapshotOnDate) {
      // Include intertwined fates as primogem-equivalent
      const snapTotal = snapshotTotal(snapshotOnDate);
      currentPrimogems = snapTotal;
      currentPrimogemsWithPurchases = snapTotal;
    } else {
      // Work backwards: add back wishes that were spent the next day
      // But only if next day doesn't have a snapshot (snapshots are ground truth)
      if (!nextDayHasSnapshot) {
        const wishesNextDay = wishCountByDate.get(nextDayKey) ?? 0;
        if (wishesNextDay > 0) {
          currentPrimogems += wishesNextDay * PRIMOGEMS_PER_PULL;
          currentPrimogemsWithPurchases += wishesNextDay * PRIMOGEMS_PER_PULL;
        }

        // Add back cosmetic spending from the next day (reverse the negative)
        const cosmeticNextDay = cosmeticSpendByDate.get(nextDayKey) ?? 0;
        if (cosmeticNextDay !== 0) {
          currentPrimogems -= cosmeticNextDay; // cosmeticNextDay is negative, so subtracting adds back
          currentPrimogemsWithPurchases -= cosmeticNextDay;
        }

        // Subtract purchases that were made the next day
        const purchasesNextDay = purchaseByDate.get(nextDayKey) ?? 0;
        if (purchasesNextDay > 0) {
          currentPrimogemsWithPurchases -= purchasesNextDay;
        }
      }
    }

    // Count cumulative data up to this date
    let pullsToDate = 0;
    let purchasesToDate = 0;

    for (const wish of sortedWishes) {
      if (!isAfter(parseISO(wish.timestamp), currentDate)) {
        pullsToDate++;
      }
    }

    for (const purchase of sortedPurchases) {
      if (!isAfter(parseISO(purchase.timestamp), currentDate)) {
        purchasesToDate += purchase.amount;
      }
    }

    historicalData.unshift({
      date: dateKey,
      label: format(currentDate, 'MMM d'),
      primogems: Math.max(0, currentPrimogems),
      primogemsWithPurchases: Math.max(0, currentPrimogemsWithPurchases),
      isSnapshot: !!snapshotOnDate,
      isToday: false,
      cumulativePulls: pullsToDate,
      cumulativePurchases: purchasesToDate,
    });

    currentDate = addDays(currentDate, -1);
  }

  // Combine historical (before snapshot) + forward (from snapshot)
  return [...historicalData, ...result];
}

/**
 * Build forward projection data
 */
export function buildProjectionData(
  currentPrimogems: number,
  dailyRate: number,
  projectionDays: number,
  _includePurchases: boolean = true
): ProjectionDataPoint[] {
  const now = new Date();
  const result: ProjectionDataPoint[] = [];

  for (let i = 0; i <= projectionDays; i++) {
    const date = addDays(now, i);
    const projectedValue = currentPrimogems + dailyRate * i;

    result.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM d'),
      projected: Math.max(0, projectedValue),
      projectedWithPurchases: Math.max(0, projectedValue),
      isToday: i === 0,
    });
  }

  return result;
}

/**
 * Build unified chart data combining historical and projection
 */
export function buildUnifiedChartData(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  purchases: PrimogemEntry[],
  dailyRate: number,
  lookbackDays: number = 90,
  projectionDays: number = 60
): ChartDataPoint[] {
  const historical = buildHistoricalData(snapshots, wishes, purchases, lookbackDays);

  // Get current primogems from latest historical point
  const latestHistorical = historical[historical.length - 1];
  const currentPrimogems = latestHistorical?.primogems ?? 0;
  const currentPrimogemsWithPurchases = latestHistorical?.primogemsWithPurchases ?? 0;

  const result: ChartDataPoint[] = [];

  // Add historical data
  for (const h of historical) {
    result.push({
      date: h.date,
      label: h.label,
      historical: h.primogems,
      historicalWithPurchases: h.primogemsWithPurchases,
      isSnapshot: h.isSnapshot,
      isToday: h.isToday,
      cumulativePulls: h.cumulativePulls,
      cumulativePurchases: h.cumulativePurchases,
    });
  }

  // Add projection data (skip today as it's already in historical)
  const now = new Date();
  for (let i = 1; i <= projectionDays; i++) {
    const date = addDays(now, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    result.push({
      date: dateKey,
      label: format(date, 'MMM d'),
      projected: Math.max(0, currentPrimogems + dailyRate * i),
      projectedWithPurchases: Math.max(0, currentPrimogemsWithPurchases + dailyRate * i),
      isSnapshot: false,
      isToday: false,
      cumulativePulls: latestHistorical?.cumulativePulls ?? 0,
      cumulativePurchases: latestHistorical?.cumulativePurchases ?? 0,
    });
  }

  return result;
}

/**
 * Build transaction log entries
 */
export function buildTransactionLog(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  purchases: PrimogemEntry[]
): TransactionLogEntry[] {
  const entries: TransactionLogEntry[] = [];

  // Add snapshots
  for (const snapshot of snapshots) {
    entries.push({
      id: `snapshot-${snapshot.id}`,
      date: snapshot.timestamp,
      type: 'snapshot',
      description: `Resource snapshot: ${snapshot.primogems.toLocaleString()} primogems`,
      amount: snapshot.primogems,
      editable: false,
      originalEntry: snapshot,
    });
  }

  // Add purchases and cosmetic spending
  for (const purchase of purchases) {
    const isSpending = SPENDING_SOURCES.includes(purchase.source);
    entries.push({
      id: `${isSpending ? 'cosmetic' : 'purchase'}-${purchase.id}`,
      date: purchase.timestamp,
      type: isSpending ? 'cosmetic_spending' : 'purchase',
      description: isSpending
        ? `Spent ${Math.abs(purchase.amount).toLocaleString()} primogems (cosmetic)`
        : `Purchased ${purchase.amount.toLocaleString()} primogems`,
      amount: purchase.amount,
      notes: purchase.notes,
      editable: true,
      originalEntry: purchase,
    });
  }

  // Group wishes by day and add as spending events
  // Only include intertwined fate banners (standard banner uses acquaint fates)
  const intertwinedWishes = filterToIntertwinedWishes(wishes);
  const wishesByDay = new Map<string, WishRecord[]>();
  for (const wish of intertwinedWishes) {
    const dateKey = format(parseISO(wish.timestamp), 'yyyy-MM-dd');
    const existing = wishesByDay.get(dateKey) ?? [];
    existing.push(wish);
    wishesByDay.set(dateKey, existing);
  }

  for (const [dateKey, dayWishes] of wishesByDay) {
    const pullCount = dayWishes.length;
    const primogemSpent = pullCount * PRIMOGEMS_PER_PULL;
    const fiveStars = dayWishes.filter(w => w.rarity === 5).length;
    const fourStars = dayWishes.filter(w => w.rarity === 4).length;

    let description = `Spent ${primogemSpent.toLocaleString()} primogems (${pullCount} pulls)`;
    if (fiveStars > 0 || fourStars > 0) {
      const results: string[] = [];
      if (fiveStars > 0) results.push(`${fiveStars}x 5★`);
      if (fourStars > 0) results.push(`${fourStars}x 4★`);
      description += ` → ${results.join(', ')}`;
    }

    entries.push({
      id: `wishes-${dateKey}`,
      date: `${dateKey}T12:00:00.000Z`, // Use noon for sorting
      type: 'wish_spending',
      description,
      amount: -primogemSpent,
      editable: false,
      originalEntry: dayWishes,
    });
  }

  // Sort by date descending (most recent first)
  entries.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return entries;
}

/**
 * Calculate daily income rate from snapshots and wish spending
 * This is more accurate than wish-based calculation because it measures actual income:
 * Income = (newer_snapshot - older_snapshot) + (pulls_between * 160) - purchases_between
 */
export function calculateDailyRateFromSnapshots(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  lookbackDays: number = 30,
  purchases: PrimogemEntry[] = [],
  excludePurchases: boolean = true
): number {
  if (snapshots.length < 2) return 0;

  const now = new Date();
  const cutoffDate = addDays(now, -lookbackDays);

  // Sort snapshots by date ascending
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Filter to snapshots within the lookback window (or the two most recent if none in window)
  const recentSnapshots = sortedSnapshots.filter(s => isAfter(parseISO(s.timestamp), cutoffDate));

  // Need at least 2 snapshots to calculate a rate
  let snapshotsToUse: ResourceSnapshot[];
  if (recentSnapshots.length >= 2) {
    snapshotsToUse = recentSnapshots;
  } else if (sortedSnapshots.length >= 2) {
    // Use the two most recent snapshots even if outside lookback window
    snapshotsToUse = sortedSnapshots.slice(-2);
  } else {
    return 0;
  }

  // Calculate total income from first to last snapshot in the window
  // This is more accurate than summing consecutive pairs, which can have rounding issues
  const firstSnapshot = snapshotsToUse[0];
  const lastSnapshot = snapshotsToUse[snapshotsToUse.length - 1];

  if (!firstSnapshot || !lastSnapshot || firstSnapshot === lastSnapshot) return 0;

  // Use startOfDay to ensure consistent day counting regardless of snapshot time
  const firstDate = startOfDay(parseISO(firstSnapshot.timestamp));
  const lastDate = startOfDay(parseISO(lastSnapshot.timestamp));

  const totalDays = differenceInDays(lastDate, firstDate);

  if (totalDays <= 0) return 0;

  // Calculate total resources at each snapshot (primogems + genesis crystals + all fates as primogem-equivalent)
  const firstTotal = snapshotTotal(firstSnapshot);
  const lastTotal = snapshotTotal(lastSnapshot);

  // Count ALL pulls (all banner types) made between first and last snapshot.
  // Must include standard/acquaint wishes because snapshot total includes acquaint fates;
  // without adding back acquaint wish spending, those fates disappearing would look like lost income.
  const dayAfterLast = addDays(lastDate, 1);
  const pullsBetween = wishes.filter(w => {
    const wishDate = parseISO(w.timestamp);
    return !isBefore(wishDate, firstDate) && isBefore(wishDate, dayAfterLast);
  }).length;

  // Count purchases between snapshots (purchases inflate snapshot values but aren't earned income).
  // Filter strictly to source==='purchase': the previous "!cosmetic" filter accidentally captured
  // other entries like wish_conversion whose negative amounts made the excluded rate exceed the
  // included rate.
  const purchasesBetween = excludePurchases ? purchases.filter(p => {
    const purchaseDate = parseISO(p.timestamp);
    return p.source === 'purchase' &&
      !isBefore(purchaseDate, firstDate) && isBefore(purchaseDate, dayAfterLast);
  }).reduce((sum, p) => sum + p.amount, 0) : 0;

  // Count non-wish spending between snapshots (cosmetic purchases reduce snapshot value but aren't negative income)
  const nonWishSpendingBetween = filterSpendingEntries(purchases).filter(p => {
    const spendDate = parseISO(p.timestamp);
    return !isBefore(spendDate, firstDate) && isBefore(spendDate, dayAfterLast);
  }).reduce((sum, p) => sum + p.amount, 0); // negative total

  // Income = change in resources + wish spending + non-wish spending (add back) - purchases
  // nonWishSpendingBetween is negative, so subtracting it adds the amount back
  // Clamp to 0: income can never be negative in practice. A negative value indicates
  // data inconsistency (e.g., wish history not re-imported after a wishing session,
  // or unconverted genesis crystals). Showing 0 is more accurate than a negative rate.
  const totalIncome = Math.max(0, (lastTotal - firstTotal) + (pullsBetween * PRIMOGEMS_PER_PULL) - nonWishSpendingBetween - purchasesBetween);

  // When excluding purchases, earned income can't be negative. A negative value means
  // there's untracked non-wish spending (e.g., outfits bought with genesis crystals but not logged).
  // Floor at 0 since negative "earned income" is nonsensical.
  const adjustedIncome = excludePurchases ? Math.max(0, totalIncome) : totalIncome;

  return adjustedIncome / totalDays;
}

/**
 * Calculate daily income rate from wish history (fallback method)
 * Only counts intertwined fate banners (character/weapon/chronicled) since standard uses acquaint fates
 * Note: This assumes pulls ≈ income, which is only accurate if the user spends consistently
 */
export function calculateDailyRateFromWishes(
  wishes: WishRecord[],
  lookbackDays: number = 30
): number {
  // Only count intertwined fate wishes (standard banner uses acquaint fates, not primogems)
  const intertwinedWishes = filterToIntertwinedWishes(wishes);

  if (intertwinedWishes.length === 0) return 0;

  const now = new Date();
  const cutoffDate = addDays(now, -lookbackDays);

  const recentWishes = intertwinedWishes.filter(w => isAfter(parseISO(w.timestamp), cutoffDate));

  if (recentWishes.length === 0) return 0;

  // Use the full lookback period as denominator for consistent rate calculation
  // This gives a more accurate daily average over the specified period
  const totalPrimogems = recentWishes.length * PRIMOGEMS_PER_PULL;

  return totalPrimogems / lookbackDays;
}

/**
 * Data point for income rate trend over time
 */
export interface IncomeRateDataPoint {
  periodStart: string;
  periodEnd: string;
  label: string;
  dailyRate: number;
  totalIncome: number;
  days: number;
  hasSnapshotData: boolean; // true if calculated from snapshots, false if estimated from wishes
  /**
   * Diagnostic breakdown of the conservation-equation inputs that produced
   * `totalIncome`. Populated when `hasSnapshotData` is true; otherwise
   * undefined.
   *
   * With period-boundary interpolation, the "span" is the banner period itself
   * (fractional days for a still-running final period). The `startTotal` /
   * `endTotal` values are the interpolated cumulative-earned function at the
   * exact period boundaries (5 PM ET cutoffs), and `startSnapshotDate` /
   * `endSnapshotDate` are the nearest actual snapshots used to bracket each
   * boundary — surfaced so users can trace which data drove the estimate.
   *
   * Conservation identity (within the period):
   *   totalIncome = (endTotal - startTotal) + purchasesInPeriod   (if included)
   *   totalIncome = (endTotal - startTotal)                       (if excluded)
   * Where the E() delta internally absorbs wishes (+pulls*160), cosmetic
   * spending (+|cosmetic|), and purchases (−purchases) that occurred before
   * each boundary.
   */
  diagnostics?: {
    startSnapshotDate: string;
    endSnapshotDate: string;
    startTotal: number; // interpolated E(periodStart)
    endTotal: number; // interpolated E(periodEnd)
    snapshotDelta: number; // endTotal - startTotal (= earned in period, excl. purchases)
    wishesBetween: number; // wish count strictly within the period
    wishPrimosBetween: number; // wishesBetween * 160
    cosmeticRecovered: number; // cosmetic spent within the period (positive)
    purchasesExcluded: number; // purchase inflow within the period (0 when including)
    spanDays: number; // exact days of the period (may be fractional for partial periods)
    spanIncome: number; // total income attributed to the period (clamped ≥ 0 when excluding)
    spanRate: number; // spanIncome / spanDays
  };
  /**
   * Tie-back breakdown for wish-based fallback periods (hasSnapshotData=false).
   * Shows the spending-as-income estimate: `wishPrimos - purchases` (when
   * excluding) or `wishPrimos` (when including). Mutually exclusive with
   * `diagnostics` — only one of the two is populated per period.
   */
  estimate?: {
    wishesInPeriod: number; // intertwined-fate wishes in the effective window
    wishPrimos: number; // wishesInPeriod * 160
    purchasesInPeriod: number; // purchase primos in the effective window
    estimatedIncome: number; // what was attributed as income (matches totalIncome)
    effectiveDays: number; // days in the clipped data window
  };
}

/**
 * Account start date for income estimation when no snapshots exist
 * This is used to estimate minimum income from wish history
 */
export const ACCOUNT_START_DATE = '2025-10-29';

/**
 * Cumulative "earned" function anchored at a snapshot. Invariant:
 *   earned(t) = snapshotTotal(t) + pullsBefore(t)*160 + |cosmeticBefore(t)| - purchasesBefore(t)
 * Because `snapshotTotal` already reflects the impact of wishes (fates consumed),
 * purchases (primos gained), and cosmetic spending (primos drained), rearranging
 * the conservation equation yields this value, which represents the total primos
 * earned (not purchased) from account-start through time `t`. Linear interpolation
 * between two such points gives a well-defined "earned" value at any instant.
 */
interface EarnedAtPoint {
  time: number; // ms since epoch
  earned: number;
}

function buildEarnedAtPoints(
  sortedSnapshots: ResourceSnapshot[],
  sortedAllWishes: WishRecord[],
  sortedPurchases: PrimogemEntry[],
): EarnedAtPoint[] {
  // Pre-extract timestamps once to avoid repeated parseISO calls.
  const wishTimes = sortedAllWishes.map(w => parseISO(w.timestamp).getTime());
  const purchaseEntries = sortedPurchases.map(p => ({
    t: parseISO(p.timestamp).getTime(),
    amount: p.amount,
    source: p.source,
  }));

  return sortedSnapshots.map(s => {
    const t = parseISO(s.timestamp).getTime();
    // Count wishes at or before this snapshot (sorted, so we could binary-search;
    // snapshot counts are small in practice so a linear scan is fine).
    let wishCount = 0;
    for (const wt of wishTimes) {
      if (wt <= t) wishCount++;
      else break;
    }
    let cosmeticSum = 0; // negative total
    let purchaseSum = 0; // positive total
    for (const p of purchaseEntries) {
      if (p.t > t) break;
      if (SPENDING_SOURCES.includes(p.source)) cosmeticSum += p.amount;
      else if (p.source === 'purchase') purchaseSum += p.amount;
    }
    const earned = snapshotTotal(s) + wishCount * PRIMOGEMS_PER_PULL - cosmeticSum - purchaseSum;
    return { time: t, earned };
  });
}

/**
 * Linear-interpolate the cumulative earned function at time `t`.
 *   - Between two points: true linear interp.
 *   - Before first / after last: extrapolate using the adjacent segment's rate.
 * Returns null when fewer than 2 points are available (can't establish a rate).
 */
function interpolateEarnedAt(points: EarnedAtPoint[], t: number): number | null {
  if (points.length < 2) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (t <= first.time) {
    const p2 = points[1]!;
    const rate = (p2.earned - first.earned) / (p2.time - first.time);
    return first.earned + rate * (t - first.time);
  }
  if (t >= last.time) {
    const p1 = points[points.length - 2]!;
    const rate = (last.earned - p1.earned) / (last.time - p1.time);
    return last.earned + rate * (t - last.time);
  }
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]!;
    if (curr.time >= t) {
      const prev = points[i - 1]!;
      const frac = (t - prev.time) / (curr.time - prev.time);
      return prev.earned + frac * (curr.earned - prev.earned);
    }
  }
  return null;
}

/** Find the snapshot immediately at or before time `t`. */
function bracketSnapshotBefore(
  snapshots: ResourceSnapshot[],
  t: number,
): ResourceSnapshot | undefined {
  let result: ResourceSnapshot | undefined;
  for (const s of snapshots) {
    if (parseISO(s.timestamp).getTime() <= t) result = s;
    else break;
  }
  return result;
}

/** Find the snapshot immediately at or after time `t`. */
function bracketSnapshotAfter(
  snapshots: ResourceSnapshot[],
  t: number,
): ResourceSnapshot | undefined {
  for (const s of snapshots) {
    if (parseISO(s.timestamp).getTime() >= t) return s;
  }
  return undefined;
}

/**
 * Calculate income rate trend over banner periods (21 days each)
 * Uses snapshots when available, otherwise estimates from wish spending
 */
export function calculateIncomeRateTrend(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  purchases: PrimogemEntry[] = [],
  excludePurchases: boolean = true,
): IncomeRateDataPoint[] {
  const intertwinedWishes = filterToIntertwinedWishes(wishes);

  if (intertwinedWishes.length === 0 && snapshots.length === 0) {
    return [];
  }

  // Sort snapshots and wishes by date
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );
  // Intertwined-only wishes for the fallback estimation (standard wishes don't cost primos)
  const sortedIntertwinedWishes = [...intertwinedWishes].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );
  // ALL wishes for snapshot-based calculation (total includes acquaint fates, so we must
  // add back acquaint wish spending too, otherwise those fates look like lost income)
  const sortedAllWishes = [...wishes].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );
  const sortedPurchases = [...purchases].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Determine date range
  const accountStart = parseISO(ACCOUNT_START_DATE);
  const now = new Date();

  // Find earliest date from wishes or snapshots
  const firstWishDate = sortedAllWishes[0] ? parseISO(sortedAllWishes[0].timestamp) : null;
  const firstSnapshotDate = sortedSnapshots[0] ? parseISO(sortedSnapshots[0].timestamp) : null;

  let startDate = accountStart;
  if (firstWishDate && isBefore(firstWishDate, startDate)) {
    startDate = firstWishDate;
  }
  if (firstSnapshotDate && isBefore(firstSnapshotDate, startDate)) {
    startDate = firstSnapshotDate;
  }

  // Precompute the cumulative earned function anchored at each snapshot.
  // This lets us linearly interpolate "earned" at any instant (including exact
  // banner cutoffs, which are NOT midnight but 5 PM ET).
  const earnedPoints = buildEarnedAtPoints(sortedSnapshots, sortedAllWishes, sortedPurchases);
  // Bounds of the snapshot data. We only use interpolation when the period is
  // actually bracketed by snapshots — extrapolating *backward* before the first
  // snapshot is unreliable (the rate between the earliest two snapshots does
  // not reflect what the user was earning months earlier). Forward extrapolation
  // past the last snapshot IS allowed so the currently-running period can still
  // use snapshot data.
  const firstSnapshotTime = earnedPoints[0]?.time ?? null;

  // Generate banner periods from start to now. Period starts/ends are exact UTC
  // instants corresponding to 5 PM ET on the patch day (DST-aware).
  const result: IncomeRateDataPoint[] = [];
  let periodStart = getBannerPeriodStart(startDate);

  while (isBefore(periodStart, now)) {
    const periodEnd = addBannerPeriods(periodStart, 1);
    const actualPeriodEnd = isAfter(periodEnd, now) ? now : periodEnd;
    const days = (actualPeriodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000);

    if (days <= 0) {
      periodStart = periodEnd;
      continue;
    }

    // First period edge case: the user's earliest data point (first wish/
    // snapshot) may fall partway through the banner window. Without clipping,
    // we'd divide a partial wish count by the full 21-day period and report a
    // deceptively low rate. Use the later of the period start and startDate
    // so the fallback rate reflects the actual data window.
    const effectivePeriodStart = isBefore(periodStart, startDate) ? startDate : periodStart;
    const effectiveDays =
      (actualPeriodEnd.getTime() - effectivePeriodStart.getTime()) / (24 * 60 * 60 * 1000);

    // Count intertwined wishes in this period (for fallback estimation; standard
    // banner wishes don't cost primos so aren't valid income proxies).
    const intertwinedInPeriod = sortedIntertwinedWishes.filter(w => {
      const wDate = parseISO(w.timestamp);
      return !isBefore(wDate, effectivePeriodStart) && isBefore(wDate, actualPeriodEnd);
    });
    const spendingInPeriod = intertwinedInPeriod.length * PRIMOGEMS_PER_PULL;

    // Purchases that occurred strictly within this period [start, end). Needed
    // for both the interpolation branch (where E() already subtracts them) and
    // the wish-based fallback (where we must subtract them from the spending
    // estimate when "exclude purchases" is active — otherwise purchase-funded
    // wishes would be counted as earned income).
    const purchasesInPeriodAll = sortedPurchases
      .filter(p => {
        if (p.source !== 'purchase') return false;
        const t = parseISO(p.timestamp).getTime();
        return t >= effectivePeriodStart.getTime() && t < actualPeriodEnd.getTime();
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Interpolate the cumulative earned function at the exact period boundaries.
    // This is the CORE of the income calculation: earned(period) = E(end) - E(start).
    // Purchases/wishes/cosmetic spending that happen outside the period no longer
    // bleed into the rate because they're absorbed into the E() values at the
    // times they actually occurred.
    //
    // Only use interpolation when periodStart is AT or AFTER the first snapshot.
    // For periods before (or straddling) the first snapshot, extrapolating the
    // nearest segment's rate backwards across months produces wildly wrong
    // results (especially when the first two snapshots are close together and
    // reflect an unusually high or low earning slice). Fall back to wish-based
    // estimation for those periods instead.
    const canInterpolate =
      firstSnapshotTime !== null && periodStart.getTime() >= firstSnapshotTime;
    const earnedAtStart = canInterpolate
      ? interpolateEarnedAt(earnedPoints, periodStart.getTime())
      : null;
    const earnedAtEnd = canInterpolate
      ? interpolateEarnedAt(earnedPoints, actualPeriodEnd.getTime())
      : null;

    let totalIncome: number;
    let hasSnapshotData: boolean;
    let diagnostics: IncomeRateDataPoint['diagnostics'];
    let estimate: IncomeRateDataPoint['estimate'];

    // Earned-in-period via E() delta — only trustworthy when non-negative.
    // E() is mathematically monotonic (earned primos only accumulate), so a
    // negative delta means the underlying data is inconsistent. A common cause:
    // purchase records timestamped AFTER the first snapshot even though those
    // primos were already absorbed into snapshotTotal(s1). That inflates E(s1)
    // and makes subsequent periods look like they lost primos. We detect this
    // and fall back to wish-based estimation rather than showing a misleading 0.
    const earnedInPeriodRaw =
      earnedAtStart !== null && earnedAtEnd !== null ? earnedAtEnd - earnedAtStart : null;
    const interpolationReliable = earnedInPeriodRaw !== null && earnedInPeriodRaw >= 0;

    if (interpolationReliable && earnedAtStart !== null && earnedAtEnd !== null) {
      const earnedInPeriod = earnedInPeriodRaw!;
      const purchasesInPeriod = purchasesInPeriodAll;

      // Cosmetic spending (stored as negative) within the period — used for the
      // diagnostic breakdown so users can audit the conservation equation.
      const cosmeticInPeriod = sortedPurchases
        .filter(p => {
          if (!SPENDING_SOURCES.includes(p.source)) return false;
          const t = parseISO(p.timestamp).getTime();
          return t >= periodStart.getTime() && t < actualPeriodEnd.getTime();
        })
        .reduce((sum, p) => sum + p.amount, 0); // negative

      // Wishes (all banner types) within the period, for diagnostics.
      const wishesInPeriod = sortedAllWishes.filter(w => {
        const t = parseISO(w.timestamp).getTime();
        return t >= periodStart.getTime() && t < actualPeriodEnd.getTime();
      }).length;

      // Income = earned + (optionally) purchases. E() already subtracts purchases,
      // so to include them we add them back.
      totalIncome = excludePurchases ? earnedInPeriod : earnedInPeriod + purchasesInPeriod;
      hasSnapshotData = true;

      // For diagnostics we surface the bracketing snapshots so the user can see
      // which data points drove the interpolation.
      const bracketBefore = bracketSnapshotBefore(sortedSnapshots, periodStart.getTime());
      const bracketAfter = bracketSnapshotAfter(sortedSnapshots, actualPeriodEnd.getTime());
      const startBracket = bracketBefore ?? sortedSnapshots[0];
      const endBracket = bracketAfter ?? sortedSnapshots[sortedSnapshots.length - 1];
      diagnostics = {
        startSnapshotDate: startBracket ? format(parseISO(startBracket.timestamp), 'yyyy-MM-dd') : '',
        endSnapshotDate: endBracket ? format(parseISO(endBracket.timestamp), 'yyyy-MM-dd') : '',
        startTotal: Math.round(earnedAtStart),
        endTotal: Math.round(earnedAtEnd),
        snapshotDelta: Math.round(earnedAtEnd - earnedAtStart),
        wishesBetween: wishesInPeriod,
        wishPrimosBetween: wishesInPeriod * PRIMOGEMS_PER_PULL,
        cosmeticRecovered: -cosmeticInPeriod, // flip negative → positive
        purchasesExcluded: excludePurchases ? purchasesInPeriod : 0,
        spanDays: days,
        spanIncome: Math.round(Math.max(0, totalIncome)),
        spanRate: Math.max(0, totalIncome) / days,
      };
    } else {
      // No reliable snapshot data for this period (either no bracketing
      // snapshots, or a negative interpolated delta indicating data
      // inconsistency). Estimate from wish spending: this assumes the user is
      // spending roughly what they earn, which is the same heuristic we use
      // for pre-snapshot periods.
      //
      // When excluding purchases, subtract in-period purchases: if the user
      // bought primos during this period, some of those pulls were
      // purchase-funded rather than earned. Clamp at 0 since purchase-funded
      // pulls beyond what was earned don't make earned income go negative.
      totalIncome = excludePurchases
        ? Math.max(0, spendingInPeriod - purchasesInPeriodAll)
        : spendingInPeriod;
      hasSnapshotData = false;
      estimate = {
        wishesInPeriod: intertwinedInPeriod.length,
        wishPrimos: spendingInPeriod,
        purchasesInPeriod: purchasesInPeriodAll,
        estimatedIncome: Math.round(Math.max(0, totalIncome)),
        effectiveDays,
      };
    }

    // When excluding purchases, earned income can't be negative. A negative value
    // means there's untracked non-wish spending (e.g., outfits bought with genesis
    // crystals but not logged).
    const adjustedIncome = excludePurchases ? Math.max(0, totalIncome) : totalIncome;
    // Use effectiveDays (clipped at startDate for the first period) so rates
    // aren't diluted when the user's earliest data point falls mid-period.
    // For all other periods effectiveDays === days.
    const dailyRate = effectiveDays > 0 ? adjustedIncome / effectiveDays : 0;

    result.push({
      periodStart: format(periodStart, 'yyyy-MM-dd'),
      periodEnd: format(actualPeriodEnd, 'yyyy-MM-dd'),
      label: format(periodStart, 'MMM d'),
      dailyRate: Math.round(dailyRate),
      totalIncome: Math.round(adjustedIncome),
      days: effectiveDays,
      hasSnapshotData,
      diagnostics,
      estimate,
    });

    periodStart = periodEnd;
  }

  return result;
}
