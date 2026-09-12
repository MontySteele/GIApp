import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { materialRepo } from './inventoryRepo';

describe('materialRepo', () => {
  beforeEach(async () => {
    await db.materialInventory.clear();
  });

  afterEach(async () => {
    await db.materialInventory.clear();
  });

  it('creates the singleton document on first setMaterial', async () => {
    await materialRepo.setMaterial('Mora', 1000);

    const inventory = await materialRepo.get();
    expect(inventory?.id).toBe('materials');
    expect(inventory?.materials).toEqual({ Mora: 1000 });
    expect(await materialRepo.getMaterial('Mora')).toBe(1000);
  });

  it('preserves other keys when updating one material', async () => {
    await materialRepo.set({ Mora: 1000, HeroesWit: 5 });
    await materialRepo.setMaterial('Mora', 2500);

    const inventory = await materialRepo.get();
    expect(inventory?.materials).toEqual({ Mora: 2500, HeroesWit: 5 });
  });

  it('keeps every write when setMaterial calls run concurrently', async () => {
    // Each call is a read-modify-write on the same singleton; without a
    // transaction the later writers would clobber the earlier ones.
    const keys = Array.from({ length: 20 }, (_, i) => `Material${i}`);
    await Promise.all(keys.map((key, i) => materialRepo.setMaterial(key, i + 1)));

    const inventory = await materialRepo.get();
    expect(Object.keys(inventory?.materials ?? {})).toHaveLength(keys.length);
    for (const [i, key] of keys.entries()) {
      expect(inventory?.materials[key]).toBe(i + 1);
    }
  });

  it('returns 0 for unknown materials', async () => {
    expect(await materialRepo.getMaterial('Nope')).toBe(0);
  });
});
