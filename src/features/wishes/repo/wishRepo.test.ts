import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { wishRepo } from './wishRepo';
import type { WishRecord } from '@/types';

type NewWishRecord = Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'>;

describe('wishRepo', () => {
  const baseWish: NewWishRecord = {
    gachaId: '1001',
    bannerType: 'character',
    bannerVersion: '5.3-phase1',
    timestamp: '2024-01-01T00:00:00.000Z',
    itemType: 'character',
    itemKey: 'Navia',
    rarity: 5,
  };

  beforeEach(async () => {
    await db.wishRecords.clear();
  });

  afterEach(async () => {
    await db.wishRecords.clear();
  });

  it('deduplicates wishes by gachaId and updates existing records', async () => {
    const firstId = await wishRepo.create(baseWish);
    const original = await wishRepo.getByGachaId(baseWish.gachaId);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const updatedWish: NewWishRecord = {
      ...baseWish,
      timestamp: '2024-01-02T00:00:00.000Z',
      itemKey: 'Xianyun',
      rarity: 4,
    };

    const secondId = await wishRepo.create(updatedWish);
    const updated = await wishRepo.getByGachaId(baseWish.gachaId);
    const all = await wishRepo.getAll();

    expect(secondId).toBe(firstId);
    expect(all).toHaveLength(1);
    expect(original).toBeDefined();
    expect(updated).toBeDefined();
    expect(updated!.itemKey).toBe('Xianyun');
    expect(updated!.timestamp).toBe(updatedWish.timestamp);
    expect(updated!.createdAt).toBe(original!.createdAt);
    expect(updated!.updatedAt > original!.updatedAt).toBe(true);
  });

  it('sorts wishes by timestamp descending', async () => {
    const wishes: NewWishRecord[] = [
      { ...baseWish, gachaId: 'w1', timestamp: '2024-05-01T00:00:00.000Z' },
      { ...baseWish, gachaId: 'w2', timestamp: '2024-05-03T00:00:00.000Z', itemKey: 'Chiori' },
      { ...baseWish, gachaId: 'w3', timestamp: '2024-05-02T00:00:00.000Z', itemKey: 'Mavuika' },
    ];

    await wishRepo.bulkCreate(wishes);

    const all = await wishRepo.getAll();
    expect(all.map((wish) => wish.gachaId)).toEqual(['w2', 'w3', 'w1']);
  });

  it('filters by banner type and returns wishes newest first', async () => {
    const wishes: NewWishRecord[] = [
      { ...baseWish, gachaId: 'c1', bannerType: 'character', timestamp: '2024-03-01T00:00:00.000Z' },
      { ...baseWish, gachaId: 'w1', bannerType: 'weapon', timestamp: '2024-03-02T00:00:00.000Z' },
      { ...baseWish, gachaId: 'c2', bannerType: 'character', timestamp: '2024-03-03T00:00:00.000Z' },
    ];

    await wishRepo.bulkCreate(wishes);
    const characterWishes = await wishRepo.getByBannerType('character');

    expect(characterWishes).toHaveLength(2);
    expect(characterWishes.map((wish) => wish.gachaId)).toEqual(['c2', 'c1']);
    expect(characterWishes.every((wish) => wish.bannerType === 'character')).toBe(true);
  });

  it('updates existing wishes when bulk creating duplicates', async () => {
    const existingId = await wishRepo.create(baseWish);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const bulkWishes: NewWishRecord[] = [
      { ...baseWish, gachaId: '1001', itemKey: 'Albedo', timestamp: '2024-01-05T00:00:00.000Z' },
      { ...baseWish, gachaId: '1002', itemKey: 'Nilou', timestamp: '2024-01-04T00:00:00.000Z' },
    ];

    const original = await wishRepo.getByGachaId(baseWish.gachaId);
    await wishRepo.bulkCreate(bulkWishes);

    const updated = await wishRepo.getByGachaId(baseWish.gachaId);
    const all = await wishRepo.getAll();

    expect(all).toHaveLength(2);
    expect(updated?.id).toBe(existingId);
    expect(original).toBeDefined();
    expect(updated).toBeDefined();
    expect(updated!.itemKey).toBe('Albedo');
    expect(updated!.updatedAt > original!.updatedAt).toBe(true);
  });
});
