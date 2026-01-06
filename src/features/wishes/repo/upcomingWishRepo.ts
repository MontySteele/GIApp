import { db } from '@/db/schema';
import type { PlannedBanner } from '@/types';

export const upcomingWishRepo = {
  async getAll(): Promise<PlannedBanner[]> {
    return db.plannedBanners.orderBy('expectedStartDate').filter((banner) => !banner.deletedAt).toArray();
  },

  async getById(id: string): Promise<PlannedBanner | undefined> {
    const banner = await db.plannedBanners.get(id);
    return banner?.deletedAt ? undefined : banner;
  },

  async create(
    banner: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.plannedBanners.add({
      ...banner,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return id;
  },

  async bulkCreate(
    banners: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]
  ): Promise<void> {
    if (!banners.length) return;

    const now = new Date().toISOString();
    const withMetadata = banners.map((banner) => ({
      ...banner,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.plannedBanners.bulkAdd(withMetadata);
  },

  async update(
    id: string,
    updates: Partial<Omit<PlannedBanner, 'id' | 'createdAt' | 'deletedAt'>>
  ): Promise<void> {
    await db.plannedBanners.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await db.plannedBanners.update(id, {
      deletedAt,
      updatedAt: deletedAt,
    });
  },

  async deleteAll(): Promise<void> {
    const deletedAt = new Date().toISOString();
    await db.plannedBanners.toCollection().modify((banner) => {
      banner.deletedAt = deletedAt;
      banner.updatedAt = deletedAt;
    });
  },
};
