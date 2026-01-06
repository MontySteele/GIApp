import { describe, it, expect } from 'vitest';
import {
  getPullProbability,
  getFeaturedProbability,
  simulatePull,
  calculateDistribution,
  pullsForProbability,
} from './pityEngine';
import { GACHA_RULES } from '@/lib/constants';

describe('pityEngine', () => {
  const characterRules = GACHA_RULES.character;

  describe('getPullProbability', () => {
    it('should return base rate before soft pity', () => {
      const prob = getPullProbability(0, characterRules);
      expect(prob).toBe(0.006);

      const probAtSoftMinus1 = getPullProbability(72, characterRules);
      expect(probAtSoftMinus1).toBe(0.006);
    });

    it('should increase rate during soft pity', () => {
      // Pull 74 (pity = 73) is first soft pity pull
      const probAt73 = getPullProbability(73, characterRules);
      expect(probAt73).toBe(0.006 + 1 * 0.06);
      expect(probAt73).toBe(0.066);

      // Pull 75 (pity = 74)
      const probAt74 = getPullProbability(74, characterRules);
      expect(probAt74).toBe(0.006 + 2 * 0.06);
      expect(probAt74).toBe(0.126);

      // Should cap at 1.0
      const probAt89 = getPullProbability(89, characterRules);
      expect(probAt89).toBeLessThanOrEqual(1.0);
    });

    it('should return 1.0 at hard pity', () => {
      const prob = getPullProbability(90, characterRules);
      expect(prob).toBe(1.0);
    });

    it('should handle weapon banner pity correctly', () => {
      const weaponRules = GACHA_RULES.weapon;

      // Before soft pity
      expect(getPullProbability(0, weaponRules)).toBe(0.007);

      // At soft pity start (62)
      expect(getPullProbability(62, weaponRules)).toBe(0.007 + 1 * 0.07);

      // At hard pity
      expect(getPullProbability(80, weaponRules)).toBe(1.0);
    });
  });

  describe('getFeaturedProbability', () => {
    it('should return 0.5 for normal 50/50', () => {
      const prob = getFeaturedProbability(0, characterRules);
      expect(prob).toBe(0.5);

      const prob1Loss = getFeaturedProbability(1, characterRules);
      expect(prob1Loss).toBe(0.5);
    });

    it('should return 0.75 with Capturing Radiance (2+ losses)', () => {
      const prob = getFeaturedProbability(2, characterRules);
      expect(prob).toBe(0.75);

      const prob3Losses = getFeaturedProbability(3, characterRules);
      expect(prob3Losses).toBe(0.75);
    });

    it('should return 0.5 for banners without Capturing Radiance', () => {
      const weaponRules = GACHA_RULES.weapon;
      const prob = getFeaturedProbability(5, weaponRules);
      expect(prob).toBe(0.5); // Weapon banner doesn't have Capturing Radiance
    });
  });

  describe('simulatePull', () => {
    it('should not get 5-star with low probability', () => {
      // Mock RNG to always return high value (won't win)
      const mockRng = () => 0.99;

      const result = simulatePull(0, false, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(false);
      expect(result.newPity).toBe(1);
      expect(result.newGuaranteed).toBe(false);
      expect(result.newRadiantStreak).toBe(0);
    });

    it('should get 5-star with favorable RNG', () => {
      // Mock RNG to always return low value (will win)
      const mockRng = () => 0.001;

      const result = simulatePull(0, false, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
      expect(result.newPity).toBe(0);
    });

    it('should guarantee featured when isGuaranteed is true', () => {
      const mockRng = () => 0.001; // Win the 5-star

      const result = simulatePull(0, true, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
      expect(result.wasFeatured).toBe(true);
      expect(result.newGuaranteed).toBe(false);
      expect(result.newRadiantStreak).toBe(0);
    });

    it('should handle 50/50 win', () => {
      const mockRng = () => 0.001; // Win both checks

      const result = simulatePull(0, false, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
      expect(result.wasFeatured).toBe(true);
      expect(result.newGuaranteed).toBe(false);
      expect(result.newRadiantStreak).toBe(0);
    });

    it('should handle 50/50 loss', () => {
      let callCount = 0;
      const mockRng = () => {
        callCount++;
        return callCount === 1 ? 0.001 : 0.99; // Win 5-star, lose 50/50
      };

      const result = simulatePull(0, false, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
      expect(result.wasFeatured).toBe(false);
      expect(result.newGuaranteed).toBe(true);
      expect(result.newRadiantStreak).toBe(1);
    });

    it('should trigger Capturing Radiance after 2 losses', () => {
      const mockRng = () => 0.001; // Always win

      const result = simulatePull(0, false, 2, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
      expect(result.wasFeatured).toBe(true);
      expect(result.triggeredRadiance).toBe(true);
      expect(result.newRadiantStreak).toBe(0);
    });

    it('should guarantee 5-star at hard pity', () => {
      const mockRng = () => 0.99; // Would normally not win

      const result = simulatePull(90, false, 0, characterRules, mockRng);

      expect(result.got5Star).toBe(true);
    });
  });

  describe('calculateDistribution', () => {
    it('should have increasing cumulative probability', () => {
      const distribution = calculateDistribution(0, false, 0, 100, characterRules);

      // Probabilities should increase monotonically
      for (let i = 1; i < distribution.length; i++) {
        expect(distribution[i].probability).toBeGreaterThanOrEqual(
          distribution[i - 1].probability
        );
      }
    });

    it('should reach high probability within reasonable pulls', () => {
      const distribution = calculateDistribution(0, false, 0, 200, characterRules);

      // Should reach >90% within 180 pulls (2 hard pities)
      // Distribution may end early if probability exceeds 0.9999
      const lastProb = distribution[distribution.length - 1].probability;
      expect(lastProb).toBeGreaterThan(0.9);

      // Last pull should be before 180 pulls
      expect(distribution[distribution.length - 1].pulls).toBeLessThan(200);
    });

    it('should have higher probability when guaranteed', () => {
      const distGuaranteed = calculateDistribution(0, true, 0, 90, characterRules);
      const distNonGuaranteed = calculateDistribution(0, false, 0, 90, characterRules);

      // At same pull count, guaranteed should have higher probability
      expect(distGuaranteed[50].probability).toBeGreaterThan(
        distNonGuaranteed[50].probability
      );
    });

    it('should account for starting pity', () => {
      const distFromZero = calculateDistribution(0, false, 0, 50, characterRules);
      const distFrom70 = calculateDistribution(70, false, 0, 50, characterRules);

      // Starting at 70 pity should have higher probability at same additional pulls
      expect(distFrom70[10].probability).toBeGreaterThan(
        distFromZero[10].probability
      );
    });

    it('should cap probability at 1.0', () => {
      const distribution = calculateDistribution(0, false, 0, 300, characterRules);

      for (const point of distribution) {
        expect(point.probability).toBeLessThanOrEqual(1.0);
      }
    });

    it('should apply Capturing Radiance threshold within distribution', () => {
      const distWithoutRadiance = calculateDistribution(73, false, 0, 1, characterRules);
      const distWithRadiance = calculateDistribution(73, false, 2, 1, characterRules);

      expect(distWithRadiance[0].probability).toBeGreaterThan(distWithoutRadiance[0].probability);
    });

    it('should reflect guarantee state on first pull', () => {
      const distGuaranteed = calculateDistribution(73, true, 0, 1, characterRules);
      const distNonGuaranteed = calculateDistribution(73, false, 0, 1, characterRules);

      expect(distGuaranteed[0].probability).toBeGreaterThan(distNonGuaranteed[0].probability);
      expect(distGuaranteed[0].probability).toBeCloseTo(
        getPullProbability(73, characterRules),
        5
      );
    });

    it('should honor soft and hard pity boundaries', () => {
      const softPityStartProb = calculateDistribution(73, false, 0, 1, characterRules)[0].probability;
      const earlyPityProb = calculateDistribution(0, false, 0, 1, characterRules)[0].probability;
      const hardPityProb = calculateDistribution(89, false, 0, 1, characterRules)[0].probability;

      expect(softPityStartProb).toBeGreaterThan(earlyPityProb);
      expect(hardPityProb).toBeGreaterThan(softPityStartProb);
      expect(hardPityProb).toBeCloseTo(0.5, 2); // 100% 5-star * 50% featured
    });
  });

  describe('pullsForProbability', () => {
    it('should find pulls needed for 50% probability', () => {
      const pulls = pullsForProbability(0.5, 0, false, 0, characterRules);

      // From 0 pity, non-guaranteed, should need roughly 77-82 pulls for 50%
      expect(pulls).toBeGreaterThan(70);
      expect(pulls).toBeLessThan(90);
    });

    it('should need fewer pulls when guaranteed', () => {
      const pullsGuaranteed = pullsForProbability(0.5, 0, true, 0, characterRules);
      const pullsNonGuaranteed = pullsForProbability(0.5, 0, false, 0, characterRules);

      expect(pullsGuaranteed).toBeLessThan(pullsNonGuaranteed);
    });

    it('should need fewer pulls with higher starting pity', () => {
      const pullsFrom0 = pullsForProbability(0.5, 0, false, 0, characterRules);
      const pullsFrom70 = pullsForProbability(0.5, 70, false, 0, characterRules);

      expect(pullsFrom70).toBeLessThan(pullsFrom0);
    });

    it('should return 1 for 0% probability target', () => {
      const pulls = pullsForProbability(0, 0, false, 0, characterRules);
      expect(pulls).toBe(1);
    });

    it('should handle near-100% probability targets', () => {
      const pulls = pullsForProbability(0.99, 0, false, 0, characterRules);

      // 99% should require near max pulls (maybe 2 hard pities)
      expect(pulls).toBeGreaterThan(150);
      expect(pulls).toBeLessThanOrEqual(300);
    });
  });

  describe('Edge cases', () => {
    it('should handle pity at exactly softPityStart', () => {
      const prob = getPullProbability(73, characterRules);
      expect(prob).toBeGreaterThan(characterRules.baseRate);
    });

    it('should handle radiantStreak exactly at threshold', () => {
      const prob = getFeaturedProbability(2, characterRules);
      expect(prob).toBe(0.75);
    });

    it('should handle maxPulls of 1', () => {
      const distribution = calculateDistribution(89, true, 0, 1, characterRules);
      expect(distribution).toHaveLength(1);
      // At pity 89, next pull is hard pity, guaranteed = 100%
      expect(distribution[0].probability).toBeCloseTo(1.0, 2);
    });
  });
});
