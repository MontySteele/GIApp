import { describe, it, expect, vi } from 'vitest';
import { GOOD_EXPORT_VERSION, toGOOD, toGOODWithInventory, validateGOOD, type GOODFormat } from './good';
import { validateIrminsulFormat, fromIrminsul } from './irminsul';
import type { Character, InventoryArtifact, InventoryWeapon } from '@/types';

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
    priority: 'main',
    teamIds: [],
  };

  describe('toGOOD', () => {
    it('should convert internal format to GOOD format', () => {
      const result = toGOOD([mockCharacter as Character]);

      expect(result.format).toBe('GOOD');
      expect(result.version).toBe(3);
      expect(result.version).toBe(GOOD_EXPORT_VERSION);
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

    it('should clamp artifact level to the max for its rarity', () => {
      const charWithOverleveledArtifact: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
        ...mockCharacter,
        artifacts: [
          {
            setKey: 'GoldenTroupe',
            slotKey: 'circlet',
            level: 17,
            rarity: 4,
            mainStatKey: 'critRate_',
            substats: [],
          },
        ],
      };

      const result = toGOOD([charWithOverleveledArtifact as Character]);

      expect(result.artifacts).toHaveLength(1);
      expect(result.artifacts![0].level).toBe(16);
      expect(result.artifacts![0].rarity).toBe(4);
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

    it('keeps a character without a weapon row and omits only the weapon entry', () => {
      // GOOD characters do not require a weapon; weapons are a separate array
      // joined by `location`. Legacy rows can lack the embedded weapon object.
      const noWeapon = { ...mockCharacter, weapon: undefined } as unknown as Character;
      const emptyWeaponKey = {
        ...mockCharacter,
        key: 'Neuvillette',
        weapon: { key: '', level: 1, ascension: 0, refinement: 1 },
      } as Character;

      const result = toGOOD([noWeapon, emptyWeaponKey]);

      expect(result.characters!.map((c) => c.key)).toEqual(['Furina', 'Neuvillette']);
      expect(result.weapons).toEqual([]);
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

  describe('toGOODWithInventory', () => {
    const makeInventoryArtifact = (overrides: Partial<InventoryArtifact> = {}): InventoryArtifact => ({
      id: 'inv-artifact-1',
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
      location: 'Furina',
      lock: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      ...overrides,
    });

    it('exports inventory artifacts as the single source of truth', () => {
      // The character carries a stale embedded copy (+16) of a piece that the
      // inventory table has at +20. The old dedup key (which ignored substats
      // and matched on level) exported BOTH copies in this situation, creating
      // a phantom artifact. Only the inventory copy may be exported.
      const staleCharacter = {
        ...mockCharacter,
        artifacts: [
          { ...mockCharacter.artifacts[0], level: 16 },
        ],
      };
      const freshInventoryCopy = makeInventoryArtifact({ level: 20 });

      const exported = toGOODWithInventory({
        characters: [staleCharacter as Character],
        inventoryArtifacts: [freshInventoryCopy],
        inventoryWeapons: [],
        materials: {},
      });

      expect(exported.artifacts).toHaveLength(1);
      expect(exported.artifacts![0].level).toBe(20);
      expect(exported.artifacts![0].location).toBe('Furina');
    });

    it('does not export a stale embedded copy when inventory has the same key', () => {
      // Same set/slot/mainStat/level but different substats: previously the
      // embedded (stale) copy shadowed the fresh inventory copy.
      const embeddedSubstats = [{ key: 'atk_', value: 5.0 }];
      const staleCharacter = {
        ...mockCharacter,
        artifacts: [{ ...mockCharacter.artifacts[0], substats: embeddedSubstats }],
      };
      const freshInventoryCopy = makeInventoryArtifact();

      const exported = toGOODWithInventory({
        characters: [staleCharacter as Character],
        inventoryArtifacts: [freshInventoryCopy],
        inventoryWeapons: [],
        materials: {},
      });

      expect(exported.artifacts).toHaveLength(1);
      expect(exported.artifacts![0].substats).toHaveLength(4);
      expect(exported.artifacts![0].substats[0]).toEqual({ key: 'critRate_', value: 3.9 });
    });

    it('falls back to character-embedded artifacts when inventory is empty', () => {
      const exported = toGOODWithInventory({
        characters: [mockCharacter as Character],
        inventoryArtifacts: [],
        inventoryWeapons: [],
        materials: { MoraItem: 100 },
      });

      expect(exported.artifacts).toHaveLength(2);
      expect(exported.artifacts!.every((a) => a.location === 'Furina')).toBe(true);
    });

    it('exports inventory weapons as the source of truth when present', () => {
      const inventoryWeapon: InventoryWeapon = {
        id: 'inv-weapon-1',
        key: 'FavoniusSword',
        level: 90,
        ascension: 6,
        refinement: 5,
        location: '',
        lock: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      const exported = toGOODWithInventory({
        characters: [mockCharacter as Character],
        inventoryArtifacts: [],
        inventoryWeapons: [inventoryWeapon],
        materials: {},
      });

      expect(exported.weapons).toHaveLength(1);
      expect(exported.weapons![0].key).toBe('FavoniusSword');
    });

    it('falls back to character-embedded weapons when inventory is empty', () => {
      const exported = toGOODWithInventory({
        characters: [mockCharacter as Character],
        inventoryArtifacts: [],
        inventoryWeapons: [],
        materials: {},
      });

      expect(exported.weapons).toHaveLength(1);
      expect(exported.weapons![0].location).toBe('Furina');
    });

    it('does not drop characters that lack a weapon row in the embedded fallback', () => {
      const noWeapon = { ...mockCharacter, weapon: undefined } as unknown as Character;

      const exported = toGOODWithInventory({
        characters: [noWeapon],
        inventoryArtifacts: [],
        inventoryWeapons: [],
        materials: {},
      });

      expect(exported.characters).toHaveLength(1);
      expect(exported.weapons).toEqual([]);
    });

    it('emits the same GOOD version as toGOOD', () => {
      const full = toGOODWithInventory({
        characters: [mockCharacter as Character],
        inventoryArtifacts: [],
        inventoryWeapons: [],
        materials: {},
      });

      expect(full.version).toBe(GOOD_EXPORT_VERSION);
      expect(full.version).toBe(toGOOD([mockCharacter as Character]).version);
    });

    it('round-trips through the Irminsul import pipeline', () => {
      // Cross-device sync path: GOOD export on one device, imported on
      // another through the (single) Irminsul/GOOD import pipeline.
      const unequippedArtifact = makeInventoryArtifact({
        id: 'test-artifact-1',
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'goblet',
        mainStatKey: 'pyro_dmg_',
        substats: [
          { key: 'critRate_', value: 7.8 },
          { key: 'critDMG_', value: 15.5 },
          { key: 'atk_', value: 9.3 },
          { key: 'eleMas', value: 23 },
        ],
        location: '',
        lock: false,
      });

      const exported = toGOODWithInventory({
        characters: [mockCharacter as Character],
        inventoryArtifacts: [unequippedArtifact],
        inventoryWeapons: [],
        materials: { MoraItem: 1000000 },
      });

      expect(validateIrminsulFormat(exported)).toBe(true);
      const imported = fromIrminsul(exported);

      expect(imported.characters).toHaveLength(1);
      expect(imported.materials).toEqual({ MoraItem: 1000000 });

      const cwGoblet = imported.artifacts.find(
        (a) => a.setKey === 'CrimsonWitchOfFlames' && a.slotKey === 'goblet'
      );
      expect(cwGoblet).toBeDefined();
      expect(cwGoblet!.mainStatKey).toBe('pyro_dmg_');
      expect(cwGoblet!.location).toBe('');
      // Substat display order must survive the round-trip (matches game UI)
      expect(cwGoblet!.substats.map((s) => s.key)).toEqual([
        'critRate_', 'critDMG_', 'atk_', 'eleMas',
      ]);
      // IDs come from the shared Irminsul namespace, not a separate scheme
      expect(cwGoblet!.id.startsWith('artifact:')).toBe(true);
    });
  });
});
