import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { upcomingWishRepo } from './upcomingWishRepo';
import { db } from '@/db/schema';
import type { PlannedBanner } from '@/types';

const baseBanner: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> = {
  characterKey: 'Furina',
  expectedStartDate: '2025-01-01T00:00:00.000Z',
  expectedEndDate: '2025-01-21T00:00:00.000Z',
  priority: 1,
  maxPullBudget: 180,
  isConfirmed: false,
  notes: 'Hydro Archon rerun',
};

describe('upcomingWishRepo', () => {
  beforeEach(async () => {
    await db.plannedBanners.clear();
  });

  afterEach(async () => {
    await db.plannedBanners.clear();
  });

  it('creates and retrieves a banner with metadata', async () => {
    const id = await upcomingWishRepo.create(baseBanner);
    const stored = await upcomingWishRepo.getById(id);

    expect(stored?.id).toBe(id);
    expect(stored?.characterKey).toBe(baseBanner.characterKey);
    expect(stored?.createdAt).toBeTruthy();
    expect(stored?.updatedAt).toBe(stored?.createdAt);
    expect(stored?.deletedAt).toBeNull();
  });

  it('returns banners ordered by expected start date', async () => {
    await upcomingWishRepo.bulkCreate([
      baseBanner,
      { ...baseBanner, characterKey: 'Neuvillette', expectedStartDate: '2025-02-01T00:00:00.000Z' },
      { ...baseBanner, characterKey: 'Kazuha', expectedStartDate: '2024-12-01T00:00:00.000Z' },
    ]);

    const banners = await upcomingWishRepo.getAll();
    expect(banners.map((b) => b.characterKey)).toEqual(['Kazuha', 'Furina', 'Neuvillette']);
  });

  it('updates a banner and refreshes updatedAt', async () => {
    const id = await upcomingWishRepo.create(baseBanner);
    const original = await upcomingWishRepo.getById(id);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await upcomingWishRepo.update(id, { priority: 3, notes: 'Speculative' });

    const updated = await upcomingWishRepo.getById(id);
    expect(updated?.priority).toBe(3);
    expect(updated?.notes).toBe('Speculative');
    expect(updated?.createdAt).toBe(original?.createdAt);
    expect(updated?.updatedAt && original?.updatedAt && updated.updatedAt > original.updatedAt).toBe(
      true
    );
  });

  it('deletes a banner', async () => {
    const id = await upcomingWishRepo.create(baseBanner);
    await upcomingWishRepo.delete(id);

    const banner = await upcomingWishRepo.getById(id);
    expect(banner).toBeUndefined();

    const raw = await db.plannedBanners.get(id);
    expect(raw?.deletedAt).toBeDefined();
  });

  it('ignores empty bulkCreate payloads', async () => {
    await upcomingWishRepo.bulkCreate([]);
    const banners = await upcomingWishRepo.getAll();

    expect(banners).toEqual([]);
  });

  it('deletes all banners', async () => {
    await upcomingWishRepo.bulkCreate([baseBanner, { ...baseBanner, characterKey: 'Navia' }]);
    await upcomingWishRepo.deleteAll();

    const banners = await upcomingWishRepo.getAll();
    expect(banners).toEqual([]);

    const all = await db.plannedBanners.toArray();
    expect(all.every((banner) => banner.deletedAt)).toBe(true);
  });
});
