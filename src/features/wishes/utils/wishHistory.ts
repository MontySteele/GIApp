import { GACHA_RULES } from '@/lib/constants';
import type { WishRecord, BannerType } from '@/types';
import { wishRepo } from '../repo/wishRepo';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

const getBannerVersion = (banner: BannerType) =>
  GACHA_RULES[banner]?.version ?? 'unknown';

const normalizeTimestamp = (timestamp: string) => {
  if (!timestamp) return new Date().toISOString();

  const isoLike = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const parsedDate = new Date(isoLike);

  return Number.isNaN(parsedDate.getTime()) ? timestamp : parsedDate.toISOString();
};

export const wishHistoryItemToRecord = (
  wish: WishHistoryItem
): Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'> => ({
  gachaId: wish.id,
  bannerType: wish.banner,
  bannerVersion: getBannerVersion(wish.banner),
  timestamp: normalizeTimestamp(wish.time),
  itemType: wish.itemType,
  itemKey: wish.name,
  rarity: wish.rarity,
  isFeatured: wish.isFeatured,
});

export const wishRecordToHistoryItem = (record: WishRecord): WishHistoryItem => ({
  id: record.gachaId || record.id,
  name: record.itemKey,
  rarity: record.rarity,
  itemType: record.itemType,
  time: record.timestamp,
  banner: record.bannerType,
  isFeatured: record.isFeatured,
});

export const summarizeWishRecords = (
  records: WishRecord[]
): Record<BannerType, number> =>
  records.reduce(
    (summary, record) => ({
      ...summary,
      [record.bannerType]: (summary[record.bannerType] ?? 0) + 1,
    }),
    {
      character: 0,
      weapon: 0,
      standard: 0,
      chronicled: 0,
    } as Record<BannerType, number>
  );

export const loadWishHistoryFromRepo = async (): Promise<WishHistoryItem[]> => {
  const records = await wishRepo.getAll();
  return records.map(wishRecordToHistoryItem);
};
