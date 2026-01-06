import { db } from '@/db/schema';
import type { Character } from '@/types';

export const characterRepo = {
  async getAll(): Promise<Character[]> {
    return db.characters.filter((character) => !character.deletedAt).toArray();
  },

  async getById(id: string): Promise<Character | undefined> {
    const character = await db.characters.get(id);
    return character?.deletedAt ? undefined : character;
  },

  async getByKey(key: string): Promise<Character | undefined> {
    const character = await db.characters.where('key').equals(key).first();
    return character?.deletedAt ? undefined : character;
  },

  async create(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.characters.add({
      ...character,
      id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt' | 'deletedAt'>>): Promise<void> {
    await db.characters.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await db.characters.update(id, {
      deletedAt,
      updatedAt: deletedAt,
    });
  },

  async addTeamToCharacters(teamId: string, characterKeys: string[], updatedAt = new Date().toISOString()): Promise<void> {
    if (characterKeys.length === 0) return;

    const characters = await db.characters
      .where('key')
      .anyOf(characterKeys)
      .filter((character) => !character.deletedAt)
      .toArray();

    for (const character of characters) {
      if (character.teamIds.includes(teamId)) continue;

      await db.characters.update(character.id, {
        teamIds: [...character.teamIds, teamId],
        updatedAt,
      });
    }
  },

  async removeTeamFromCharacters(teamId: string, characterKeys: string[], updatedAt = new Date().toISOString()): Promise<void> {
    if (characterKeys.length === 0) return;

    const characters = await db.characters
      .where('key')
      .anyOf(characterKeys)
      .filter((character) => !character.deletedAt)
      .toArray();

    for (const character of characters) {
      if (!character.teamIds.includes(teamId)) continue;

      await db.characters.update(character.id, {
        teamIds: character.teamIds.filter((id) => id !== teamId),
        updatedAt,
      });
    }
  },

  async bulkCreate(characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const withMetadata = characters.map((char) => ({
      ...char,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.characters.bulkAdd(withMetadata);
  },

  async getByPriority(priority: Character['priority']): Promise<Character[]> {
    return db.characters.where('priority').equals(priority).filter((character) => !character.deletedAt).toArray();
  },
};
