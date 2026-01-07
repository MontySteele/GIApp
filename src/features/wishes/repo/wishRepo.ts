import { db } from '@/db/schema';
import type { WishRecord, BannerType } from '@/types';

export type NewWishRecord = Omit<WishRecord, 'id' | 'createdAt' | 'updatedAt'>;

export const wishRepo = {
  async getAll(): Promise<WishRecord[]> {
    return db.wishRecords.orderBy('timestamp').reverse().toArray();
  },

  async getByBannerType(bannerType: BannerType): Promise<WishRecord[]> {
    const wishes = await db.wishRecords
      .where('bannerType')
      .equals(bannerType)
      .sortBy('timestamp');

    return wishes.reverse();
  },

  async getByGachaId(gachaId: string): Promise<WishRecord | undefined> {
    return db.wishRecords.where('gachaId').equals(gachaId).first();
  },

  async create(wish: NewWishRecord): Promise<string> {
    const existing = await db.wishRecords.where('gachaId').equals(wish.gachaId).first();
    const now = new Date().toISOString();

    if (existing) {
      await db.wishRecords.update(existing.id, {
        ...wish,
        updatedAt: now,
      });

      return existing.id;
    }

    const id = crypto.randomUUID();

    await db.wishRecords.add({
      ...wish,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async bulkCreate(wishes: NewWishRecord[]): Promise<void> {
    if (wishes.length === 0) return;

    // Deduplicate incoming wishes by gachaId (last one wins)
    const deduped = Array.from(new Map(wishes.map((wish) => [wish.gachaId, wish])).values());
    const gachaIds = deduped.map((wish) => wish.gachaId);
    const existing = await db.wishRecords.where('gachaId').anyOf(gachaIds).toArray();
    const existingMap = new Map(existing.map((record) => [record.gachaId, record]));

    const newRecords: WishRecord[] = [];
    const updatePromises: Promise<number>[] = [];

    for (const wish of deduped) {
      const now = new Date().toISOString();
      const existingRecord = existingMap.get(wish.gachaId);

      if (existingRecord) {
        updatePromises.push(
          db.wishRecords.update(existingRecord.id, {
            ...wish,
            updatedAt: now,
          }),
        );
      } else {
        newRecords.push({
          ...wish,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (newRecords.length > 0) {
      await db.wishRecords.bulkAdd(newRecords);
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
  },

  async update(id: string, updates: Partial<Omit<WishRecord, 'id' | 'createdAt'>>): Promise<void> {
    await db.wishRecords.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.wishRecords.delete(id);
  },

  async deleteAll(): Promise<void> {
    await db.wishRecords.clear();
  },
};
