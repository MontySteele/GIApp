import { describe, it, expect } from 'vitest';
import {
  getCharacterBuild,
  isRecommendedSet,
  isRecommendedMainStat,
  findCharactersForArtifact,
  calculateCharacterFitScore,
  CHARACTER_BUILDS,
} from './setRecommendations';

describe('setRecommendations', () => {
  describe('getCharacterBuild', () => {
    it('returns build for known character', () => {
      const build = getCharacterBuild('HuTao');
      expect(build).toBeDefined();
      expect(build?.role).toBe('dps');
    });

    it('handles case-insensitive lookup', () => {
      const build1 = getCharacterBuild('HUTAO');
      const build2 = getCharacterBuild('hutao');
      expect(build1).toEqual(build2);
    });

    it('returns undefined for unknown character', () => {
      const build = getCharacterBuild('UnknownCharacter');
      expect(build).toBeUndefined();
    });
  });

  describe('isRecommendedSet', () => {
    it('returns true for recommended set', () => {
      expect(isRecommendedSet('HuTao', 'CrimsonWitchOfFlames')).toBe(true);
    });

    it('returns false for non-recommended set', () => {
      expect(isRecommendedSet('HuTao', 'BlizzardStrayer')).toBe(false);
    });

    it('handles case-insensitive set keys', () => {
      expect(isRecommendedSet('Raiden', 'emblemOfSeveredFate')).toBe(true);
    });
  });

  describe('isRecommendedMainStat', () => {
    it('returns true for flower/plume (fixed main stats)', () => {
      expect(isRecommendedMainStat('HuTao', 'flower', 'hp')).toBe(true);
      expect(isRecommendedMainStat('HuTao', 'plume', 'atk')).toBe(true);
    });

    it('returns true for recommended sands main stat', () => {
      expect(isRecommendedMainStat('HuTao', 'sands', 'hp_')).toBe(true);
      expect(isRecommendedMainStat('HuTao', 'sands', 'eleMas')).toBe(true);
    });

    it('returns false for non-recommended main stat', () => {
      expect(isRecommendedMainStat('HuTao', 'sands', 'def_')).toBe(false);
    });

    it('returns true for Kazuha EM goblet', () => {
      // Kazuha wants EM on all pieces - note: stored under 'kazuha' key
      const build = getCharacterBuild('kazuha');
      expect(build).toBeDefined();
      expect(build?.mainStats.goblet).toContain('eleMas');
    });
  });

  describe('findCharactersForArtifact', () => {
    it('finds characters who want Emblem ER sands', () => {
      const characters = findCharactersForArtifact(
        'EmblemOfSeveredFate',
        'enerRech_',
        'sands'
      );
      expect(characters).toContain('RaidenShogun');
      expect(characters).toContain('Xingqiu');
    });

    it('finds characters who want Blizzard Strayer crit circlet', () => {
      const characters = findCharactersForArtifact(
        'BlizzardStrayer',
        'critDMG_',
        'circlet'
      );
      expect(characters).toContain('KamisatoAyaka');
    });

    it('returns empty array when no match', () => {
      const characters = findCharactersForArtifact(
        'BlizzardStrayer',
        'def_',
        'sands'
      );
      expect(characters).toHaveLength(0);
    });
  });

  describe('calculateCharacterFitScore', () => {
    it('returns high score for perfect artifact', () => {
      const result = calculateCharacterFitScore(
        'Raiden',
        'EmblemOfSeveredFate',
        'sands',
        'enerRech_',
        [
          { key: 'critRate_', value: 10 },
          { key: 'critDMG_', value: 20 },
          { key: 'atk_', value: 10 },
          { key: 'hp_', value: 5 },
        ]
      );

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.reasons).toContain('Recommended set');
      expect(result.reasons).toContain('Optimal main stat');
    });

    it('returns lower score for wrong set', () => {
      const result = calculateCharacterFitScore(
        'Raiden',
        'BlizzardStrayer', // Wrong set
        'sands',
        'enerRech_',
        [
          { key: 'critRate_', value: 10 },
          { key: 'critDMG_', value: 20 },
        ]
      );

      expect(result.score).toBeLessThan(70);
    });

    it('returns lower score for wrong main stat', () => {
      const result = calculateCharacterFitScore(
        'HuTao',
        'CrimsonWitchOfFlames',
        'sands',
        'def_', // Wrong main stat
        [
          { key: 'critRate_', value: 10 },
          { key: 'critDMG_', value: 20 },
        ]
      );

      expect(result.score).toBeLessThan(70);
      expect(result.reasons).toContain('Non-optimal main stat');
    });

    it('returns 50 for unknown character', () => {
      const result = calculateCharacterFitScore(
        'UnknownCharacter',
        'SomeSet',
        'sands',
        'atk_',
        []
      );

      expect(result.score).toBe(50);
      expect(result.reasons).toContain('No build data available');
    });
  });

  describe('CHARACTER_BUILDS data', () => {
    it('has all required fields for each character', () => {
      for (const [key, build] of Object.entries(CHARACTER_BUILDS)) {
        expect(build.characterKey).toBeTruthy();
        expect(build.role).toBeTruthy();
        expect(build.recommendedSets.length).toBeGreaterThan(0);
        expect(build.mainStats.sands.length).toBeGreaterThan(0);
        expect(build.mainStats.goblet.length).toBeGreaterThan(0);
        expect(build.mainStats.circlet.length).toBeGreaterThan(0);
        expect(build.substats.length).toBeGreaterThan(0);
      }
    });

    it('includes major meta characters', () => {
      const metaCharacters = ['hutao', 'raiden', 'kazuha', 'bennett', 'xiangling', 'yelan'];
      for (const char of metaCharacters) {
        expect(CHARACTER_BUILDS[char]).toBeDefined();
      }
    });
  });
});
