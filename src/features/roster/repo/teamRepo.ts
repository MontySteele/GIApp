import { db } from '@/db/schema';
import { characterRepo } from './characterRepo';
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

    await db.transaction('rw', db.teams, db.characters, async () => {
      await db.teams.add({
        ...team,
        id,
        createdAt: now,
        updatedAt: now,
      });

      await characterRepo.addTeamToCharacters(id, team.characterKeys, now);
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<void> {
    const existing = await db.teams.get(id);
    if (!existing) return;

    const updatedAt = new Date().toISOString();
    const nextCharacterKeys = updates.characterKeys ?? existing.characterKeys;
    const addedKeys = nextCharacterKeys.filter((key) => !existing.characterKeys.includes(key));
    const removedKeys = existing.characterKeys.filter((key) => !nextCharacterKeys.includes(key));

    await db.transaction('rw', db.teams, db.characters, async () => {
      await db.teams.update(id, {
        ...updates,
        updatedAt,
      });

      if (addedKeys.length > 0) {
        await characterRepo.addTeamToCharacters(id, addedKeys, updatedAt);
      }

      if (removedKeys.length > 0) {
        await characterRepo.removeTeamFromCharacters(id, removedKeys, updatedAt);
      }
    });
  },

  async delete(id: string): Promise<void> {
    const existing = await db.teams.get(id);
    const updatedAt = new Date().toISOString();

    await db.transaction('rw', db.teams, db.characters, async () => {
      await db.teams.delete(id);

      if (existing) {
        await characterRepo.removeTeamFromCharacters(id, existing.characterKeys, updatedAt);
      }
    });
  },
};
