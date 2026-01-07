import { db } from '@/db/schema';
import type { PlannedBanner } from '@/types';

export const upcomingWishRepo = {
  async getAll(): Promise<PlannedBanner[]> {
    return db.plannedBanners.orderBy('expectedStartDate').toArray();
  },

  async getById(id: string): Promise<PlannedBanner | undefined> {
    return db.plannedBanners.get(id);
  },

  async create(
    banner: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.plannedBanners.add({
      ...banner,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async bulkCreate(
    banners: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<void> {
    if (!banners.length) return;

    const now = new Date().toISOString();
    const withMetadata = banners.map((banner) => ({
      ...banner,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    await db.plannedBanners.bulkAdd(withMetadata);
  },

  async update(
    id: string,
    updates: Partial<Omit<PlannedBanner, 'id' | 'createdAt'>>
  ): Promise<void> {
    await db.plannedBanners.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.plannedBanners.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.plannedBanners.clear();
  },
};
