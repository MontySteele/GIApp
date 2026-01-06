import type { WishRecord } from '@/types';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

const DEFAULT_BANNER_VERSION = 'imported-v1';

function normalizeTimestamp(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function toWishRecord(
  wish: WishHistoryItem
): Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  const itemKey = wish.name.trim() || wish.name;

  return {
    gachaId: wish.id,
    bannerType: wish.banner,
    bannerVersion: DEFAULT_BANNER_VERSION,
    timestamp: normalizeTimestamp(wish.time),
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
