import { normalizeCharacterKey } from '@/lib/characterKeys';
import { db } from '@/db/schema';
import type { Character, Team } from '@/types';
import { getAvatarIdFromKey } from '@/lib/characterData';

export const characterRepo = {
  async getAll(): Promise<Character[]> {
    return db.characters.toArray();
  },

  async getById(id: string): Promise<Character | undefined> {
    return db.characters.get(id);
  },

  async getByKey(key: string): Promise<Character | undefined> {
    return db.characters.where('key').equals(normalizeCharacterKey(key)).first();
  },

  /**
   * Create a character. If a row for the same character already exists (matched on
   * the canonical key), it is updated in place and its id returned, so adding
   * "Ayaka" by hand after an Enka import of "Kamisato Ayaka" never makes a duplicate.
   */
  async create(input: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const character = { ...input, key: normalizeCharacterKey(input.key) };
    const now = new Date().toISOString();
    const avatarId = character.avatarId ?? getAvatarIdFromKey(character.key);

    return db.transaction('rw', db.characters, async () => {
      const existing = await db.characters.where('key').equals(character.key).first();
      if (existing) {
        await db.characters.update(existing.id, {
          ...character,
          ...(avatarId !== undefined ? { avatarId } : {}),
          teamIds: Array.from(new Set([...(existing.teamIds ?? []), ...(character.teamIds ?? [])])),
          updatedAt: now,
        });
        return existing.id;
      }

      const id = crypto.randomUUID();
      await db.characters.add({
        ...character,
        ...(avatarId !== undefined ? { avatarId } : {}),
        id,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    });
  },

  async update(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>): Promise<void> {
    await db.characters.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.characters, db.teams, async () => {
      const character = await db.characters.get(id);
      await db.characters.delete(id);
      if (!character) return;

      // Keep Team.characterKeys consistent. Keys are shared by duplicates of
      // the same character, so only detach when no other copy remains.
      const remaining = await db.characters.where('key').equals(character.key).count();
      if (remaining > 0) return;

      const updatedAt = new Date().toISOString();
      const teams = await db.teams.filter((team) => team.characterKeys.includes(character.key)).toArray();
      for (const team of teams) {
        const updates: Partial<Team> = {
          characterKeys: team.characterKeys.filter((key) => key !== character.key),
          updatedAt,
        };
        if (team.memberBuildTemplates && character.key in team.memberBuildTemplates) {
          updates.memberBuildTemplates = Object.fromEntries(
            Object.entries(team.memberBuildTemplates).filter(([key]) => key !== character.key)
          );
        }
        await db.teams.update(team.id, updates);
      }
    });
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
    const withMetadata = characters.map((char) => {
      const avatarId = char.avatarId ?? getAvatarIdFromKey(char.key);
      return {
        ...char,
        ...(avatarId !== undefined ? { avatarId } : {}),
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.characters.bulkAdd(withMetadata);
  },

  /**
   * Bulk upsert characters - update existing by key, create new ones
   * Returns counts for created and updated characters
   */
  async bulkUpsert(
    characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ created: number; updated: number }> {
    // One transaction so a concurrent import cannot slip between the
    // key lookup and the add and create a duplicate character.
    return db.transaction('rw', db.characters, async () => {
      const now = new Date().toISOString();
      let created = 0;
      let updated = 0;

      for (const input of characters) {
        const char = { ...input, key: normalizeCharacterKey(input.key) };
        const existing = await db.characters.where('key').equals(char.key).first();

        if (existing) {
          // Update existing character, preserving teamIds and other user data
          const avatarId = char.avatarId ?? existing.avatarId ?? getAvatarIdFromKey(char.key);
          await db.characters.update(existing.id, {
            ...char,
            ...(avatarId !== undefined ? { avatarId } : {}),
            teamIds: existing.teamIds, // Preserve team associations
            updatedAt: now,
          });
          updated++;
        } else {
          // Create new character
          const avatarId = char.avatarId ?? getAvatarIdFromKey(char.key);
          await db.characters.add({
            ...char,
            ...(avatarId !== undefined ? { avatarId } : {}),
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          });
          created++;
        }
      }

      return { created, updated };
    });
  },

  async getByPriority(priority: Character['priority']): Promise<Character[]> {
    return db.characters.where('priority').equals(priority).toArray();
  },
};
