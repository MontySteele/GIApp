import { parseISO, format, addDays, isBefore, isAfter, startOfDay, differenceInDays } from 'date-fns';
import type { ResourceSnapshot, WishRecord, PrimogemEntry, BannerType } from '@/types';

const PRIMOGEMS_PER_PULL = 160;

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
  type: 'snapshot' | 'purchase' | 'wish_spending';
  description: string;
  amount: number; // positive for gains, negative for spending
  notes?: string;
  // For editable entries
  editable: boolean;
  originalEntry?: PrimogemEntry | ResourceSnapshot | WishRecord[];
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

  // Sort wishes by date ascending - only include intertwined fate banners (cost primogems)
  const intertwinedWishes = filterToIntertwinedWishes(wishes);
  const sortedWishes = [...intertwinedWishes].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Sort purchases by date ascending
  const sortedPurchases = [...purchases].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Build a map of daily wish counts
  const wishCountByDate = new Map<string, number>();
  for (const wish of sortedWishes) {
    const dateKey = format(parseISO(wish.timestamp), 'yyyy-MM-dd');
    wishCountByDate.set(dateKey, (wishCountByDate.get(dateKey) ?? 0) + 1);
  }

  // Build a map of daily purchase amounts
  const purchaseByDate = new Map<string, number>();
  for (const purchase of sortedPurchases) {
    const dateKey = format(parseISO(purchase.timestamp), 'yyyy-MM-dd');
    purchaseByDate.set(dateKey, (purchaseByDate.get(dateKey) ?? 0) + purchase.amount);
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
  const latestSnapshotTotal = latestSnapshot.primogems + (latestSnapshot.intertwined * PRIMOGEMS_PER_PULL);
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
      const snapshotTotal = snapshotOnDate.primogems + (snapshotOnDate.intertwined * PRIMOGEMS_PER_PULL);
      currentPrimogems = snapshotTotal;
      currentPrimogemsWithPurchases = snapshotTotal;
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
      const snapshotTotal = snapshotOnDate.primogems + (snapshotOnDate.intertwined * PRIMOGEMS_PER_PULL);
      currentPrimogems = snapshotTotal;
      currentPrimogemsWithPurchases = snapshotTotal;
    } else {
      // Work backwards: add back wishes that were spent the next day
      // But only if next day doesn't have a snapshot (snapshots are ground truth)
      if (!nextDayHasSnapshot) {
        const wishesNextDay = wishCountByDate.get(nextDayKey) ?? 0;
        if (wishesNextDay > 0) {
          currentPrimogems += wishesNextDay * PRIMOGEMS_PER_PULL;
          currentPrimogemsWithPurchases += wishesNextDay * PRIMOGEMS_PER_PULL;
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

  // Add purchases
  for (const purchase of purchases) {
    entries.push({
      id: `purchase-${purchase.id}`,
      date: purchase.timestamp,
      type: 'purchase',
      description: `Purchased ${purchase.amount.toLocaleString()} primogems`,
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
 * Income = (newer_snapshot - older_snapshot) + (pulls_between * 160)
 */
export function calculateDailyRateFromSnapshots(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
  lookbackDays: number = 30
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

  // Filter wishes to intertwined only
  const intertwinedWishes = filterToIntertwinedWishes(wishes);

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

  // Calculate total resources at each snapshot (primogems + intertwined fates as primogem-equivalent)
  const firstTotal = firstSnapshot.primogems + (firstSnapshot.intertwined * PRIMOGEMS_PER_PULL);
  const lastTotal = lastSnapshot.primogems + (lastSnapshot.intertwined * PRIMOGEMS_PER_PULL);

  // Count all pulls made between first and last snapshot (inclusive of both boundary days)
  // Using startOfDay for boundaries means we count all wishes from start of first day
  // through end of last day (i.e., before start of day after last snapshot)
  const dayAfterLast = addDays(lastDate, 1);
  const pullsBetween = intertwinedWishes.filter(w => {
    const wishDate = parseISO(w.timestamp);
    return !isBefore(wishDate, firstDate) && isBefore(wishDate, dayAfterLast);
  }).length;

  // Income = change in resources + spending
  const totalIncome = (lastTotal - firstTotal) + (pullsBetween * PRIMOGEMS_PER_PULL);

  return totalIncome / totalDays;
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
}

/**
 * Account start date for income estimation when no snapshots exist
 * This is used to estimate minimum income from wish history
 */
export const ACCOUNT_START_DATE = '2025-10-29';

/**
 * Reference banner start date for aligning banner periods
 * Jan 13, 2026 is the start of a known banner (first half of 5.3)
 */
const REFERENCE_BANNER_DATE = '2026-01-13';
const BANNER_DURATION_DAYS = 21;

/**
 * Get the start of the banner period containing a given date
 * Works by calculating days from reference date and finding the banner boundary
 */
function getBannerPeriodStart(date: Date): Date {
  const reference = parseISO(REFERENCE_BANNER_DATE);
  const daysDiff = differenceInDays(date, reference);

  // Calculate which banner period this date falls into
  // Negative means before reference, positive means after
  const bannerOffset = Math.floor(daysDiff / BANNER_DURATION_DAYS);

  // Get the start of that banner period
  return addDays(reference, bannerOffset * BANNER_DURATION_DAYS);
}

/**
 * Calculate income rate trend over banner periods (21 days each)
 * Uses snapshots when available, otherwise estimates from wish spending
 */
export function calculateIncomeRateTrend(
  snapshots: ResourceSnapshot[],
  wishes: WishRecord[],
): IncomeRateDataPoint[] {
  const intertwinedWishes = filterToIntertwinedWishes(wishes);

  if (intertwinedWishes.length === 0 && snapshots.length === 0) {
    return [];
  }

  // Sort snapshots and wishes by date
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );
  const sortedWishes = [...intertwinedWishes].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Determine date range
  const accountStart = parseISO(ACCOUNT_START_DATE);
  const now = startOfDay(new Date());

  // Find earliest date from wishes or snapshots
  const firstWishDate = sortedWishes[0] ? parseISO(sortedWishes[0].timestamp) : null;
  const firstSnapshotDate = sortedSnapshots[0] ? parseISO(sortedSnapshots[0].timestamp) : null;

  let startDate = accountStart;
  if (firstWishDate && isBefore(firstWishDate, startDate)) {
    startDate = firstWishDate;
  }
  if (firstSnapshotDate && isBefore(firstSnapshotDate, startDate)) {
    startDate = firstSnapshotDate;
  }

  // Generate banner periods from start to now
  const result: IncomeRateDataPoint[] = [];
  let periodStart = getBannerPeriodStart(startDate);

  while (isBefore(periodStart, now)) {
    const periodEnd = addDays(periodStart, BANNER_DURATION_DAYS);
    const actualPeriodEnd = isAfter(periodEnd, now) ? now : periodEnd;
    const days = differenceInDays(actualPeriodEnd, periodStart);

    if (days <= 0) {
      periodStart = periodEnd;
      continue;
    }

    // Find snapshots within or bounding this period
    const snapshotsInPeriod = sortedSnapshots.filter(s => {
      const sDate = parseISO(s.timestamp);
      return !isBefore(sDate, periodStart) && isBefore(sDate, periodEnd);
    });

    // Find snapshot just before period start
    const snapshotBeforePeriod = sortedSnapshots
      .filter(s => isBefore(parseISO(s.timestamp), periodStart))
      .pop();

    // Find snapshot at or after period end
    const snapshotAfterPeriod = sortedSnapshots
      .find(s => !isBefore(parseISO(s.timestamp), periodStart) && !isBefore(parseISO(s.timestamp), actualPeriodEnd));

    // Count wishes in this period
    const wishesInPeriod = sortedWishes.filter(w => {
      const wDate = parseISO(w.timestamp);
      return !isBefore(wDate, periodStart) && isBefore(wDate, periodEnd);
    });
    const pullsInPeriod = wishesInPeriod.length;
    const spendingInPeriod = pullsInPeriod * PRIMOGEMS_PER_PULL;

    let totalIncome: number;
    let hasSnapshotData: boolean;

    if (snapshotBeforePeriod && (snapshotsInPeriod.length > 0 || snapshotAfterPeriod)) {
      // We have snapshot data bounding this period - calculate actual income
      const startSnapshot = snapshotsInPeriod[0] || snapshotAfterPeriod || snapshotBeforePeriod;
      const endSnapshot = snapshotsInPeriod[snapshotsInPeriod.length - 1] || snapshotAfterPeriod;

      if (startSnapshot && endSnapshot && startSnapshot !== endSnapshot) {
        const startTotal = snapshotBeforePeriod.primogems + (snapshotBeforePeriod.intertwined * PRIMOGEMS_PER_PULL);
        const endTotal = endSnapshot.primogems + (endSnapshot.intertwined * PRIMOGEMS_PER_PULL);

        // Count wishes between these specific snapshots
        const wishesBetween = sortedWishes.filter(w => {
          const wDate = parseISO(w.timestamp);
          return isAfter(wDate, parseISO(snapshotBeforePeriod.timestamp)) &&
                 !isAfter(wDate, parseISO(endSnapshot.timestamp));
        }).length;

        totalIncome = (endTotal - startTotal) + (wishesBetween * PRIMOGEMS_PER_PULL);
        hasSnapshotData = true;
      } else {
        // Fall back to wish-based estimation
        totalIncome = spendingInPeriod;
        hasSnapshotData = false;
      }
    } else {
      // No snapshot data for this period - estimate from wish spending
      // This assumes the user is spending roughly what they earn
      totalIncome = spendingInPeriod;
      hasSnapshotData = false;
    }

    const dailyRate = days > 0 ? totalIncome / days : 0;

    result.push({
      periodStart: format(periodStart, 'yyyy-MM-dd'),
      periodEnd: format(actualPeriodEnd, 'yyyy-MM-dd'),
      label: format(periodStart, 'MMM d'),
      dailyRate: Math.round(dailyRate),
      totalIncome: Math.round(totalIncome),
      days,
      hasSnapshotData,
    });

    periodStart = periodEnd;
  }

  return result;
}
