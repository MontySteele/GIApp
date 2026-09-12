import type { WishRecord } from '@/types';
import { serverOffsetString, type ServerRegion } from '@/lib/time/serverTime';
import { getCurrentServerRegion } from '@/stores/uiStore';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

const DEFAULT_BANNER_VERSION = 'imported-v1';

/**
 * Genshin Impact API timestamps are in the *server's* fixed timezone
 * (NA UTC-5, EU UTC+1, Asia/TW UTC+8) with no timezone suffix, e.g.
 * "2025-11-11 14:30:00". They must be interpreted with that server offset —
 * NOT the user's local timezone — otherwise wishes near the banner boundary
 * get attributed to the wrong period.
 */
const HAS_TZ_RE = /Z|[+-]\d{2}:?\d{2}$/;

/**
 * Normalize a wish timestamp from the Genshin API (or manual entry) into
 * a proper UTC ISO string. Timestamps without timezone info are treated as
 * server time for `region` (the `region` query param of the wish URL),
 * falling back to the user's configured server region.
 */
export function normalizeWishTimestamp(time: string, region?: ServerRegion | null): string {
  if (!time) return new Date().toISOString();

  // Already has timezone info (Z or ±HH:MM) — parse as-is
  if (HAS_TZ_RE.test(time)) {
    const parsed = new Date(time);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  // No timezone — treat as server time for the resolved region.
  // Ensure ISO 8601 format before appending offset.
  const isoLike = time.includes('T') ? time : time.replace(' ', 'T');
  const parsed = new Date(isoLike + serverOffsetString(region ?? getCurrentServerRegion()));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function toWishRecord(
  wish: WishHistoryItem,
  region?: ServerRegion | null
): Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'> {
  const itemKey = wish.name.trim() || wish.name;

  return {
    gachaId: wish.id,
    bannerType: wish.banner,
    bannerVersion: DEFAULT_BANNER_VERSION,
    timestamp: normalizeWishTimestamp(wish.time, region),
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
