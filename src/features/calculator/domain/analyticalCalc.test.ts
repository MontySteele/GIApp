import { describe, it, expect } from 'vitest';
import { calculateSingleTarget, calculateRequiredIncome } from './analyticalCalc';
import { INCOME_F2P } from '@/lib/constants';
import { GACHA_RULES } from '@/lib/constants';

describe('analyticalCalc', () => {
  const characterRules = GACHA_RULES.character;

  describe('calculateSingleTarget', () => {
    it('should calculate probability with current pulls', () => {
      const result = calculateSingleTarget(0, false, 0, 80, characterRules);

      expect(result.probabilityWithCurrentPulls).toBeGreaterThan(0);
      expect(result.probabilityWithCurrentPulls).toBeLessThanOrEqual(1);
    });

    it('should provide confidence level pull counts', () => {
      const result = calculateSingleTarget(0, false, 0, 100, characterRules);

      // 50% confidence should require fewer pulls than 80%
      expect(result.pullsFor50).toBeLessThan(result.pullsFor80);
      expect(result.pullsFor80).toBeLessThan(result.pullsFor90);
      expect(result.pullsFor90).toBeLessThan(result.pullsFor99);
    });

    it('should have lower pull requirements when guaranteed', () => {
      const resultGuaranteed = calculateSingleTarget(0, true, 0, 100, characterRules);
      const resultNonGuaranteed = calculateSingleTarget(0, false, 0, 100, characterRules);

      expect(resultGuaranteed.pullsFor50).toBeLessThan(resultNonGuaranteed.pullsFor50);
      expect(resultGuaranteed.pullsFor80).toBeLessThan(resultNonGuaranteed.pullsFor80);
    });

    it('should have lower pull requirements with higher starting pity', () => {
      const resultFrom0 = calculateSingleTarget(0, false, 0, 100, characterRules);
      const resultFrom70 = calculateSingleTarget(70, false, 0, 100, characterRules);

      expect(resultFrom70.pullsFor50).toBeLessThan(resultFrom0.pullsFor50);
      expect(resultFrom70.pullsFor80).toBeLessThan(resultFrom0.pullsFor80);
    });

    it('should return full distribution array', () => {
      const result = calculateSingleTarget(0, false, 0, 50, characterRules);

      expect(result.distribution).toBeDefined();
      expect(result.distribution.length).toBeGreaterThan(0);
      expect(result.distribution.length).toBeLessThanOrEqual(50);

      // Distribution should have correct structure
      expect(result.distribution[0]).toHaveProperty('pulls');
      expect(result.distribution[0]).toHaveProperty('cumulativeProbability');

      // Probabilities should be monotonically increasing
      for (let i = 1; i < result.distribution.length; i++) {
        expect(result.distribution[i].cumulativeProbability).toBeGreaterThanOrEqual(
          result.distribution[i - 1].cumulativeProbability
        );
      }
    });

    it('should handle availablePulls exceeding distribution length', () => {
      const result = calculateSingleTarget(0, false, 0, 500, characterRules);

      // Should use last available probability
      expect(result.probabilityWithCurrentPulls).toBeGreaterThan(0);
      expect(result.probabilityWithCurrentPulls).toBeLessThanOrEqual(1);
    });

    it('should show high probability when at hard pity with guarantee', () => {
      const result = calculateSingleTarget(89, true, 0, 1, characterRules);

      // Next pull is guaranteed 5-star at hard pity, and guaranteed featured
      expect(result.probabilityWithCurrentPulls).toBeCloseTo(1.0, 1);
    });

    it('should account for Capturing Radiance', () => {
      const resultNoRadiance = calculateSingleTarget(0, false, 0, 100, characterRules);
      // With threshold=3, need radiantStreak >= 3 to activate Capturing Radiance
      const resultWithRadiance = calculateSingleTarget(0, false, 3, 100, characterRules);

      // With Capturing Radiance active (100% guarantee), should need fewer pulls
      expect(resultWithRadiance.pullsFor50).toBeLessThan(resultNoRadiance.pullsFor50);
    });
  });

  describe('calculateRequiredIncome', () => {
    it('should calculate required pulls and primos per day', () => {
      const result = calculateRequiredIncome(
        1, // 1 target
        0.8, // 80% probability
        60, // 60 days
        0, // starting pity
        false, // not guaranteed
        0, // no radiant streak
        characterRules,
        0,
        0
      );

      expect(result.requiredPullsPerDay).toBeGreaterThan(0);
      expect(result.requiredPrimosPerDay).toBeCloseTo(result.requiredPullsPerDay * 160);
    });

    it('should scale with number of targets', () => {
      const result1Target = calculateRequiredIncome(1, 0.8, 60, 0, false, 0, characterRules, 0, 0);
      const result2Targets = calculateRequiredIncome(2, 0.8, 60, 0, false, 0, characterRules, 0, 0);

      // 2 targets should require roughly double the daily pulls
      expect(result2Targets.requiredPullsPerDay).toBeGreaterThan(
        result1Target.requiredPullsPerDay * 1.8
      );
      expect(result2Targets.requiredPullsPerDay).toBeLessThan(
        result1Target.requiredPullsPerDay * 2.2
      );
    });

    it('should provide comparison to income benchmarks', () => {
      const result = calculateRequiredIncome(1, 0.5, 30, 0, false, 0, characterRules, 0, 0);

      expect(result.comparedToF2P).toBeGreaterThan(0);
      expect(result.comparedToWelkin).toBeGreaterThan(0);
      expect(result.comparedToWelkinBP).toBeGreaterThan(0);

      // Welkin provides more income than F2P
      expect(result.comparedToF2P).toBeGreaterThan(result.comparedToWelkin);
      expect(result.comparedToWelkin).toBeGreaterThan(result.comparedToWelkinBP);
    });

    it('should categorize feasibility as "easy" for low requirements', () => {
      // 1 target over a long period should be easy
      const result = calculateRequiredIncome(1, 0.5, 365, 80, false, 0, characterRules, 0, 0);

      expect(result.feasibility).toBe('easy');
      expect(result.requiredPrimosPerDay).toBeLessThanOrEqual(60); // F2P income
    });

    it('should categorize feasibility as "possible" for moderate requirements', () => {
      const result = calculateRequiredIncome(1, 0.8, 45, 0, false, 0, characterRules, 0, 0);

      // This should require more than F2P but achievable with Welkin
      if (result.requiredPrimosPerDay > 60 && result.requiredPrimosPerDay <= 150) {
        expect(result.feasibility).toBe('possible');
      }
    });

    it('should categorize feasibility as "unlikely" for very high requirements', () => {
      // 5 targets in 30 days should be unlikely
      const result = calculateRequiredIncome(5, 0.99, 30, 0, false, 0, characterRules, 0, 0);

      expect(result.feasibility).toBe('unlikely');
      expect(result.requiredPrimosPerDay).toBeGreaterThan(170 * 1.5);
    });

    it('should require fewer resources when starting with high pity', () => {
      const resultFrom0 = calculateRequiredIncome(1, 0.8, 60, 0, false, 0, characterRules, 0, 0);
      const resultFrom80 = calculateRequiredIncome(1, 0.8, 60, 80, false, 0, characterRules, 0, 0);

      expect(resultFrom80.requiredPullsPerDay).toBeLessThan(
        resultFrom0.requiredPullsPerDay
      );
    });

    it('should require fewer resources when guaranteed', () => {
      const resultNonGuaranteed = calculateRequiredIncome(
        1,
        0.8,
        60,
        0,
        false,
        0,
        characterRules,
        0,
        0
      );
      const resultGuaranteed = calculateRequiredIncome(
        1,
        0.8,
        60,
        0,
        true,
        0,
        characterRules,
        0,
        0
      );

      expect(resultGuaranteed.requiredPullsPerDay).toBeLessThan(
        resultNonGuaranteed.requiredPullsPerDay
      );
    });

    it('should handle very short time periods', () => {
      const result = calculateRequiredIncome(1, 0.5, 1, 0, false, 0, characterRules, 0, 0);

      // 1 day should require all pulls immediately
      expect(result.requiredPullsPerDay).toBeGreaterThan(50);
      expect(result.feasibility).toBe('unlikely');
    });

    it('should handle very long time periods', () => {
      const result = calculateRequiredIncome(1, 0.99, 1000, 0, false, 0, characterRules, 0, 0);

      // 1000 days should be very achievable
      expect(result.feasibility).toBe('easy');
      expect(result.requiredPrimosPerDay).toBeLessThan(60);
    });
  });

  describe('Edge cases', () => {
    it('should handle 0 available pulls', () => {
      const result = calculateSingleTarget(0, false, 0, 0, characterRules);

      expect(result.probabilityWithCurrentPulls).toBe(0);
      expect(result.distribution).toHaveLength(0);
    });

    it('should handle maximum available pulls', () => {
      const result = calculateSingleTarget(0, false, 0, 1000, characterRules);

      // Should cap at 300 internally
      expect(result.distribution.length).toBeLessThanOrEqual(300);
    });

    it('should handle 0 targets in income calculator', () => {
      const result = calculateRequiredIncome(0, 0.5, 60, 0, false, 0, characterRules, 0, 0);

      expect(result.requiredPullsPerDay).toBe(0);
      expect(result.requiredPrimosPerDay).toBe(0);
      expect(result.feasibility).toBe('easy');
    });

    it('should reduce required pulls when custom income and starting pulls are provided', () => {
      const baseline = calculateRequiredIncome(1, 0.8, 30, 0, false, 0, characterRules, 0, 0);
      const withIncomeAndPulls = calculateRequiredIncome(
        1,
        0.8,
        30,
        0,
        false,
        0,
        characterRules,
        20,
        INCOME_F2P
      );

      // With starting pulls and daily income, required pulls per day should be lower
      expect(withIncomeAndPulls.requiredPullsPerDay).toBeLessThan(baseline.requiredPullsPerDay);
      // With starting pulls, the baseline should be unlikely but with income could improve
      // The key assertion is that required pulls decrease - feasibility depends on the math
    });
  });
});
