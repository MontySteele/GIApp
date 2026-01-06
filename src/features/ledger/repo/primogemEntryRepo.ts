import { db } from '@/db/schema';
import type { PrimogemEntry } from '@/types';

type PrimogemEntryInput = Omit<PrimogemEntry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  timestamp?: string;
};

export const primogemEntryRepo = {
  async getAll(): Promise<PrimogemEntry[]> {
    return db.primogemEntries
      .orderBy('timestamp')
      .filter((entry) => !entry.deletedAt)
      .reverse()
      .toArray();
  },

  async getById(id: string): Promise<PrimogemEntry | undefined> {
    const entry = await db.primogemEntries.get(id);
    return entry?.deletedAt ? undefined : entry;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<PrimogemEntry[]> {
    return db.primogemEntries
      .where('timestamp')
      .between(startDate, endDate, true, true)
      .filter((entry) => !entry.deletedAt)
      .toArray();
  },

  async create(entry: PrimogemEntryInput): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.primogemEntries.add({
      ...entry,
      timestamp: entry.timestamp ?? now,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<PrimogemEntry, 'id' | 'createdAt' | 'deletedAt'>>): Promise<void> {
    await db.primogemEntries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await db.primogemEntries.update(id, {
      deletedAt,
      updatedAt: deletedAt,
    });
  },
};
