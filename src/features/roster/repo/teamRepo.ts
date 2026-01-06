import { db } from '@/db/schema';
import { characterRepo } from './characterRepo';
import type { Team } from '@/types';

export const teamRepo = {
  async getAll(): Promise<Team[]> {
    return db.teams
      .orderBy('updatedAt')
      .filter((team) => !team.deletedAt)
      .reverse()
      .toArray();
  },

  async getById(id: string): Promise<Team | undefined> {
    const team = await db.teams.get(id);
    return team?.deletedAt ? undefined : team;
  },

  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.transaction('rw', db.teams, db.characters, async () => {
      await db.teams.add({
        ...team,
        id,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      await characterRepo.addTeamToCharacters(id, team.characterKeys, now);
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Team, 'id' | 'createdAt' | 'deletedAt'>>): Promise<void> {
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
      await db.teams.update(id, {
        deletedAt: updatedAt,
        updatedAt,
      });

      if (existing) {
        await characterRepo.removeTeamFromCharacters(id, existing.characterKeys, updatedAt);
      }
    });
  },
};
