import { db } from '@/db/schema';
import type { Character } from '@/types';

export const characterRepo = {
  async getAll(): Promise<Character[]> {
    return db.characters.toArray();
  },

  async getById(id: string): Promise<Character | undefined> {
    return db.characters.get(id);
  },

  async getByKey(key: string): Promise<Character | undefined> {
    return db.characters.where('key').equals(key).first();
  },

  async create(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.characters.add({
      ...character,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>): Promise<void> {
    await db.characters.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.characters.delete(id);
  },

  async addTeamToCharacters(teamId: string, characterKeys: string[], updatedAt = new Date().toISOString()): Promise<void> {
    if (characterKeys.length === 0) return;

    const characters = await db.characters.where('key').anyOf(characterKeys).toArray();

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

    const characters = await db.characters.where('key').anyOf(characterKeys).toArray();

    for (const character of characters) {
      if (!character.teamIds.includes(teamId)) continue;

      await db.characters.update(character.id, {
        teamIds: character.teamIds.filter((id) => id !== teamId),
        updatedAt,
      });
    }
  },

  async bulkCreate(characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date().toISOString();
    const withMetadata = characters.map((char) => ({
      ...char,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    await db.characters.bulkAdd(withMetadata);
  },

  /**
   * Bulk upsert characters - update existing by key, create new ones
   * Returns counts for created and updated characters
   */
  async bulkUpsert(
    characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ created: number; updated: number }> {
    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    for (const char of characters) {
      const existing = await db.characters.where('key').equals(char.key).first();

      if (existing) {
        // Update existing character, preserving teamIds and other user data
        await db.characters.update(existing.id, {
          ...char,
          teamIds: existing.teamIds, // Preserve team associations
          updatedAt: now,
        });
        updated++;
      } else {
        // Create new character
        await db.characters.add({
          ...char,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    return { created, updated };
  },

  async getByPriority(priority: Character['priority']): Promise<Character[]> {
    return db.characters.where('priority').equals(priority).toArray();
  },
};
