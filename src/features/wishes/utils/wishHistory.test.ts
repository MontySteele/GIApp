import { describe, expect, it } from 'vitest';
import type { WishRecord } from '@/types';
import { calculateStatistics, type WishHistoryItem } from '../domain/wishAnalyzer';
import { wishHistoryItemToRecord, wishRecordToHistoryItem } from './wishHistory';

const baseDates = ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'];

const withRecordFields = (
  record: Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'>,
  index: number
): WishRecord => ({
  ...record,
  id: `rec-${index}`,
  createdAt: baseDates[0],
  updatedAt: baseDates[1],
});

describe('wishHistory storage helpers', () => {
  it('persists isFeatured flags when converting to and from wish records', () => {
    const wishes: WishHistoryItem[] = [
      {
        id: 'w1',
        name: 'Furina',
        rarity: 5,
        itemType: 'character',
        banner: 'character',
        time: baseDates[0],
        isFeatured: true,
      },
      {
        id: 'w2',
        name: 'Diluc',
        rarity: 5,
        itemType: 'character',
        banner: 'character',
        time: baseDates[1],
        isFeatured: false,
      },
    ];

    const stored = wishes.map((wish, index) =>
      withRecordFields(wishHistoryItemToRecord(wish), index)
    );
    const hydrated = stored.map(wishRecordToHistoryItem);

    expect(hydrated[0].isFeatured).toBe(true);
    expect(hydrated[1].isFeatured).toBe(false);
  });

  it('reflects stored isFeatured values in 50/50 win and loss counts', () => {
    const wishes: WishHistoryItem[] = [
      {
        id: 'w1',
        name: 'Limited Character',
        rarity: 5,
        itemType: 'character',
        banner: 'character',
        time: baseDates[0],
        isFeatured: true,
      },
      {
        id: 'w2',
        name: 'Diluc',
        rarity: 5,
        itemType: 'character',
        banner: 'character',
        time: baseDates[1],
        isFeatured: false,
      },
    ];

    const hydrated = wishes
      .map((wish, index) => withRecordFields(wishHistoryItemToRecord(wish), index))
      .map(wishRecordToHistoryItem);
    const stats = calculateStatistics(hydrated, 'character');

    expect(stats.fiftyFiftyWon).toBe(1);
    expect(stats.fiftyFiftyLost).toBe(1);
  });
});
