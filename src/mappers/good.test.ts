import { describe, it, expect } from 'vitest';
import { toGOOD, fromGOOD, validateGOOD, type GOODFormat } from './good';
import { toGoodStatKey, toGoodWeaponKey } from '@/lib/gameData';
import type { Character } from '@/types';

describe('GOOD Mapper', () => {
  const mockCharacter: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
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
          { key: 'critRate_', value: 3.9 },
          { key: 'critDMG_', value: 14.8 },
          { key: 'hp_', value: 10.5 },
          { key: 'def', value: 16 },
        ],
      },
      {
        setKey: 'GoldenTroupe',
        slotKey: 'plume',
        level: 20,
        rarity: 5,
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 7.8 },
          { key: 'critDMG_', value: 21.0 },
        ],
      },
    ],
    notes: 'Main DPS',
    priority: 'crowned',
    teamIds: [],
  };

  describe('toGOOD', () => {
    it('should convert internal format to GOOD format', () => {
      const result = toGOOD([mockCharacter as Character]);

      expect(result.format).toBe('GOOD');
      expect(result.version).toBe(2);
      expect(result.source).toBe('Genshin Progress Tracker');
      expect(result.active).toBe('Furina');
      expect(result.targets).toEqual([
        {
          level: 1,
          pos: [0, 0],
          radius: 1,
        },
      ]);
    });

    it('should export character data correctly', () => {
      const result = toGOOD([mockCharacter as Character]);

      expect(result.characters).toHaveLength(1);
      expect(result.characters![0]).toEqual({
        key: 'Furina',
        level: 90,
        ascension: 6,
        constellation: 2,
        talent: {
          auto: 9,
          skill: 10,
          burst: 10,
        },
      });
    });

    it('should export weapon data with location', () => {
      const result = toGOOD([mockCharacter as Character]);

      expect(result.weapons).toHaveLength(1);
      expect(result.weapons![0]).toEqual({
        key: 'SplendorOfTranquilWaters',
        level: 90,
        ascension: 6,
        refinement: 1,
        location: 'Furina',
        lock: true,
      });
    });

    it('should export artifact data with location', () => {
      const result = toGOOD([mockCharacter as Character]);

      expect(result.artifacts).toHaveLength(2);
      expect(result.artifacts![0]).toEqual({
        setKey: 'GoldenTroupe',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        location: 'Furina',
        lock: true,
        substats: [
          { key: 'critRate_', value: 3.9 },
          { key: 'critDMG_', value: 14.8 },
          { key: 'hp_', value: 10.5 },
          { key: 'def', value: 16 },
        ],
      });
    });

    it('should handle multiple characters', () => {
      const char2: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacter,
        key: 'Neuvillette',
      };

      const result = toGOOD([mockCharacter as Character, char2 as Character]);

      expect(result.characters).toHaveLength(2);
      expect(result.weapons).toHaveLength(2);
    });

    it('should handle characters with no artifacts', () => {
      const charNoArtifacts: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacter,
        artifacts: [],
      };

      const result = toGOOD([charNoArtifacts as Character]);

      expect(result.artifacts).toHaveLength(0);
      expect(result.characters).toHaveLength(1);
      expect(result.weapons).toHaveLength(1);
    });

    it('should handle empty character array', () => {
      const result = toGOOD([]);

      expect(result.format).toBe('GOOD');
      expect(result.characters).toHaveLength(0);
      expect(result.weapons).toHaveLength(0);
      expect(result.artifacts).toHaveLength(0);
      expect(result.targets).toEqual([]);
      expect(result.active).toBeUndefined();
    });
  });

  describe('fromGOOD', () => {
    it('should convert GOOD format to internal format', () => {
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Furina');
      expect(result[0].level).toBe(90);
      expect(result[0].constellation).toBe(2);
    });

    it('should restore weapon data', () => {
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      expect(result[0].weapon).toEqual({
        key: 'SplendorOfTranquilWaters',
        level: 90,
        ascension: 6,
        refinement: 1,
      });
    });

    it('should restore artifact data', () => {
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      expect(result[0].artifacts).toHaveLength(2);
      expect(result[0].artifacts[0].setKey).toBe('GoldenTroupe');
      expect(result[0].artifacts[0].substats).toHaveLength(4);
    });

    it('should set default values for optional fields', () => {
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      expect(result[0].notes).toBe('');
      expect(result[0].priority).toBe('unbuilt');
      expect(result[0].teamIds).toEqual([]);
    });

    it('should skip characters without weapons', () => {
      const goodData: GOODFormat = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        characters: [
          {
            key: 'Furina',
            level: 90,
            ascension: 6,
            constellation: 2,
            talent: { auto: 9, skill: 10, burst: 10 },
          },
        ],
        weapons: [], // No weapons
        artifacts: [],
      };

      const result = fromGOOD(goodData);

      expect(result).toHaveLength(0);
    });

    it('should handle characters with no artifacts', () => {
      const goodData: GOODFormat = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        characters: [
          {
            key: 'Furina',
            level: 90,
            ascension: 6,
            constellation: 2,
            talent: { auto: 9, skill: 10, burst: 10 },
          },
        ],
        weapons: [
          {
            key: 'Splendor of Tranquil Waters',
            level: 90,
            ascension: 6,
            refinement: 1,
            location: 'Furina',
            lock: true,
          },
        ],
        artifacts: [], // No artifacts
      };

      const result = fromGOOD(goodData);

      expect(result).toHaveLength(1);
      expect(result[0].artifacts).toHaveLength(0);
    });

    it('should throw error for invalid format', () => {
      const invalidData = {
        format: 'INVALID',
        version: 2,
        source: 'Test',
      };

      expect(() => fromGOOD(invalidData as GOODFormat)).toThrow(
        'Invalid format: expected GOOD format'
      );
    });

    it('should handle missing optional arrays', () => {
      const goodData: GOODFormat = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
      };

      const result = fromGOOD(goodData);

      expect(result).toHaveLength(0);
    });
  });

  describe('validateGOOD', () => {
    it('should validate correct GOOD format', () => {
      const validData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        active: 'Furina',
        targets: [
          {
            level: 1,
            pos: [0, 0],
            radius: 1,
          },
        ],
        characters: [],
        weapons: [],
        artifacts: [],
      };

      expect(validateGOOD(validData)).toBe(true);
    });

    it('should validate GOOD format without optional fields', () => {
      const validData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
      };

      expect(validateGOOD(validData)).toBe(true);
    });

    it('should reject null input', () => {
      expect(validateGOOD(null)).toBe(false);
    });

    it('should reject non-object input', () => {
      expect(validateGOOD('string')).toBe(false);
      expect(validateGOOD(123)).toBe(false);
      expect(validateGOOD([])).toBe(false);
    });

    it('should reject invalid format field', () => {
      const invalidData = {
        format: 'INVALID',
        version: 2,
        source: 'Test',
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject missing version field', () => {
      const invalidData = {
        format: 'GOOD',
        source: 'Test',
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject non-number version', () => {
      const invalidData = {
        format: 'GOOD',
        version: '2',
        source: 'Test',
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject non-array characters field', () => {
      const invalidData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        characters: 'not an array',
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject invalid character entries', () => {
      const invalidData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        characters: [
          {
            key: 'Furina',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 10, skill: 10 }, // missing burst
          },
        ],
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should validate GOOD format with populated arrays', () => {
      const validData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        active: 'Furina',
        targets: [
          {
            level: 90,
            pos: [0, 0],
            radius: 1,
          },
        ],
        characters: [
          {
            key: 'Furina',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 10, skill: 10, burst: 10 },
          },
        ],
        weapons: [
          {
            key: 'weapon',
            level: 90,
            ascension: 6,
            refinement: 1,
            location: 'Furina',
            lock: true,
          },
        ],
        artifacts: [
          {
            setKey: 'MarechausseeHunter',
            slotKey: 'flower',
            level: 20,
            rarity: 5,
            mainStatKey: 'hp_',
            location: 'Furina',
            lock: true,
            substats: [
              { key: 'hp_', value: 4.1 },
              { key: 'atk_', value: 2 },
            ],
          },
        ],
      };

      expect(validateGOOD(validData)).toBe(true);
    });

    it('should reject invalid weapon entries', () => {
      const invalidData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        weapons: [
          {
            key: 'weapon',
            level: '90',
            ascension: 6,
            refinement: 1,
            location: 'Furina',
            lock: true,
          },
        ],
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject invalid artifact entries', () => {
      const invalidData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        artifacts: [
          {
            setKey: 'MarechausseeHunter',
            slotKey: 'flower',
            level: 20,
            rarity: 5,
            mainStatKey: 'hp_',
            location: 'Furina',
            lock: 'true',
            substats: [{ key: 'hp_', value: 4.1 }],
          },
          {
            setKey: 'MarechausseeHunter',
            slotKey: 'plume',
            level: 20,
            rarity: 5,
            mainStatKey: 'atk',
            location: 'Furina',
            lock: true,
            substats: [{ key: 'hp_', value: 'not-a-number' }],
          },
        ],
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });

    it('should reject invalid targets', () => {
      const invalidData = {
        format: 'GOOD',
        version: 2,
        source: 'Test',
        targets: [
          {
            level: '1',
            pos: [0, 0],
            radius: 1,
          },
        ],
      };

      expect(validateGOOD(invalidData)).toBe(false);
    });
  });

  describe('Bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      // Internal -> GOOD -> Internal
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      expect(result[0].key).toBe(mockCharacter.key);
      expect(result[0].level).toBe(mockCharacter.level);
      expect(result[0].ascension).toBe(mockCharacter.ascension);
      expect(result[0].constellation).toBe(mockCharacter.constellation);
      expect(result[0].talent).toEqual(mockCharacter.talent);
      expect(result[0].weapon).toEqual({
        ...mockCharacter.weapon,
        key: toGoodWeaponKey(mockCharacter.weapon.key),
      });
      expect(result[0].artifacts).toHaveLength(mockCharacter.artifacts.length);
    });

    it('should preserve artifact substats through round-trip', () => {
      const goodData = toGOOD([mockCharacter as Character]);
      const result = fromGOOD(goodData);

      const originalSubstats = mockCharacter.artifacts[0].substats.map((substat) => ({
        ...substat,
        key: toGoodStatKey(substat.key),
      }));
      const roundTripSubstats = result[0].artifacts[0].substats;

      expect(roundTripSubstats).toEqual(originalSubstats);
    });

    it('should handle multiple characters in round-trip', () => {
      const char1 = mockCharacter;
      const char2: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacter,
        key: 'Neuvillette',
        level: 80,
        constellation: 0,
      };

      const goodData = toGOOD([char1 as Character, char2 as Character]);
      const result = fromGOOD(goodData);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.key)).toEqual(['Furina', 'Neuvillette']);
    });
  });
});
