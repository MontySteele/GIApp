import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAscensionMaterials,
  calculateTalentMaterials,
  calculateAscensionSummary,
  type AscensionGoal,
} from './ascensionCalculator';
import { TOTAL_ASCENSION_MATS } from '@/lib/planning/materialConstants';

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
  it('calculates materials for A5 -> A6 (per-phase, not cumulative)', () => {
    const result = calculateAscensionMaterials(5, 6);

    // A5 -> A6 (level 80 cap -> 90): 120k mora, 20 boss, 60 specialty, 24 tier-3 common, 6 gemstones
    expect(result.mora).toBe(120000);
    expect(result.bossMat).toBe(20);
    expect(result.localSpecialty).toBe(60);
    expect(result.commonMat).toEqual([0, 0, 24]);
    expect(result.gem).toEqual([0, 0, 0, 6]);
  });

  it('A0 -> A6 equals the known 1->90 totals', () => {
    const result = calculateAscensionMaterials(0, 6);

    expect(result.mora).toBe(TOTAL_ASCENSION_MATS.mora); // 420,000
    expect(result.bossMat).toBe(TOTAL_ASCENSION_MATS.bossMat); // 46
    expect(result.localSpecialty).toBe(TOTAL_ASCENSION_MATS.localSpecialty); // 168
    expect(result.commonMat).toEqual(TOTAL_ASCENSION_MATS.commonMat); // [18, 30, 36]
    expect(result.gem).toEqual(TOTAL_ASCENSION_MATS.gem); // [1, 9, 9, 6]
  });

  it('each individual phase matches the in-game ascension screen', () => {
    expect(calculateAscensionMaterials(0, 1)).toEqual({ mora: 20000, bossMat: 0, localSpecialty: 3, commonMat: [3, 0, 0], gem: [1, 0, 0, 0] });
    expect(calculateAscensionMaterials(1, 2)).toEqual({ mora: 40000, bossMat: 2, localSpecialty: 10, commonMat: [15, 0, 0], gem: [0, 3, 0, 0] });
    expect(calculateAscensionMaterials(2, 3)).toEqual({ mora: 60000, bossMat: 4, localSpecialty: 20, commonMat: [0, 12, 0], gem: [0, 6, 0, 0] });
    expect(calculateAscensionMaterials(3, 4)).toEqual({ mora: 80000, bossMat: 8, localSpecialty: 30, commonMat: [0, 18, 0], gem: [0, 0, 3, 0] });
    expect(calculateAscensionMaterials(4, 5)).toEqual({ mora: 100000, bossMat: 12, localSpecialty: 45, commonMat: [0, 0, 12], gem: [0, 0, 6, 0] });
  });

  it('returns zero when from >= to', () => {
    expect(calculateAscensionMaterials(6, 6).mora).toBe(0);
    expect(calculateAscensionMaterials(6, 3).bossMat).toBe(0);
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
