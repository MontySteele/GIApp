import { describe, it, expect } from 'vitest';
import { checkArtifactQuality, getTrackedSets } from './artifactQualityFilter';
import type { InventoryArtifact } from '@/types';

function makeArtifact(overrides: Partial<InventoryArtifact>): InventoryArtifact {
  return {
    id: 'test-1',
    setKey: 'EmblemOfSeveredFate',
    slotKey: 'sands',
    level: 20,
    rarity: 5,
    mainStatKey: 'enerRech_',
    substats: [],
    location: '',
    lock: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('artifactQualityFilter', () => {
  describe('checkArtifactQuality', () => {
    it('marks Emblem ER sands as useful (high demand)', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'EmblemOfSeveredFate',
        slotKey: 'sands',
        mainStatKey: 'enerRech_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBeGreaterThan(0);
    });

    it('marks Emblem ATK% sands as useful', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'EmblemOfSeveredFate',
        slotKey: 'sands',
        mainStatKey: 'atk_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBeGreaterThan(20);
    });

    it('marks Crimson Witch DEF% sands as useless', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'sands',
        mainStatKey: 'def_',
      }));
      expect(result.isUseless).toBe(true);
      expect(result.buildDemand).toBe(0);
      expect(result.reason).toContain('No builds use this main stat');
    });

    it('marks Thundersoother HP% goblet as useless', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'Thundersoother',
        slotKey: 'goblet',
        mainStatKey: 'hp_',
      }));
      expect(result.isUseless).toBe(true);
      expect(result.buildDemand).toBe(0);
    });

    it('marks Thundersoother Electro goblet as useful', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'Thundersoother',
        slotKey: 'goblet',
        mainStatKey: 'electro_dmg_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBe(5);
    });

    it('keeps flower with good substats for its set', () => {
      // Uses moderate crit values (below 35 CV threshold) to test substat matching
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 6.2 },
          { key: 'critDMG_', value: 13.2 },
          { key: 'eleMas', value: 40 },
          { key: 'atk_', value: 5.8 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.desiredSubstatCount).toBe(4);
      expect(result.reason).toContain('substats for set');
    });

    it('flags flower with bad substats and low CV as useless', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'def', value: 23 },
          { key: 'def_', value: 12.0 },
          { key: 'hp_', value: 5.8 }, // CW builds don't prioritize HP% much (weight=1)
          { key: 'atk', value: 19 },
        ],
      }));
      expect(result.isUseless).toBe(true);
      expect(result.desiredSubstatCount).toBeLessThan(2);
      expect(result.reason).toContain('Builds want:');
    });

    it('keeps plume with high CV as universal offset', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'ViridescentVenerer',
        slotKey: 'plume',
        mainStatKey: 'atk',
        substats: [
          { key: 'critRate_', value: 10.5 },  // 21 CV
          { key: 'critDMG_', value: 21.0 },    // 21 CV = 42 total
          { key: 'def_', value: 7.3 },
          { key: 'hp', value: 299 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.isGoodOffset).toBe(true);
      expect(result.reason).toContain('High CV offset');
    });

    it('keeps flower with decent CV + high ER as support offset', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'BloodstainedChivalry',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 7.0 },   // 14 CV
          { key: 'critDMG_', value: 7.8 },     // 7.8 CV = 21.8 total
          { key: 'enerRech_', value: 16.2 },   // High ER
          { key: 'def', value: 23 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.isGoodOffset).toBe(true);
    });

    it('keeps flower with decent CV + high EM as reaction offset', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'MaidenBeloved',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'critRate_', value: 7.0 },
          { key: 'critDMG_', value: 7.8 },
          { key: 'eleMas', value: 65 },
          { key: 'def', value: 23 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.isGoodOffset).toBe(true);
    });

    it('flags low-CV flower from niche set with wrong substats', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'Lavawalker',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'def', value: 23 },
          { key: 'def_', value: 12.0 },
          { key: 'hp_', value: 5.8 },
          { key: 'atk', value: 19 },
        ],
      }));
      expect(result.isUseless).toBe(true);
      expect(result.isGoodOffset).toBe(false);
    });

    it('keeps Tenacity flower with HP% and ER substats', () => {
      // Tenacity builds want HP% and ER - not crit-focused
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'TenacityOfTheMillelith',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'hp_', value: 15.0 },
          { key: 'enerRech_', value: 12.0 },
          { key: 'def', value: 23 },
          { key: 'atk', value: 19 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.desiredSubstatCount).toBeGreaterThanOrEqual(2);
    });

    it('flags Tenacity flower with no HP% or ER and low CV', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'TenacityOfTheMillelith',
        slotKey: 'flower',
        mainStatKey: 'hp',
        substats: [
          { key: 'def', value: 23 },
          { key: 'def_', value: 12.0 },
          { key: 'atk', value: 19 },
          { key: 'atk_', value: 5.8 },
        ],
      }));
      expect(result.isUseless).toBe(true);
    });

    it('keeps unleveled flower from a set with demand', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'EmblemOfSeveredFate',
        slotKey: 'flower',
        mainStatKey: 'hp',
        level: 0,
        substats: [],
      }));
      expect(result.isUseless).toBe(false);
    });

    it('evaluates VV plume for EM/ER builds correctly', () => {
      // VV wants EM and ER primarily
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'ViridescentVenerer',
        slotKey: 'plume',
        mainStatKey: 'atk',
        substats: [
          { key: 'eleMas', value: 47 },
          { key: 'enerRech_', value: 11.0 },
          { key: 'def', value: 23 },
          { key: 'hp', value: 299 },
        ],
      }));
      expect(result.isUseless).toBe(false);
      expect(result.desiredSubstatCount).toBeGreaterThanOrEqual(2);
    });

    it('marks unknown set as useless', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'TotallyFakeSet',
        slotKey: 'sands',
        mainStatKey: 'atk_',
      }));
      expect(result.isUseless).toBe(true);
      expect(result.reason).toContain('not used in any known build');
    });

    it('handles Noblesse Oblige Healing Bonus circlet as useful', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'NoblesseOblige',
        slotKey: 'circlet',
        mainStatKey: 'heal_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBe(9);
    });

    it('handles elemental damage goblets correctly', () => {
      // Blizzard Strayer cryo goblet should be in high demand
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'BlizzardStrayer',
        slotKey: 'goblet',
        mainStatKey: 'cryo_dmg_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBe(12);

      // Blizzard Strayer pyro goblet should have 0 demand
      const result2 = checkArtifactQuality(makeArtifact({
        setKey: 'BlizzardStrayer',
        slotKey: 'goblet',
        mainStatKey: 'pyro_dmg_',
      }));
      expect(result2.isUseless).toBe(true);
      expect(result2.buildDemand).toBe(0);
    });

    it('shows what stats builds want when artifact is useless', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'sands',
        mainStatKey: 'def_',
      }));
      expect(result.reason).toContain('Builds want:');
    });

    it('correctly evaluates high-demand universal sets', () => {
      // Gladiator's ATK% sands - very popular
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'GladiatorsFinale',
        slotKey: 'sands',
        mainStatKey: 'atk_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBeGreaterThan(30);
    });

    it('correctly evaluates niche set+stat combos', () => {
      // Pale Flame Physical goblet
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'PaleFlame',
        slotKey: 'goblet',
        mainStatKey: 'physical_dmg_',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBe(3);
    });
  });

  describe('getTrackedSets', () => {
    it('returns a list of tracked artifact sets', () => {
      const sets = getTrackedSets();
      expect(sets.length).toBeGreaterThan(30);
      expect(sets).toContain('EmblemOfSeveredFate');
      expect(sets).toContain('NoblesseOblige');
      expect(sets).toContain('ViridescentVenerer');
    });
  });
});
