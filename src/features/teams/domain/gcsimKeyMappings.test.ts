import { describe, it, expect } from 'vitest';
import {
  toGcsimCharacterKey,
  toGcsimWeaponKey,
  toGcsimArtifactSetKey,
  toGcsimStatKey,
  toGcsimStatValue,
  formatGcsimStat,
  countArtifactSets,
  getArtifactSetConfig,
  CHARACTER_KEY_MAP,
  WEAPON_KEY_MAP,
  ARTIFACT_SET_KEY_MAP,
  STAT_KEY_MAP,
  PERCENTAGE_STATS,
} from './gcsimKeyMappings';

describe('gcsimKeyMappings', () => {
  describe('toGcsimCharacterKey', () => {
    it('converts simple character names', () => {
      expect(toGcsimCharacterKey('Furina')).toBe('furina');
      expect(toGcsimCharacterKey('Nahida')).toBe('nahida');
      expect(toGcsimCharacterKey('Xiangling')).toBe('xiangling');
      expect(toGcsimCharacterKey('Bennett')).toBe('bennett');
    });

    it('handles multi-word character names with special mappings', () => {
      expect(toGcsimCharacterKey('Raiden Shogun')).toBe('raiden');
      expect(toGcsimCharacterKey('RaidenShogun')).toBe('raiden');
      expect(toGcsimCharacterKey('Raiden')).toBe('raiden');
    });

    it('handles Kamisato siblings', () => {
      expect(toGcsimCharacterKey('Kamisato Ayaka')).toBe('ayaka');
      expect(toGcsimCharacterKey('KamisatoAyaka')).toBe('ayaka');
      expect(toGcsimCharacterKey('Ayaka')).toBe('ayaka');

      expect(toGcsimCharacterKey('Kamisato Ayato')).toBe('ayato');
      expect(toGcsimCharacterKey('KamisatoAyato')).toBe('ayato');
      expect(toGcsimCharacterKey('Ayato')).toBe('ayato');
    });

    it('handles Kazuha', () => {
      expect(toGcsimCharacterKey('Kaedehara Kazuha')).toBe('kazuha');
      expect(toGcsimCharacterKey('KaedeharaKazuha')).toBe('kazuha');
      expect(toGcsimCharacterKey('Kazuha')).toBe('kazuha');
    });

    it('handles Hu Tao', () => {
      expect(toGcsimCharacterKey('Hu Tao')).toBe('hutao');
      expect(toGcsimCharacterKey('HuTao')).toBe('hutao');
    });

    it('handles Tartaglia/Childe', () => {
      expect(toGcsimCharacterKey('Tartaglia')).toBe('tartaglia');
      expect(toGcsimCharacterKey('Childe')).toBe('tartaglia');
    });

    it('handles Traveler variants', () => {
      expect(toGcsimCharacterKey('Traveler')).toBe('traveler');
      expect(toGcsimCharacterKey('Aether')).toBe('traveler');
      expect(toGcsimCharacterKey('Lumine')).toBe('traveler');
      expect(toGcsimCharacterKey('TravelerAnemo')).toBe('traveler');
      expect(toGcsimCharacterKey('TravelerDendro')).toBe('traveler');
    });

    it('falls back to lowercase for unknown characters', () => {
      expect(toGcsimCharacterKey('NewCharacter')).toBe('newcharacter');
      expect(toGcsimCharacterKey('Some Random Name')).toBe('somerandomname');
    });
  });

  describe('toGcsimWeaponKey', () => {
    it('converts 5-star signature weapons', () => {
      expect(toGcsimWeaponKey('MistsplitterReforged')).toBe('mistsplitter');
      expect(toGcsimWeaponKey('StaffOfHoma')).toBe('homa');
      expect(toGcsimWeaponKey('EngulfingLightning')).toBe('engulfing');
      expect(toGcsimWeaponKey('AmosBow')).toBe('amos');
      expect(toGcsimWeaponKey('AThousandFloatingDreams')).toBe('athousandfloatingdreams');
    });

    it('converts common 4-star weapons', () => {
      expect(toGcsimWeaponKey('TheCatch')).toBe('catch');
      expect(toGcsimWeaponKey('The Catch')).toBe('catch');
      expect(toGcsimWeaponKey('SacrificialSword')).toBe('sacrifical');
      expect(toGcsimWeaponKey('FavoniusSword')).toBe('favonius');
      expect(toGcsimWeaponKey('TheStringless')).toBe('stringless');
      expect(toGcsimWeaponKey('TheWidsith')).toBe('widsith');
    });

    it('converts 3-star weapons', () => {
      expect(toGcsimWeaponKey('HarbingerOfDawn')).toBe('harbinger');
      expect(toGcsimWeaponKey('ThrillingTalesOfDragonSlayers')).toBe('thrilling');
      expect(toGcsimWeaponKey('WhiteTassel')).toBe('whitetassel');
    });

    it('falls back to lowercase for unknown weapons', () => {
      expect(toGcsimWeaponKey('UnknownWeapon')).toBe('unknownweapon');
    });
  });

  describe('toGcsimArtifactSetKey', () => {
    it('converts popular artifact sets', () => {
      expect(toGcsimArtifactSetKey('EmblemOfSeveredFate')).toBe('emblem');
      expect(toGcsimArtifactSetKey('GladiatorsFinale')).toBe('gladiator');
      expect(toGcsimArtifactSetKey('ViridescentVenerer')).toBe('viridescent');
      expect(toGcsimArtifactSetKey('NoblesseOblige')).toBe('noblesse');
      expect(toGcsimArtifactSetKey('CrimsonWitchOfFlames')).toBe('crimson');
    });

    it('converts newer artifact sets', () => {
      expect(toGcsimArtifactSetKey('GoldenTroupe')).toBe('goldentroupe');
      expect(toGcsimArtifactSetKey('MarechausseeHunter')).toBe('marechausseehunter');
      expect(toGcsimArtifactSetKey('NymphsDream')).toBe('nymphsdream');
      expect(toGcsimArtifactSetKey('FragmentOfHarmonicWhimsy')).toBe('fragmentofharmonicwhimsy');
    });

    it('falls back to lowercase for unknown sets', () => {
      expect(toGcsimArtifactSetKey('UnknownSet')).toBe('unknownset');
    });
  });

  describe('toGcsimStatKey', () => {
    it('converts stat keys correctly', () => {
      expect(toGcsimStatKey('critRate_')).toBe('cr');
      expect(toGcsimStatKey('critDMG_')).toBe('cd');
      expect(toGcsimStatKey('hp')).toBe('hp');
      expect(toGcsimStatKey('hp_')).toBe('hp%');
      expect(toGcsimStatKey('atk')).toBe('atk');
      expect(toGcsimStatKey('atk_')).toBe('atk%');
      expect(toGcsimStatKey('def')).toBe('def');
      expect(toGcsimStatKey('def_')).toBe('def%');
      expect(toGcsimStatKey('eleMas')).toBe('em');
      expect(toGcsimStatKey('enerRech_')).toBe('er');
    });

    it('converts elemental DMG bonus keys', () => {
      expect(toGcsimStatKey('pyro_dmg_')).toBe('pyro%');
      expect(toGcsimStatKey('hydro_dmg_')).toBe('hydro%');
      expect(toGcsimStatKey('electro_dmg_')).toBe('electro%');
      expect(toGcsimStatKey('cryo_dmg_')).toBe('cryo%');
      expect(toGcsimStatKey('anemo_dmg_')).toBe('anemo%');
      expect(toGcsimStatKey('geo_dmg_')).toBe('geo%');
      expect(toGcsimStatKey('dendro_dmg_')).toBe('dendro%');
      expect(toGcsimStatKey('physical_dmg_')).toBe('phys%');
    });
  });

  describe('toGcsimStatValue', () => {
    it('converts percentage stats from 0-100 to 0-1 format', () => {
      expect(toGcsimStatValue('critRate_', 31.1)).toBeCloseTo(0.311, 4);
      expect(toGcsimStatValue('critDMG_', 62.2)).toBeCloseTo(0.622, 4);
      expect(toGcsimStatValue('enerRech_', 51.8)).toBeCloseTo(0.518, 4);
      expect(toGcsimStatValue('hp_', 46.6)).toBeCloseTo(0.466, 4);
    });

    it('keeps flat stats unchanged', () => {
      expect(toGcsimStatValue('hp', 4780)).toBe(4780);
      expect(toGcsimStatValue('atk', 311)).toBe(311);
      expect(toGcsimStatValue('def', 39)).toBe(39);
      expect(toGcsimStatValue('eleMas', 186)).toBe(186);
    });

    it('respects isPercentageValue flag', () => {
      // When value is already decimal, don't convert
      expect(toGcsimStatValue('critRate_', 0.311, false)).toBe(0.311);
      expect(toGcsimStatValue('enerRech_', 0.518, false)).toBe(0.518);
    });
  });

  describe('formatGcsimStat', () => {
    it('formats percentage stats with decimal values', () => {
      expect(formatGcsimStat('critRate_', 31.1)).toBe('cr=0.3110');
      expect(formatGcsimStat('critDMG_', 62.2)).toBe('cd=0.6220');
      expect(formatGcsimStat('enerRech_', 51.8)).toBe('er=0.5180');
    });

    it('formats flat stats as integers', () => {
      expect(formatGcsimStat('hp', 4780)).toBe('hp=4780');
      expect(formatGcsimStat('atk', 311)).toBe('atk=311');
      expect(formatGcsimStat('eleMas', 186.5)).toBe('em=187');
    });
  });

  describe('countArtifactSets', () => {
    it('counts artifacts by set', () => {
      const artifacts = [
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'GladiatorsFinale' },
      ];

      const counts = countArtifactSets(artifacts);
      expect(counts.get('EmblemOfSeveredFate')).toBe(4);
      expect(counts.get('GladiatorsFinale')).toBe(1);
    });

    it('handles empty arrays', () => {
      const counts = countArtifactSets([]);
      expect(counts.size).toBe(0);
    });
  });

  describe('getArtifactSetConfig', () => {
    it('returns 4pc set configuration', () => {
      const artifacts = [
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'EmblemOfSeveredFate' },
        { setKey: 'GladiatorsFinale' },
      ];

      const config = getArtifactSetConfig(artifacts);
      expect(config).toEqual([{ setKey: 'EmblemOfSeveredFate', count: 4 }]);
    });

    it('returns 2pc+2pc configuration', () => {
      const artifacts = [
        { setKey: 'GladiatorsFinale' },
        { setKey: 'GladiatorsFinale' },
        { setKey: 'ShimenawasReminiscence' },
        { setKey: 'ShimenawasReminiscence' },
        { setKey: 'WanderersTroupe' },
      ];

      const config = getArtifactSetConfig(artifacts);
      expect(config).toHaveLength(2);
      expect(config).toContainEqual({ setKey: 'GladiatorsFinale', count: 2 });
      expect(config).toContainEqual({ setKey: 'ShimenawasReminiscence', count: 2 });
    });

    it('ignores single pieces (rainbow build)', () => {
      const artifacts = [
        { setKey: 'Set1' },
        { setKey: 'Set2' },
        { setKey: 'Set3' },
        { setKey: 'Set4' },
        { setKey: 'Set5' },
      ];

      const config = getArtifactSetConfig(artifacts);
      expect(config).toEqual([]);
    });
  });

  describe('mapping completeness', () => {
    it('has character mappings for common characters', () => {
      const commonCharacters = [
        'Bennett', 'Xiangling', 'Xingqiu', 'Fischl', 'Sucrose',
        'Furina', 'Nahida', 'Kazuha', 'Zhongli', 'Raiden',
      ];

      for (const char of commonCharacters) {
        const result = toGcsimCharacterKey(char);
        expect(result).toBeTruthy();
        expect(result).not.toContain(' ');
        expect(result).toBe(result.toLowerCase());
      }
    });

    it('has weapon mappings for common weapons', () => {
      const commonWeapons = [
        'TheCatch', 'SacrificialSword', 'FavoniusSword', 'TheStringless',
        'StaffOfHoma', 'MistsplitterReforged', 'EngulfingLightning',
      ];

      for (const weapon of commonWeapons) {
        const result = toGcsimWeaponKey(weapon);
        expect(result).toBeTruthy();
        expect(result).not.toContain(' ');
        expect(result).toBe(result.toLowerCase());
      }
    });

    it('has artifact mappings for common sets', () => {
      const commonSets = [
        'EmblemOfSeveredFate', 'GladiatorsFinale', 'ViridescentVenerer',
        'NoblesseOblige', 'CrimsonWitchOfFlames', 'BlizzardStrayer',
      ];

      for (const set of commonSets) {
        const result = toGcsimArtifactSetKey(set);
        expect(result).toBeTruthy();
        expect(result).not.toContain(' ');
        expect(result).toBe(result.toLowerCase());
      }
    });
  });

  describe('PERCENTAGE_STATS set', () => {
    it('contains all percentage-based stats', () => {
      expect(PERCENTAGE_STATS.has('hp_')).toBe(true);
      expect(PERCENTAGE_STATS.has('atk_')).toBe(true);
      expect(PERCENTAGE_STATS.has('def_')).toBe(true);
      expect(PERCENTAGE_STATS.has('critRate_')).toBe(true);
      expect(PERCENTAGE_STATS.has('critDMG_')).toBe(true);
      expect(PERCENTAGE_STATS.has('enerRech_')).toBe(true);
    });

    it('does not contain flat stats', () => {
      expect(PERCENTAGE_STATS.has('hp')).toBe(false);
      expect(PERCENTAGE_STATS.has('atk')).toBe(false);
      expect(PERCENTAGE_STATS.has('def')).toBe(false);
      expect(PERCENTAGE_STATS.has('eleMas')).toBe(false);
    });
  });
});
