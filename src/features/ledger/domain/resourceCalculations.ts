import { startOfMonth, startOfWeek, format, parseISO, isAfter, isBefore } from 'date-fns';
import type { BannerType, FateType, PrimogemEntry, PrimogemSource, WishRecord } from '@/types';

export const PRIMOGEM_SOURCES: PrimogemSource[] = [
  'daily_commission',
  'welkin',
  'event',
  'exploration',
  'abyss',
  'quest',
  'achievement',
  'maintenance',
  'codes',
  'battle_pass',
  'purchase',
  'wish_conversion',
  'cosmetic',
  'other',
];

/** Sources that represent non-wish primogem spending (negative amounts) */
export const SPENDING_SOURCES: PrimogemSource[] = ['cosmetic'];

export interface WishSpendingTotals {
  totalPulls: number;
  primogemEquivalent: number;
  pullsByFate: Record<FateType, number>;
}

export interface LedgerResourceSnapshot {
  primogems: number;
  genesisCrystals: number;
  intertwined: number;
  acquaint: number;
  starglitter: number;
}

export type IncomeInterval = 'week' | 'month';

export interface IncomeBucketFilters {
  interval: IncomeInterval;
  startDate?: string;
  endDate?: string;
  source?: PrimogemSource | 'all';
  includePurchases: boolean;
}

export interface IncomeBucket {
  bucketStart: string;
  label: string;
  totals: {
    total: number;
    earned: number;
    purchased: number;
    spent: number;
    sources: Record<PrimogemSource, number>;
  };
}

const PRIMOGEMS_PER_PULL = 160;

export function bannerToFateType(bannerType: BannerType): FateType {
  if (bannerType === 'standard') return 'acquaint';
  return 'intertwined';
}

export function calculateWishSpending(wishes: WishRecord[], sinceTimestamp?: string): WishSpendingTotals {
  const pullsByFate: Record<FateType, number> = {
    intertwined: 0,
    acquaint: 0,
  };

  const sinceDate = sinceTimestamp ? parseISO(sinceTimestamp) : undefined;

  wishes.forEach((wish) => {
    if (sinceDate) {
      const wishDate = parseISO(wish.timestamp);
      if (!isAfter(wishDate, sinceDate)) return;
    }

    const fateType = bannerToFateType(wish.bannerType);
    pullsByFate[fateType] += 1;
  });

  const totalPulls = pullsByFate.intertwined + pullsByFate.acquaint;

  return {
    totalPulls,
    primogemEquivalent: totalPulls * PRIMOGEMS_PER_PULL,
    pullsByFate,
  };
}

export function calculateAvailablePulls(resources: LedgerResourceSnapshot): number {
  const primogemWishes = (resources.primogems + resources.genesisCrystals) / PRIMOGEMS_PER_PULL;
  const starglitterWishes = Math.floor(resources.starglitter / 5);

  return primogemWishes + resources.intertwined + resources.acquaint + starglitterWishes;
}

export function splitPrimogemIncome(entries: PrimogemEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      if (entry.source === 'purchase') {
        acc.purchased += entry.amount;
      } else if (SPENDING_SOURCES.includes(entry.source)) {
        acc.spent += entry.amount; // negative values
      } else {
        acc.earned += entry.amount;
      }

      acc.total += entry.amount;
      return acc;
    },
    { earned: 0, purchased: 0, spent: 0, total: 0 }
  );
}

function isWithinRange(entryDate: Date, startDate?: string, endDate?: string): boolean {
  if (startDate && isBefore(entryDate, parseISO(startDate))) return false;
  if (endDate && isAfter(entryDate, parseISO(endDate))) return false;
  return true;
}

function getBucketStart(date: Date, interval: IncomeInterval): Date {
  if (interval === 'month') return startOfMonth(date);
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function bucketPrimogemEntries(entries: PrimogemEntry[], filters: IncomeBucketFilters): IncomeBucket[] {
  const buckets = new Map<string, IncomeBucket>();

  entries.forEach((entry) => {
    const entryDate = parseISO(entry.timestamp);
    if (!isWithinRange(entryDate, filters.startDate, filters.endDate)) return;

    if (!filters.includePurchases && entry.source === 'purchase') return;
    if (filters.source && filters.source !== 'all' && entry.source !== filters.source) return;

    const bucketStartDate = getBucketStart(entryDate, filters.interval);
    const bucketKey = bucketStartDate.toISOString();
    const existing = buckets.get(bucketKey);

    const initialSources = Object.fromEntries(PRIMOGEM_SOURCES.map((source) => [source, 0])) as Record<
      PrimogemSource,
      number
    >;

    const bucket =
      existing ??
      {
        bucketStart: bucketKey,
        label: format(bucketStartDate, filters.interval === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd'),
        totals: {
          total: 0,
          earned: 0,
          purchased: 0,
          spent: 0,
          sources: initialSources,
        },
      };

    bucket.totals.total += entry.amount;
    bucket.totals.sources[entry.source] += entry.amount;

    if (entry.source === 'purchase') {
      bucket.totals.purchased += entry.amount;
    } else if (SPENDING_SOURCES.includes(entry.source)) {
      bucket.totals.spent += entry.amount;
    } else {
      bucket.totals.earned += entry.amount;
    }

    buckets.set(bucketKey, bucket);
  });

  return Array.from(buckets.values()).sort((a, b) => a.bucketStart.localeCompare(b.bucketStart));
}
