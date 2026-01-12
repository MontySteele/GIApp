import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAscensionMaterials,
  calculateTalentMaterials,
  calculateAscensionSummary,
  type AscensionGoal,
} from './ascensionCalculator';

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

    console.log('A5 -> A6 result:', JSON.stringify(result, null, 2));

    // Index 5 in CHARACTER_ASCENSION_COSTS is { level: 80, mora: 120000, bossMat: 20, ... }
    expect(result.mora).toBe(120000);
    expect(result.bossMat).toBe(20);
    expect(result.localSpecialty).toBe(60);
    expect(result.commonMat).toEqual([15, 18, 24]);
    expect(result.gem).toEqual([6, 9, 6, 0]);
  });

  it('calculates materials for A0 -> A6 (full ascension)', () => {
    const result = calculateAscensionMaterials(0, 6);

    expect(result.mora).toBeGreaterThan(0);
    expect(result.bossMat).toBeGreaterThan(0);
  });
});

describe('calculateTalentMaterials', () => {
  it('calculates materials for talent 3 -> 10', () => {
    const result = calculateTalentMaterials(3, 10);

    console.log('Talent 3 -> 10 result:', JSON.stringify(result, null, 2));

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

    console.log('Summary materials count:', summary.materials.length);
    console.log('Summary materials:', summary.materials.map(m => `${m.name}: ${m.required}`));

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

    console.log('Null API - Summary materials count:', summary.materials.length);
    console.log('Null API - Materials:', summary.materials.map(m => `${m.name}: ${m.required}`));
    console.log('Null API - Error:', summary.error);

    // Should still have materials with fallback names
    expect(summary.materials.length).toBeGreaterThan(0);
    expect(summary.totalMora).toBeGreaterThan(0);
    expect(summary.error).toBeDefined();
  });
});
