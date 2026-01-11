import { parseISO, format, addDays, isBefore, isAfter, startOfDay, differenceInDays } from 'date-fns';
import type { ResourceSnapshot, WishRecord, PrimogemEntry } from '@/types';

const PRIMOGEMS_PER_PULL = 160;

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

  // Sort wishes by date ascending
  const sortedWishes = [...wishes].sort(
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

  // Find the most recent snapshot to use as anchor
  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  if (!latestSnapshot) return [];

  const latestSnapshotDate = startOfDay(parseISO(latestSnapshot.timestamp));

  // Work backwards from latest snapshot
  let currentPrimogems = latestSnapshot.primogems;
  let currentPrimogemsWithPurchases = latestSnapshot.primogems;
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
      // Use snapshot value directly
      currentPrimogems = snapshotOnDate.primogems;
      currentPrimogemsWithPurchases = snapshotOnDate.primogems;
    }

    // Apply wish spending for the day
    const wishesToday = wishCountByDate.get(dateKey) ?? 0;
    if (wishesToday > 0) {
      cumulativePulls += wishesToday;
      currentPrimogems -= wishesToday * PRIMOGEMS_PER_PULL;
      currentPrimogemsWithPurchases -= wishesToday * PRIMOGEMS_PER_PULL;
    }

    // Apply purchases for the day (only affects "with purchases" line)
    const purchasesToday = purchaseByDate.get(dateKey) ?? 0;
    if (purchasesToday > 0 && isAfter(currentDate, latestSnapshotDate)) {
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
  currentPrimogems = latestSnapshot.primogems;
  currentPrimogemsWithPurchases = latestSnapshot.primogems;

  const historicalData: HistoricalDataPoint[] = [];

  while (!isBefore(currentDate, startDate)) {
    const dateKey = format(currentDate, 'yyyy-MM-dd');

    // Check for snapshot on this date
    const snapshotOnDate = snapshotByDate.get(dateKey);
    if (snapshotOnDate) {
      currentPrimogems = snapshotOnDate.primogems;
      currentPrimogemsWithPurchases = snapshotOnDate.primogems;
    } else {
      // Work backwards: add back wishes that were spent the next day
      const nextDay = addDays(currentDate, 1);
      const nextDayKey = format(nextDay, 'yyyy-MM-dd');
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
  const wishesByDay = new Map<string, WishRecord[]>();
  for (const wish of wishes) {
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
 * Calculate daily income rate from wish history
 * Assumes user maintains roughly constant primogem stash, so pulls ≈ income
 */
export function calculateDailyRateFromWishes(
  wishes: WishRecord[],
  lookbackDays: number = 30
): number {
  if (wishes.length === 0) return 0;

  const now = new Date();
  const cutoffDate = addDays(now, -lookbackDays);

  const recentWishes = wishes.filter(w => isAfter(parseISO(w.timestamp), cutoffDate));

  if (recentWishes.length === 0) return 0;

  // Find actual date range
  const dates = recentWishes.map(w => parseISO(w.timestamp));
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  const actualDays = Math.max(1, differenceInDays(maxDate, minDate) + 1);
  const totalPrimogems = recentWishes.length * PRIMOGEMS_PER_PULL;

  return totalPrimogems / actualDays;
}
