import type { WishHistoryItem } from '../domain/wishAnalyzer';
import type { NewWishRecord } from '../repo/wishRepo';

function normalizeTimestamp(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) {
    return time;
  }
  return parsed.toISOString();
}

export function mapHistoryToWishRecords(history: WishHistoryItem[]): NewWishRecord[] {
  return history.map((wish) => ({
    gachaId: wish.id,
    bannerType: wish.banner,
    bannerVersion: 'unknown',
    timestamp: normalizeTimestamp(wish.time),
    itemType: wish.itemType,
    itemKey: wish.name,
    rarity: wish.rarity,
    isFeatured: wish.isFeatured,
    chartedWeapon: null,
  }));
}
