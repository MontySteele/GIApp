import { db } from '@/db/schema';
import type { FateEntry } from '@/types';

type FateEntryInput = Omit<FateEntry, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  timestamp?: string;
};

export const fateEntryRepo = {
  async getAll(): Promise<FateEntry[]> {
    return db.fateEntries
      .orderBy('timestamp')
      .filter((entry) => !entry.deletedAt)
      .reverse()
      .toArray();
  },

  async getById(id: string): Promise<FateEntry | undefined> {
    const entry = await db.fateEntries.get(id);
    return entry?.deletedAt ? undefined : entry;
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
      deletedAt: null,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<FateEntry, 'id' | 'createdAt' | 'deletedAt'>>): Promise<void> {
    await db.fateEntries.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await db.fateEntries.update(id, {
      deletedAt,
      updatedAt: deletedAt,
    });
  },
};
