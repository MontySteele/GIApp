import { describe, it, expect } from 'vitest';
import {
  calculateCritValue,
  estimateLeveledCV,
  scoreInventoryArtifact,
} from './artifactScoring';
import type { InventoryArtifact } from '@/types';

function makeArtifact(overrides: Partial<InventoryArtifact>): InventoryArtifact {
  return {
    id: 'test-1',
    setKey: 'GoldenTroupe',
    slotKey: 'flower',
    level: 20,
    rarity: 5,
    mainStatKey: 'hp',
    substats: [],
    location: '',
    lock: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('artifactScoring', () => {
  describe('estimateLeveledCV', () => {
    it('returns current CV for level 20 artifacts', () => {
      const substats = [
        { key: 'critRate_', value: 10 },
        { key: 'critDMG_', value: 20 },
      ];
      // CV = 10*2 + 20 = 40
      expect(estimateLeveledCV(substats, 20, 5)).toBe(40);
    });

    it('returns current CV for non-5-star artifacts', () => {
      const substats = [{ key: 'critRate_', value: 3.9 }];
      expect(estimateLeveledCV(substats, 0, 4)).toBe(calculateCritValue(substats));
    });

    it('projects higher CV for unleveled artifact with crit substats', () => {
      const substats = [
        { key: 'critRate_', value: 3.9 },
        { key: 'critDMG_', value: 7.8 },
        { key: 'atk_', value: 5.0 },
        { key: 'enerRech_', value: 6.0 },
      ];
      const currentCV = calculateCritValue(substats);
      const projected = estimateLeveledCV(substats, 0, 5);

      // Should be higher than current CV since rolls can land on crit lines
      expect(projected).toBeGreaterThan(currentCV);
    });

    it('returns current CV when no crit substats exist', () => {
      const substats = [
        { key: 'atk_', value: 5.0 },
        { key: 'def_', value: 5.0 },
        { key: 'hp_', value: 5.0 },
        { key: 'enerRech_', value: 6.0 },
      ];
      const currentCV = calculateCritValue(substats); // 0
      expect(estimateLeveledCV(substats, 0, 5)).toBe(currentCV);
    });

    it('accounts for 3-substat artifacts losing a roll to unlock', () => {
      // 3-substat: 1 roll used to unlock 4th, leaving 4 rolls
      const threeStats = [
        { key: 'critRate_', value: 3.9 },
        { key: 'atk_', value: 5.0 },
        { key: 'hp_', value: 5.0 },
      ];
      // 4-substat: all 5 rolls go to existing lines
      const fourStats = [
        { key: 'critRate_', value: 3.9 },
        { key: 'atk_', value: 5.0 },
        { key: 'hp_', value: 5.0 },
        { key: 'enerRech_', value: 6.0 },
      ];

      const proj3 = estimateLeveledCV(threeStats, 0, 5);
      const proj4 = estimateLeveledCV(fourStats, 0, 5);

      // 4-substat should project higher (more rolls available for crit)
      expect(proj4).toBeGreaterThan(proj3);
    });

    it('projects less for partially leveled artifacts', () => {
      const substats = [
        { key: 'critRate_', value: 7.0 },
        { key: 'critDMG_', value: 14.0 },
        { key: 'atk_', value: 10.0 },
        { key: 'enerRech_', value: 12.0 },
      ];

      const projLevel0 = estimateLeveledCV(substats, 0, 5);
      const projLevel8 = estimateLeveledCV(substats, 8, 5);

      // Level 0 has more remaining rolls → higher projection
      expect(projLevel0).toBeGreaterThan(projLevel8);
    });

    it('handles single crit substat projection', () => {
      const substats = [
        { key: 'critDMG_', value: 7.8 },
        { key: 'atk_', value: 5.0 },
        { key: 'def_', value: 5.0 },
        { key: 'hp_', value: 5.0 },
      ];
      const currentCV = calculateCritValue(substats); // 7.8
      const projected = estimateLeveledCV(substats, 0, 5);

      // With 1 crit line out of 4, expected crit rolls = 5 * (1/4) = 1.25
      // Expected added CV ≈ 1.25 * 6.6 = 8.25
      // Total ≈ 7.8 + 8.25 ≈ 16.05
      expect(projected).toBeGreaterThan(currentCV);
      expect(projected).toBeLessThan(50); // Sanity: can't be absurdly high
    });
  });

  describe('scoreInventoryArtifact with projected CV', () => {
    it('does not mark unleveled artifact with crit potential as trash', () => {
      const artifact = makeArtifact({
        level: 0,
        slotKey: 'flower',
        setKey: 'GoldenTroupe',
        substats: [
          { key: 'critRate_', value: 3.9 },
          { key: 'critDMG_', value: 7.8 },
          { key: 'atk_', value: 5.0 },
          { key: 'enerRech_', value: 6.0 },
        ],
      });

      const score = scoreInventoryArtifact(artifact);

      // Double crit on a decent set — should not be trash
      expect(score.isStrongboxTrash).toBe(false);
      // Score should reflect potential, not just current value
      expect(score.score).toBeGreaterThanOrEqual(30);
    });

    it('still trashes unleveled artifact with zero crit potential', () => {
      const artifact = makeArtifact({
        level: 0,
        slotKey: 'sands',
        mainStatKey: 'def_',
        setKey: 'GoldenTroupe',
        substats: [
          { key: 'def', value: 20 },
          { key: 'hp', value: 250 },
          { key: 'hp_', value: 4.0 },
          { key: 'def_', value: 5.0 },
        ],
      });

      const score = scoreInventoryArtifact(artifact);

      // No crit lines + bad main stat → should still score low
      expect(score.score).toBeLessThanOrEqual(30);
    });

    it('returns actual CV in critValue, not projected', () => {
      const artifact = makeArtifact({
        level: 0,
        substats: [
          { key: 'critRate_', value: 3.9 },
          { key: 'atk_', value: 5.0 },
          { key: 'def_', value: 5.0 },
          { key: 'hp_', value: 5.0 },
        ],
      });

      const score = scoreInventoryArtifact(artifact);

      // critValue should be the actual measured value
      expect(score.critValue).toBeCloseTo(7.8, 1); // 3.9 * 2
    });
  });
});
