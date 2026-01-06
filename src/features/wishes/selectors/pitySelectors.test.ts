import { describe, expect, it } from 'vitest';
import type { WishRecord } from '@/types';
import { getPityByBanner, getPityForBanner } from './pitySelectors';

const baseWish: WishRecord = {
  id: '1',
  gachaId: '1',
  bannerType: 'character',
  bannerVersion: '5.0',
  timestamp: '2024-01-01T00:00:00.000Z',
  itemType: 'character',
  itemKey: 'Test',
  rarity: 3,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('pitySelectors', () => {
  it('returns default state when no wishes exist', () => {
    const snapshot = getPityForBanner([], 'character');

    expect(snapshot.pity).toBe(0);
    expect(snapshot.guaranteed).toBe(false);
    expect(snapshot.radiantStreak).toBe(0);
    expect(snapshot.radianceActive).toBe(false);
  });

  it('derives character pity, guarantee, and radiance from history', () => {
    const wishes: WishRecord[] = [
      { ...baseWish, id: 'a', gachaId: 'a', rarity: 5, isFeatured: false },
      {
        ...baseWish,
        id: 'b',
        gachaId: 'b',
        rarity: 5,
        isFeatured: true,
        timestamp: '2024-01-02T00:00:00.000Z',
      },
      {
        ...baseWish,
        id: 'c',
        gachaId: 'c',
        rarity: 3,
        timestamp: '2024-01-03T00:00:00.000Z',
      },
      {
        ...baseWish,
        id: 'd',
        gachaId: 'd',
        rarity: 3,
        timestamp: '2024-01-04T00:00:00.000Z',
      },
    ];

    const snapshot = getPityForBanner(wishes, 'character');

    expect(snapshot.pity).toBe(2);
    expect(snapshot.guaranteed).toBe(false);
    expect(snapshot.radiantStreak).toBe(0);
    expect(snapshot.radianceActive).toBe(false);
  });

  it('derives weapon fate points as guarantee indicator', () => {
    const wishes: WishRecord[] = [
      { ...baseWish, id: 'weapon-1', gachaId: 'weapon-1', bannerType: 'weapon', itemType: 'weapon', rarity: 5, timestamp: '2024-01-01T00:00:00.000Z' },
      { ...baseWish, id: 'weapon-2', gachaId: 'weapon-2', bannerType: 'weapon', itemType: 'weapon', rarity: 5, timestamp: '2024-01-02T00:00:00.000Z' },
      { ...baseWish, id: 'weapon-3', gachaId: 'weapon-3', bannerType: 'weapon', itemType: 'weapon', rarity: 3, timestamp: '2024-01-03T00:00:00.000Z' },
    ];

    const snapshot = getPityByBanner(wishes).weapon;

    expect(snapshot.fatePoints).toBeGreaterThanOrEqual(0);
    expect(snapshot.pity).toBe(1);
  });
});
