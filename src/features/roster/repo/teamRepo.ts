import { db } from '@/db/schema';
import type { Team } from '@/types';

export const teamRepo = {
  async getAll(): Promise<Team[]> {
    return db.teams.orderBy('updatedAt').reverse().toArray();
  },

  async getById(id: string): Promise<Team | undefined> {
    return db.teams.get(id);
  },

  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.teams.add({
      ...team,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<void> {
    await db.teams.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.teams.delete(id);
  },
};
