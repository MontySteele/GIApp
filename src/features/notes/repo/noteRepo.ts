import type { Collection } from 'dexie';
import { db } from '@/db/schema';
import type { Note } from '@/types';

export interface NoteQuery {
  tags?: string[];
  search?: string;
  pinnedOnly?: boolean;
}

function buildQueryCollection(filters: NoteQuery): Collection<Note, string> {
  if (filters.pinnedOnly) {
    return db.notes.where('pinned').equals(true);
  }

  if (filters.tags?.length) {
    return db.notes.where('tags').anyOf(filters.tags);
  }

  return db.notes.orderBy('updatedAt').reverse();
}

export const noteRepo = {
  async getById(id: string): Promise<Note | undefined> {
    return db.notes.get(id);
  },

  async query(filters: NoteQuery = {}): Promise<Note[]> {
    const collection = buildQueryCollection(filters);
    const searchTerm = filters.search?.toLowerCase();
    const tagSet = filters.tags ? new Set(filters.tags) : undefined;

    const results = await collection
      .filter((note) => {
        if (filters.pinnedOnly && !note.pinned) return false;
        if (tagSet && !note.tags.some((tag) => tagSet.has(tag))) return false;
        if (searchTerm) {
          const combined = `${note.title} ${note.content}`.toLowerCase();
          return combined.includes(searchTerm);
        }

        return true;
      })
      .toArray();

    const pinned = results.filter((note) => note.pinned).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const others = results.filter((note) => !note.pinned).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return [...pinned, ...others];
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
