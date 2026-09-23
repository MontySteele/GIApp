import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAscensionMaterials,
  calculateTalentMaterials,
  calculateAscensionSummary,
  calculateExpNeeded,
  type AscensionGoal,
} from './ascensionCalculator';
import { TOTAL_ASCENSION_MATS, TOTAL_TALENT_MATS } from '@/lib/planning/materialConstants';

// Mock the genshin-db service
vi.mock('@/lib/services/genshinDbService', () => ({
  getCharacterMaterials: vi.fn().mockResolvedValue({
    data: {
      characterKey: 'Venti',
      element: 'Anemo',
      ascensionMaterials: {
        gem: { name: 'Vayuda Turquoise', baseName: 'Vayuda Turquoise', element: 'Anemo', byTier: { sliver: 1, fragment: 9, chunk: 9, gemstone: 6 } },
        boss: { name: 'Hurricane Seed', totalCount: 46 },
        localSpecialty: { name: 'Cecilia', totalCount: 168 },
        common: {
          name: 'Slime Concentrate',
          baseName: 'Slime',
          tierNames: { gray: 'Slime Condensate', green: 'Slime Secretions', blue: 'Slime Concentrate' },
          byTier: { gray: 18, green: 30, blue: 36 }
        },
      },
      talentMaterials: {
        books: { name: 'Ballad', series: 'Ballad', region: 'Mondstadt', days: ['Wednesday', 'Saturday', 'Sunday'], byTier: { teachings: 9, guide: 63, philosophies: 114 } },
        common: {
          name: 'Slime Concentrate',
          baseName: 'Slime',
          tierNames: { gray: 'Slime Condensate', green: 'Slime Secretions', blue: 'Slime Concentrate' },
          byTier: { gray: 18, green: 66, blue: 93 }
        },
        weekly: { name: "Tail of Boreas", totalCount: 18 },
        crown: { name: 'Crown of Insight', totalCount: 3 },
      },
      fetchedAt: Date.now(),
      apiVersion: 'v5',
    },
    isStale: false,
  }),
}));

describe('calculateAscensionMaterials', () => {
  it('calculates materials for A5 -> A6', () => {
    const result = calculateAscensionMaterials(5, 6);

    // Index 5 in CHARACTER_ASCENSION_COSTS is { level: 80, mora: 120000, bossMat: 20, ... }
    expect(result.mora).toBe(120000);
    expect(result.bossMat).toBe(20);
    expect(result.localSpecialty).toBe(60);
    expect(result.commonMat).toEqual([0, 0, 24]);
    expect(result.gem).toEqual([0, 0, 0, 6]);
  });

  it('matches the known totals for A0 -> A6 (full ascension)', () => {
    const result = calculateAscensionMaterials(0, 6);

    expect(result.mora).toBe(TOTAL_ASCENSION_MATS.mora);
    expect(result.bossMat).toBe(TOTAL_ASCENSION_MATS.bossMat);
    expect(result.localSpecialty).toBe(TOTAL_ASCENSION_MATS.localSpecialty);
    expect(result.commonMat).toEqual([18, 30, 36]);
    expect(result.gem).toEqual([1, 9, 9, 6]);
  });
});

describe('calculateExpNeeded', () => {
  it('matches the known 1 -> 90 and 80 -> 90 totals', () => {
    expect(calculateExpNeeded(1, 90)).toBe(8362650);
    expect(calculateExpNeeded(80, 90)).toBe(3423125);
  });

  it('uses the exact level for non-breakpoint levels', () => {
    expect(calculateExpNeeded(73, 80)).toBe(4939525 - 3766900);
    expect(calculateExpNeeded(73, 80)).toBeLessThan(calculateExpNeeded(70, 80));
  });

  it('returns zero when already at or above the target', () => {
    expect(calculateExpNeeded(90, 90)).toBe(0);
    expect(calculateExpNeeded(85, 80)).toBe(0);
  });
});

