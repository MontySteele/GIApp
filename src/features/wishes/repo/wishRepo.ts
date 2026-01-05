import { db } from '@/db/schema';
import type { WishRecord, BannerType } from '@/types';

export const wishRepo = {
  async getAll(): Promise<WishRecord[]> {
    return db.wishRecords.orderBy('timestamp').reverse().toArray();
  },

  async getByBannerType(bannerType: BannerType): Promise<WishRecord[]> {
    return db.wishRecords
      .where('bannerType')
      .equals(bannerType)
      .sortBy('timestamp');
  },

  async getByGachaId(gachaId: string): Promise<WishRecord | undefined> {
    return db.wishRecords.where('gachaId').equals(gachaId).first();
  },

  async create(wish: Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.wishRecords.add({
      ...wish,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async bulkCreate(wishes: Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const withMetadata = wishes.map((wish) => ({
      ...wish,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    await db.wishRecords.bulkAdd(withMetadata);
  },

  async delete(id: string): Promise<void> {
    await db.wishRecords.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.wishRecords.clear();
  },
};
