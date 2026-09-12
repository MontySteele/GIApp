import type { WishHistoryItem } from '../domain/wishAnalyzer';
import type { NewWishRecord } from '../repo/wishRepo';
import type { ServerRegion } from '@/lib/time/serverTime';
import { normalizeWishTimestamp } from '../lib/wishNormalization';

export function mapHistoryToWishRecords(
  history: WishHistoryItem[],
  region?: ServerRegion | null
): NewWishRecord[] {
  return history.map((wish) => ({
    gachaId: wish.id,
    bannerType: wish.banner,
    bannerVersion: 'unknown',
    timestamp: normalizeWishTimestamp(wish.time, region),
    itemType: wish.itemType,
    itemKey: wish.name,
    rarity: wish.rarity,
    isFeatured: wish.isFeatured,
    chartedWeapon: null,
  }));
}