describe('calculateTalentMaterials', () => {
  it('calculates materials for talent 3 -> 10', () => {
    const result = calculateTalentMaterials(3, 10);

    expect(result.mora).toBeGreaterThan(0);
    expect(result.books[2]).toBeGreaterThan(0); // Philosophies
    expect(result.weeklyBoss).toBeGreaterThan(0);
    expect(result.crown).toBe(1);
  });

  it('matches the known totals for talent 1 -> 10', () => {
    const result = calculateTalentMaterials(1, 10);

    expect(result.mora).toBe(TOTAL_TALENT_MATS.mora);
    expect(result.books).toEqual(TOTAL_TALENT_MATS.books);
    expect(result.commonMat).toEqual(TOTAL_TALENT_MATS.commonMat);
    expect(result.weeklyBoss).toBe(TOTAL_TALENT_MATS.weeklyBoss);
  });
});

describe('calculateAscensionSummary', () => {
  it('returns materials for a goal', async () => {
    const goal: AscensionGoal = {
      characterKey: 'Venti',
      currentLevel: 80,
      targetLevel: 90,
      currentAscension: 5,
      targetAscension: 6,
      currentTalents: { auto: 3, skill: 5, burst: 7 },
      targetTalents: { auto: 10, skill: 10, burst: 10 },
    };

    const inventory: Record<string, number> = {};

    const summary = await calculateAscensionSummary(goal, inventory);

    expect(summary.materials.length).toBeGreaterThan(0);
    expect(summary.totalMora).toBeGreaterThan(0);
    expect(summary.estimatedResin).toBeGreaterThan(0);
    expect(summary.estimatedDays).toBeGreaterThan(0);
  });

  it('scales talent common materials to the requested talent levels', async () => {
    const goal: AscensionGoal = {
      characterKey: 'Venti',
      currentLevel: 90,
      targetLevel: 90,
      currentAscension: 6,
      targetAscension: 6,
      currentTalents: { auto: 9, skill: 9, burst: 9 },
      targetTalents: { auto: 10, skill: 10, burst: 10 },
    };

    const summary = await calculateAscensionSummary(goal, {});
    const common = summary.materials.filter((m) => m.category === 'common');

    // 9 -> 10 costs 12 blue common materials per talent, nothing else
    expect(common).toEqual([
      expect.objectContaining({ name: 'Slime Concentrate', tier: 3, required: 36 }),
    ]);
  });

  it('charges 1 Mora per 5 EXP for leveling', async () => {
    const goal: AscensionGoal = {
      characterKey: 'Venti',
      currentLevel: 80,
      targetLevel: 90,
      currentAscension: 6,
      targetAscension: 6,
      currentTalents: { auto: 10, skill: 10, burst: 10 },
      targetTalents: { auto: 10, skill: 10, burst: 10 },
    };

    const summary = await calculateAscensionSummary(goal, {});

    expect(summary.totalMora).toBe(3423125 / 5);
  });

  it('returns materials with fallback names when API returns null', async () => {
    // Override mock to return null data
    const { getCharacterMaterials } = await import('@/lib/services/genshinDbService');
    vi.mocked(getCharacterMaterials).mockResolvedValueOnce({
      data: null,
      isStale: false,
      error: 'API unavailable',
    });

    const goal: AscensionGoal = {
      characterKey: 'UnknownChar',
      currentLevel: 80,
      targetLevel: 90,
      currentAscension: 5,
      targetAscension: 6,
      currentTalents: { auto: 3, skill: 5, burst: 7 },
      targetTalents: { auto: 10, skill: 10, burst: 10 },
    };

    const inventory: Record<string, number> = {};

    const summary = await calculateAscensionSummary(goal, inventory);

    // Should still have materials with fallback names
    expect(summary.materials.length).toBeGreaterThan(0);
    expect(summary.totalMora).toBeGreaterThan(0);
    expect(summary.error).toBeDefined();
  });
});
