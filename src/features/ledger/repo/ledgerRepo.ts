import { db } from '@/db/schema';
import type { PrimogemEntry, FateEntry, ResourceSnapshot } from '@/types';

export const ledgerRepo = {
  primogems: {
    async getAll(): Promise<PrimogemEntry[]> {
      return db.primogemEntries.orderBy('timestamp').reverse().toArray();
    },

    async getByDateRange(startDate: string, endDate: string): Promise<PrimogemEntry[]> {
      return db.primogemEntries
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .toArray();
    },

    async create(entry: Omit<PrimogemEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      await db.primogemEntries.add({
        ...entry,
        id,
        createdAt: now,
        updatedAt: now,
      });

      return id;
    },

    async delete(id: string): Promise<void> {
      await db.primogemEntries.delete(id);
    },
  },

  fates: {
    async getAll(): Promise<FateEntry[]> {
      return db.fateEntries.orderBy('timestamp').reverse().toArray();
    },

    async create(entry: Omit<FateEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      await db.fateEntries.add({
        ...entry,
        id,
        createdAt: now,
        updatedAt: now,
      });

      return id;
    },
  },

  snapshots: {
    async getLatest(): Promise<ResourceSnapshot | undefined> {
      return db.resourceSnapshots.orderBy('timestamp').reverse().first();
    },

    async create(snapshot: Omit<ResourceSnapshot, 'id'>): Promise<string> {
      const id = crypto.randomUUID();

      await db.resourceSnapshots.add({
        ...snapshot,
        id,
        createdAt: new Date().toISOString(),
      });

      return id;
    },
  },
};
