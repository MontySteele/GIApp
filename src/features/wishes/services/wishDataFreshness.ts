import { db } from '@/db/schema';
import type { AppMeta } from '@/types';

export type WishDataFreshnessStatus = 'fresh' | 'stale' | 'missing';

export interface WishDataSnapshot {
  lastUpdatedAt: string | null;
  hasWishData: boolean;
  source: 'import' | 'records' | null;
}

export interface WishDataFreshness {
  status: WishDataFreshnessStatus;
  isLoading?: boolean;
  lastUpdatedAt: string | null;
  daysSinceUpdate: number | null;
  label: string;
  detail: string;
}

export const WISH_HISTORY_IMPORTED_AT_KEY = 'lastWishHistoryImportAt';
export const DEFAULT_WISH_STALE_AFTER_DAYS = 14;

function daysBetween(start: Date, end: Date): number {
  const msDiff = end.getTime() - start.getTime();
  if (!Number.isFinite(msDiff)) return 0;
  return Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
}

function formatAge(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function getMetaString(meta: AppMeta | undefined): string | null {
  return typeof meta?.value === 'string' ? meta.value : null;
}

export function getWishDataFreshness(
  snapshot: WishDataSnapshot | null | undefined,
  now: Date = new Date(),
  staleAfterDays = DEFAULT_WISH_STALE_AFTER_DAYS
): WishDataFreshness {
  if (!snapshot?.hasWishData || !snapshot.lastUpdatedAt) {
    return {
      status: 'missing',
      lastUpdatedAt: null,
      daysSinceUpdate: null,
      label: 'Import wish history',
      detail: 'Current pity, guarantees, fate points, and calculator defaults need wish history data.',
    };
  }

  const updatedAt = new Date(snapshot.lastUpdatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    return {
      status: 'stale',
      lastUpdatedAt: snapshot.lastUpdatedAt,
      daysSinceUpdate: null,
      label: 'Refresh wish history',
      detail: 'The latest wish data timestamp could not be read, so pity and calculator defaults may be stale.',
    };
  }

  const daysSinceUpdate = daysBetween(updatedAt, now);
  const ageLabel = formatAge(daysSinceUpdate);
  const sourceLabel = snapshot.source === 'import' ? 'wish history import' : 'wish record update';

  if (daysSinceUpdate >= staleAfterDays) {
    return {
      status: 'stale',
      lastUpdatedAt: snapshot.lastUpdatedAt,
      daysSinceUpdate,
      label: 'Refresh wish history',
      detail: `Last ${sourceLabel} was ${ageLabel}. Refresh before trusting current pity or target pull odds.`,
    };
  }

  return {
    status: 'fresh',
    lastUpdatedAt: snapshot.lastUpdatedAt,
    daysSinceUpdate,
    label: 'Wish history current',
    detail: `Last ${sourceLabel} was ${ageLabel}.`,
  };
}

export async function getWishDataSnapshot(): Promise<WishDataSnapshot> {
  const importMeta = await db.appMeta.get(WISH_HISTORY_IMPORTED_AT_KEY);
  const importedAt = getMetaString(importMeta);
  if (importedAt) {
    return {
      lastUpdatedAt: importedAt,
      hasWishData: true,
      source: 'import',
    };
  }

  const latestWish = await db.wishRecords.orderBy('timestamp').reverse().first();
  return {
    lastUpdatedAt: latestWish?.updatedAt ?? latestWish?.timestamp ?? null,
    hasWishData: Boolean(latestWish),
    source: latestWish ? 'records' : null,
  };
}

export async function markWishHistoryImportComplete(timestamp: Date = new Date()): Promise<string> {
  const iso = timestamp.toISOString();
  await db.appMeta.put({ key: WISH_HISTORY_IMPORTED_AT_KEY, value: iso });
  return iso;
}
