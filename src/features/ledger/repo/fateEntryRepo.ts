import { db } from '@/db/schema';
import type { FateEntry } from '@/types';

type FateEntryInput = Omit<FateEntry, 'id' | 'createdAt' | 'updatedAt'> & {
  timestamp?: string;
};

export const fateEntryRepo = {
  async getAll(): Promise<FateEntry[]> {
    return db.fateEntries.orderBy('timestamp').reverse().toArray();
  },

  async getById(id: string): Promise<FateEntry | undefined> {
    return db.fateEntries.get(id);
  },

  async create(entry: FateEntryInput): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.fateEntries.add({
      ...entry,
      timestamp: entry.timestamp ?? now,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<FateEntry, 'id' | 'createdAt'>>): Promise<void> {
    await db.fateEntries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.fateEntries.delete(id);
  },
};
