import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/db/schema';
import { characterRepo } from './characterRepo';
import type { Character } from '@/types';

describe('Character Repository', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.characters.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.characters.clear();
  });

  const mockCharacterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 2,
    talent: {
      auto: 9,
      skill: 10,
      burst: 10,
    },
    weapon: {
      key: 'Splendor of Tranquil Waters',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    artifacts: [
      {
        setKey: 'GoldenTroupe',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate', value: 3.9 },
          { key: 'critDMG', value: 14.8 },
        ],
      },
    ],
    notes: 'Main DPS',
    priority: 'main',
    teamIds: [],
  };

  describe('create', () => {
    it('should create a new character', async () => {
      const id = await characterRepo.create(mockCharacterData);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const character = await characterRepo.getById(id);
      expect(character).toBeDefined();
      expect(character?.key).toBe('Furina');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const id = await characterRepo.create(mockCharacterData);
      const character = await characterRepo.getById(id);

      // Check timestamps are set and in ISO format
      expect(character?.createdAt).toBeDefined();
      expect(character?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(character?.updatedAt).toBeDefined();
      expect(character?.updatedAt).toBe(character?.createdAt);
    });

    it('should preserve all character data', async () => {
      const id = await characterRepo.create(mockCharacterData);
      const character = await characterRepo.getById(id);

      expect(character?.level).toBe(90);
      expect(character?.constellation).toBe(2);
      expect(character?.talent).toEqual(mockCharacterData.talent);
      expect(character?.weapon).toEqual(mockCharacterData.weapon);
      expect(character?.artifacts).toHaveLength(1);
      expect(character?.notes).toBe('Main DPS');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no characters exist', async () => {
      const characters = await characterRepo.getAll();
      expect(characters).toEqual([]);
    });

    it('should return all characters', async () => {
      await characterRepo.create(mockCharacterData);
      await characterRepo.create({ ...mockCharacterData, key: 'Neuvillette' });

      const characters = await characterRepo.getAll();
      expect(characters).toHaveLength(2);
    });
  });

  describe('getByPriority', () => {
    it('should filter characters by priority', async () => {
      const mainId = await characterRepo.create(mockCharacterData);
      await characterRepo.create({
        ...mockCharacterData,
        key: 'Neuvillette',
        priority: 'bench',
      });

      const mainCharacters = await characterRepo.getByPriority('main');

      expect(mainCharacters).toHaveLength(1);
      expect(mainCharacters[0].id).toBe(mainId);
    });
  });

  describe('getById', () => {
    it('should return character by ID', async () => {
      const id = await characterRepo.create(mockCharacterData);
      const character = await characterRepo.getById(id);

      expect(character).toBeDefined();
      expect(character?.id).toBe(id);
      expect(character?.key).toBe('Furina');
    });

    it('should return undefined for non-existent ID', async () => {
      const character = await characterRepo.getById('non-existent-id');
      expect(character).toBeUndefined();
    });
  });

  describe('getByKey', () => {
    it('should return character by key', async () => {
      await characterRepo.create(mockCharacterData);
      const character = await characterRepo.getByKey('Furina');

      expect(character).toBeDefined();
      expect(character?.key).toBe('Furina');
    });

    it('should return undefined for non-existent key', async () => {
      const character = await characterRepo.getByKey('NonExistent');
      expect(character).toBeUndefined();
    });

    it('should return first match if multiple characters have same key', async () => {
      await characterRepo.create(mockCharacterData);
      await characterRepo.create(mockCharacterData); // Duplicate key

      const character = await characterRepo.getByKey('Furina');
      expect(character).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an existing character', async () => {
      const id = await characterRepo.create(mockCharacterData);

      await characterRepo.update(id, {
        level: 80,
        constellation: 3,
      });

      const character = await characterRepo.getById(id);
      expect(character?.level).toBe(80);
      expect(character?.constellation).toBe(3);
      expect(character?.key).toBe('Furina'); // Other fields unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const id = await characterRepo.create(mockCharacterData);
      const originalCharacter = await characterRepo.getById(id);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await characterRepo.update(id, { level: 80 });
      const updatedCharacter = await characterRepo.getById(id);

      // ISO strings can be compared directly
      expect(updatedCharacter?.updatedAt).not.toBe(originalCharacter!.updatedAt);
      expect(updatedCharacter?.updatedAt >= originalCharacter!.updatedAt).toBe(true);
    });

    it('should not change createdAt timestamp', async () => {
      const id = await characterRepo.create(mockCharacterData);
      const originalCharacter = await characterRepo.getById(id);

      await characterRepo.update(id, { level: 80 });
      const updatedCharacter = await characterRepo.getById(id);

      expect(updatedCharacter?.createdAt).toBe(originalCharacter!.createdAt);
    });
  });

  describe('delete', () => {
    it('should delete a character', async () => {
      const id = await characterRepo.create(mockCharacterData);

      await characterRepo.delete(id);

      const character = await characterRepo.getById(id);
      expect(character).toBeUndefined();
    });

    it('should not error when deleting non-existent character', async () => {
      await expect(characterRepo.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple characters', async () => {
      const characters = [
        mockCharacterData,
        { ...mockCharacterData, key: 'Neuvillette' },
        { ...mockCharacterData, key: 'Kazuha' },
      ];

      await characterRepo.bulkCreate(characters);

      const allCharacters = await characterRepo.getAll();
      expect(allCharacters).toHaveLength(3);
      expect(allCharacters.map((c) => c.key)).toContain('Furina');
      expect(allCharacters.map((c) => c.key)).toContain('Neuvillette');
      expect(allCharacters.map((c) => c.key)).toContain('Kazuha');
    });

    it('should handle empty array', async () => {
      await expect(characterRepo.bulkCreate([])).resolves.not.toThrow();

      const allCharacters = await characterRepo.getAll();
      expect(allCharacters).toHaveLength(0);
    });

    it('should set timestamps for all characters', async () => {
      const characters = [
        mockCharacterData,
        { ...mockCharacterData, key: 'Neuvillette' },
      ];

      await characterRepo.bulkCreate(characters);
      const allCharacters = await characterRepo.getAll();

      for (const character of allCharacters) {
        expect(character.createdAt).toBeDefined();
        expect(character.updatedAt).toBeDefined();
        expect(character.createdAt).toBe(character.updatedAt);
      }
    });
  });

  describe('team linkage helpers', () => {
    it('adds teamId to characters by key', async () => {
      await characterRepo.bulkCreate([
        mockCharacterData,
        { ...mockCharacterData, key: 'Neuvillette' },
      ]);

      const updatedAt = new Date('2024-01-01').toISOString();
      await characterRepo.addTeamToCharacters('team-1', ['Furina', 'Neuvillette'], updatedAt);

      const furina = await characterRepo.getByKey('Furina');
      const neuvillette = await characterRepo.getByKey('Neuvillette');

      expect(furina?.teamIds).toContain('team-1');
      expect(neuvillette?.teamIds).toContain('team-1');
      expect(furina?.updatedAt).toBe(updatedAt);
      expect(neuvillette?.updatedAt).toBe(updatedAt);
    });

    it('removes teamId from characters by key', async () => {
      await characterRepo.bulkCreate([
        { ...mockCharacterData, teamIds: ['team-1'] },
        { ...mockCharacterData, key: 'Neuvillette', teamIds: ['team-1'] },
      ]);

      const updatedAt = new Date('2024-01-02').toISOString();
      await characterRepo.removeTeamFromCharacters('team-1', ['Furina'], updatedAt);

      const furina = await characterRepo.getByKey('Furina');
      const neuvillette = await characterRepo.getByKey('Neuvillette');

      expect(furina?.teamIds).not.toContain('team-1');
      expect(neuvillette?.teamIds).toContain('team-1');
      expect(furina?.updatedAt).toBe(updatedAt);
      expect(neuvillette?.updatedAt).not.toBe(updatedAt);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle character with multiple artifacts', async () => {
      const charWith5Artifacts: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacterData,
        artifacts: [
          { setKey: 'GoldenTroupe', slotKey: 'flower', level: 20, rarity: 5, mainStatKey: 'hp', substats: [] },
          { setKey: 'GoldenTroupe', slotKey: 'plume', level: 20, rarity: 5, mainStatKey: 'atk', substats: [] },
          { setKey: 'GoldenTroupe', slotKey: 'sands', level: 20, rarity: 5, mainStatKey: 'hp_', substats: [] },
          { setKey: 'GoldenTroupe', slotKey: 'goblet', level: 20, rarity: 5, mainStatKey: 'hydro_dmg_', substats: [] },
          { setKey: 'GoldenTroupe', slotKey: 'circlet', level: 20, rarity: 5, mainStatKey: 'critRate', substats: [] },
        ],
      };

      const id = await characterRepo.create(charWith5Artifacts);
      const character = await characterRepo.getById(id);

      expect(character?.artifacts).toHaveLength(5);
    });

    it('should handle updating artifacts', async () => {
      const id = await characterRepo.create(mockCharacterData);

      await characterRepo.update(id, {
        artifacts: [
          { setKey: 'MarechausseeHunter', slotKey: 'flower', level: 20, rarity: 5, mainStatKey: 'hp', substats: [] },
        ],
      });

      const character = await characterRepo.getById(id);
      expect(character?.artifacts).toHaveLength(1);
      expect(character?.artifacts[0].setKey).toBe('MarechausseeHunter');
    });

    it('should handle character with no artifacts', async () => {
      const charNoArtifacts: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacterData,
        artifacts: [],
      };

      const id = await characterRepo.create(charNoArtifacts);
      const character = await characterRepo.getById(id);

      expect(character?.artifacts).toEqual([]);
    });
  });
});
