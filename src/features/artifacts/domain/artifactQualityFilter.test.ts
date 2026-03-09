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

    it('treats flowers as useful if the set is tracked', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'CrimsonWitchOfFlames',
        slotKey: 'flower',
        mainStatKey: 'hp',
      }));
      expect(result.isUseless).toBe(false);
      expect(result.buildDemand).toBeGreaterThan(0);
    });

    it('treats plumes as useful if the set is tracked', () => {
      const result = checkArtifactQuality(makeArtifact({
        setKey: 'ViridescentVenerer',
        slotKey: 'plume',
        mainStatKey: 'atk',
      }));
      expect(result.isUseless).toBe(false);
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
