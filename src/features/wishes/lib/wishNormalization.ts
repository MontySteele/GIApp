import type { WishRecord } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

const DEFAULT_BANNER_VERSION = 'imported-v1';

/**
 * Genshin Impact NA server timestamps are in UTC-5 (America/Chicago-ish).
 * When the API returns "2025-11-11 14:30:00" with no timezone suffix, we
 * must interpret it as UTC-5 — NOT the user's local timezone. Otherwise
 * wishes near the 5 PM ET banner boundary get attributed to the wrong period.
 */
const NA_SERVER_OFFSET = '-05:00';

const HAS_TZ_RE = /Z|[+-]\d{2}:?\d{2}$/;

/**
 * Normalize a wish timestamp from the Genshin API (or manual entry) into
 * a proper UTC ISO string. Timestamps without timezone info are treated as
 * NA-server time (UTC-5) rather than the browser's local timezone.
 */
export function normalizeWishTimestamp(time: string): string {
  if (!time) return new Date().toISOString();

  // Already has timezone info (Z or ±HH:MM) — parse as-is
  if (HAS_TZ_RE.test(time)) {
    const parsed = new Date(time);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  // No timezone — treat as NA server time (UTC-5).
  // Ensure ISO 8601 format before appending offset.
  const isoLike = time.includes('T') ? time : time.replace(' ', 'T');
  const parsed = new Date(isoLike + NA_SERVER_OFFSET);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function toWishRecord(
  wish: WishHistoryItem
): Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const itemKey = wish.name.trim() || wish.name;

  return {
    gachaId: wish.id,
    bannerType: wish.banner,
    bannerVersion: DEFAULT_BANNER_VERSION,
    timestamp: normalizeWishTimestamp(wish.time),
    itemType: wish.itemType,
    itemKey,
    rarity: wish.rarity,
    isFeatured: wish.isFeatured,
    chartedWeapon: wish.banner === 'weapon' ? null : undefined,
  };
}

export function toWishHistoryItem(record: WishRecord): WishHistoryItem {
  return {
    id: record.gachaId,
    name: record.itemKey,
    rarity: record.rarity,
    itemType: record.itemType,
    time: record.timestamp,
    banner: record.bannerType,
    isFeatured: record.isFeatured,
  };
}
