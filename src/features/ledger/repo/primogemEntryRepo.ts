import { db } from '@/db/schema';
import type { PrimogemEntry } from '@/types';

type PrimogemEntryInput = Omit<PrimogemEntry, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'> & {
  timestamp?: string;
};

export const primogemEntryRepo = {
  async getAll(): Promise<PrimogemEntry[]> {
    return db.primogemEntries.orderBy('timestamp').reverse().toArray();
  },

  async getById(id: string): Promise<PrimogemEntry | undefined> {
    return db.primogemEntries.get(id);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<PrimogemEntry[]> {
    return db.primogemEntries.where('timestamp').between(startDate, endDate, true, true).toArray();
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
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<PrimogemEntry, 'id' | 'createdAt'>>): Promise<void> {
    await db.primogemEntries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.primogemEntries.delete(id);
  },
};
