import { describe, it, expect } from 'vitest';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { CHARACTER_METADATA } from '@/features/roster/data/characterMetadata';
import {
  NORMAL_BOSS_MATERIALS,
  STATIC_MATERIAL_CHARACTER_KEYS,
  WEEKLY_BOSS_MATERIALS,
  findStaticMaterialCoverageGaps,
  getStaticCharacterMaterials,
  hasStaticMaterialData,
} from './characterMaterialMap';

const TRAVELER_KEYS = new Set([
  'TravelerAnemo',
  'TravelerGeo',
  'TravelerElectro',
  'TravelerDendro',
  'TravelerHydro',
  'TravelerPyro',
]);

/**
 * Entries whose boss / weekly values reference 6.x (Nod-Krai) items that have
 * not been verified against the game. They are excluded from the allowlist
 * check below; remove a key from this set once its materials are confirmed.
 */
const UNVERIFIED_MATERIAL_ENTRIES = new Set([
  'Aino',
  'Columbina',
  'Durin',
  'Flins',
  'Ifa',
  'Illuga',
  'Jahoda',
  'Lauma',
  'Linnea',
  'Lohen',
  'Nefer',
  'Nicole',
  'Prune',
  'Sandrone',
  'Varka',
  'Zibai',
]);

describe('characterMaterialMap', () => {
  describe('getStaticCharacterMaterials', () => {
    it('returns material data for known characters', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Hydro');
      expect(data!.ascensionMaterials.gem.baseName).toBe('Varunada Lazurite');
      expect(data!.ascensionMaterials.boss.name).toBe('Water That Failed to Transcend');
      expect(data!.ascensionMaterials.localSpecialty.name).toBe('Lakelight Lily');
      expect(data!.talentMaterials.books.series).toBe('Justice');
      expect(data!.talentMaterials.weekly.name).toBe('Lightless Mass');
    });

    it('returns material data for characters with space keys', () => {
      const data = getStaticCharacterMaterials('Hu Tao');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Pyro');
      expect(data!.ascensionMaterials.boss.name).toBe('Juvenile Jade');
    });

    it('returns material data for PascalCase keys', () => {
      const data = getStaticCharacterMaterials('KaedeharaKazuha');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Anemo');
    });

    it('returns material data for display-name aliases', () => {
      expect(getStaticCharacterMaterials('Kamisato Ayaka')?.characterKey).toBe('KamisatoAyaka');
      expect(getStaticCharacterMaterials('Raiden Shogun')?.characterKey).toBe('RaidenShogun');
      expect(getStaticCharacterMaterials('Sangonomiya Kokomi')?.characterKey).toBe('Kokomi');
      expect(getStaticCharacterMaterials('Yumemizuki Mizuki')?.characterKey).toBe('Mizuki');
      expect(getStaticCharacterMaterials('Lumine')?.characterKey).toBe('TravelerAnemo');
      expect(getStaticCharacterMaterials('Olorun')?.characterKey).toBe('Ororon');
    });

    it('is case-insensitive', () => {
      const data = getStaticCharacterMaterials('furina');
      expect(data).not.toBeNull();
      expect(data!.element).toBe('Hydro');
    });

    it('returns null for unknown characters', () => {
      expect(getStaticCharacterMaterials('TotallyFakeCharacter')).toBeNull();
    });

    it('includes talent book farming days', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data!.talentMaterials.books.days.length).toBeGreaterThan(0);
    });

    it('includes common material tier names', () => {
      const data = getStaticCharacterMaterials('Furina');
      const tierNames = data!.ascensionMaterials.common.tierNames;
      expect(tierNames.gray).toBe('Whopperflower Nectar');
      expect(tierNames.green).toBe('Shimmering Nectar');
      expect(tierNames.blue).toBe('Energy Nectar');
    });

    it('has apiVersion set to "static"', () => {
      const data = getStaticCharacterMaterials('Furina');
      expect(data!.apiVersion).toBe('static');
    });
  });

  describe('hasStaticMaterialData', () => {
    it('returns true for known characters', () => {
      expect(hasStaticMaterialData('Furina')).toBe(true);
      expect(hasStaticMaterialData('Bennett')).toBe(true);
      expect(hasStaticMaterialData('RaidenShogun')).toBe(true);
    });

    it('returns false for unknown characters', () => {
      expect(hasStaticMaterialData('UnknownChar')).toBe(false);
    });
  });

  describe('coverage gap helper', () => {
    it('flags missing entries and keeps newer shared data covered', () => {
      expect(findStaticMaterialCoverageGaps(['Linnea', 'Escoffier', 'Sethos'])).toEqual([]);
      expect(findStaticMaterialCoverageGaps(['TotallyFakeCharacter'])).toEqual([
        { characterKey: 'TotallyFakeCharacter', reasons: ['missing-entry'] },
      ]);
    });
  });

  describe('boss material allowlists', () => {
    it('lists each weekly boss drop exactly once, three per boss', () => {
      expect(new Set(WEEKLY_BOSS_MATERIALS).size).toBe(WEEKLY_BOSS_MATERIALS.length);
      expect(WEEKLY_BOSS_MATERIALS.length % 3).toBe(0);
      expect(new Set(NORMAL_BOSS_MATERIALS).size).toBe(NORMAL_BOSS_MATERIALS.length);
    });

    it('only uses verified boss and weekly boss materials outside the documented unverified set', () => {
      const normalBoss = new Set(NORMAL_BOSS_MATERIALS);
      const weeklyBoss = new Set(WEEKLY_BOSS_MATERIALS);
      const offList: string[] = [];

      for (const key of STATIC_MATERIAL_CHARACTER_KEYS) {
        if (UNVERIFIED_MATERIAL_ENTRIES.has(key)) continue;
        const data = getStaticCharacterMaterials(key)!;
        // The Traveler has no boss ascension item; the map stores a gem placeholder.
        if (!TRAVELER_KEYS.has(key) && !normalBoss.has(data.ascensionMaterials.boss.name)) {
          offList.push(`${key}: boss '${data.ascensionMaterials.boss.name}'`);
        }
        if (!weeklyBoss.has(data.talentMaterials.weekly.name)) {
          offList.push(`${key}: weekly '${data.talentMaterials.weekly.name}'`);
        }
      }

      expect(offList).toEqual([]);
    });

    it('keeps the unverified set limited to entries that actually need it', () => {
      const normalBoss = new Set(NORMAL_BOSS_MATERIALS);
      const weeklyBoss = new Set(WEEKLY_BOSS_MATERIALS);
      const noLongerNeeded = Array.from(UNVERIFIED_MATERIAL_ENTRIES).filter((key) => {
        const data = getStaticCharacterMaterials(key);
        return (
          data &&
          normalBoss.has(data.ascensionMaterials.boss.name) &&
          weeklyBoss.has(data.talentMaterials.weekly.name)
        );
      });

      expect(noLongerNeeded).toEqual([]);
    });
  });

  describe('coverage', () => {
    const knownCharacters = [
      'Furina', 'Neuvillette', 'KaedeharaKazuha', 'Nahida', 'RaidenShogun',
      'Zhongli', 'Hu Tao', 'Ganyu', 'Xiao', 'Venti', 'Yelan',
      'Ayaka', 'Ayato', 'Tighnari', 'Alhaitham', 'Nilou', 'Wanderer',
      'Lyney', 'Lynette', 'Freminet', 'Wriothesley', 'Navia',
      'Chiori', 'Clorinde', 'Sigewinne', 'Emilie',
      'Kinich', 'Mualani', 'Xilonen', 'Citlali', 'Mavuika',
      'Arlecchino', 'Xianyun', 'Bennett', 'Xiangling', 'Xingqiu',
      'Fischl', 'Sucrose', 'Diona', 'Mona', 'Jean', 'Diluc',
      'Keqing', 'Qiqi', 'Tartaglia', 'Eula', 'Yoimiya', 'Kokomi',
      'Shenhe', 'YaeMiko', 'Dehya', 'Baizhu', 'Chasca',
    ];

    it.each(knownCharacters)('has material data for %s', (charKey) => {
      const data = getStaticCharacterMaterials(charKey);
      expect(data, `Missing static data for ${charKey}`).not.toBeNull();
      expect(data!.ascensionMaterials.boss.name).toBeTruthy();
      expect(data!.ascensionMaterials.localSpecialty.name).toBeTruthy();
      expect(data!.talentMaterials.books.series).toBeTruthy();
      expect(data!.talentMaterials.weekly.name).toBeTruthy();
    });

    it('scans all planner characters and display names for fallback material gaps', () => {
      const plannerKeys = ALL_CHARACTERS.flatMap((character) => [character.key, character.name]);
      expect(findStaticMaterialCoverageGaps(plannerKeys)).toEqual([]);
    });

    it('scans released roster metadata while documenting metadata-only placeholders', () => {
      const metadataOnlyPlaceholders = new Set(['Avero', 'Iljane', 'Manekin', 'Manekina']);
      const releasedOrResolvableKeys = CHARACTER_METADATA
        .map((character) => character.key)
        .filter((key) => !metadataOnlyPlaceholders.has(key));

      expect(findStaticMaterialCoverageGaps(releasedOrResolvableKeys)).toEqual([]);
    });

    it('reports missing static data with a machine-readable reason', () => {
      expect(findStaticMaterialCoverageGaps(['TotallyFakeCharacter'])).toEqual([
        { characterKey: 'TotallyFakeCharacter', reasons: ['missing-entry'] },
      ]);
    });

    it('keeps corrected Fontaine/Natlan material assignments', () => {
      expect(getStaticCharacterMaterials('Sigewinne')?.ascensionMaterials.boss.name).toBe(
        'Water That Failed to Transcend'
      );
      expect(getStaticCharacterMaterials('Wriothesley')?.talentMaterials.weekly.name).toBe(
        'Primordial Greenbloom'
      );
      expect(getStaticCharacterMaterials('Mavuika')?.ascensionMaterials.boss.name).toBe(
        'Sparkless Statue Core'
      );
      expect(getStaticCharacterMaterials('Mualani')?.ascensionMaterials.boss.name).toBe(
        'Mark of the Binding Blessing'
      );
      expect(getStaticCharacterMaterials('Xilonen')?.talentMaterials.weekly.name).toBe(
        'Mirror of Mushin'
      );
    });

    it('keeps corrected Sethos material assignments', () => {
      const data = getStaticCharacterMaterials('Sethos');
      expect(data?.ascensionMaterials.boss.name).toBe('Cloudseam Scale');
      expect(data?.ascensionMaterials.localSpecialty.name).toBe('Trishiraite');
    });
  });
});
