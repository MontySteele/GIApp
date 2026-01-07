import { db } from '@/db/schema';
import type { Note } from '@/types';

export const noteRepo = {
  async getAll(): Promise<Note[]> {
    return db.notes.toArray();
  },

  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.notes.add({
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.notes.delete(id);
  },
};
