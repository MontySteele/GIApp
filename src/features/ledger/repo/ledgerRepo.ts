import { db } from '@/db/schema';
import type { PrimogemEntry, FateEntry, ResourceSnapshot } from '@/types';

export const ledgerRepo = {
  primogems: {
    async getAll(): Promise<PrimogemEntry[]> {
      return db.primogemEntries
        .orderBy('timestamp')
        .filter((entry) => !entry.deletedAt)
        .reverse()
        .toArray();
    },

    async getByDateRange(startDate: string, endDate: string): Promise<PrimogemEntry[]> {
      return db.primogemEntries
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .filter((entry) => !entry.deletedAt)
        .toArray();
    },

    async create(entry: Omit<PrimogemEntry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<string> {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      await db.primogemEntries.add({
        ...entry,
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      return id;
    },

    async delete(id: string): Promise<void> {
      const deletedAt = new Date().toISOString();
      await db.primogemEntries.update(id, {
        deletedAt,
        updatedAt: deletedAt,
      });
    },
  },

  fates: {
    async getAll(): Promise<FateEntry[]> {
      return db.fateEntries
        .orderBy('timestamp')
        .filter((entry) => !entry.deletedAt)
        .reverse()
        .toArray();
    },

    async create(entry: Omit<FateEntry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<string> {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      await db.fateEntries.add({
        ...entry,
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      return id;
    },
  },

  snapshots: {
    async getLatest(): Promise<ResourceSnapshot | undefined> {
      return db.resourceSnapshots
        .orderBy('timestamp')
        .filter((snapshot) => !snapshot.deletedAt)
        .reverse()
        .first();
    },

    async create(snapshot: Omit<ResourceSnapshot, 'id' | 'updatedAt' | 'deletedAt'>): Promise<string> {
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await db.resourceSnapshots.add({
        ...snapshot,
        genesisCrystals: snapshot.genesisCrystals ?? 0,
        id,
        createdAt,
        updatedAt: createdAt,
        deletedAt: null,
      });

      return id;
    },
  },
};
