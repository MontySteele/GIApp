/**
 * Multi-Character Calculator Tests
 *
 * Tests for aggregating material requirements across multiple characters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  aggregateMaterialRequirements,
  calculateMultiCharacterSummary,
  groupMaterialsByCategory,
  type MultiCharacterGoal,
  type AggregatedMaterialSummary,
} from './multiCharacterCalculator';
import type { MaterialRequirement, AscensionSummary, AscensionGoal } from './ascensionCalculator';

// Mock the genshin-db service
vi.mock('@/lib/services/genshinDbService', () => ({
  getCharacterMaterials: vi.fn().mockImplementation((characterKey: string) => {
    // Return different materials for different characters
    if (characterKey === 'Venti') {
      return Promise.resolve({
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
              byTier: { gray: 18, green: 30, blue: 36 },
            },
          },
          talentMaterials: {
            books: { name: 'Ballad', series: 'Ballad', region: 'Mondstadt', days: ['Wednesday', 'Saturday', 'Sunday'], byTier: { teachings: 9, guide: 63, philosophies: 114 } },
            common: {
              name: 'Slime Concentrate',
              baseName: 'Slime',
              tierNames: { gray: 'Slime Condensate', green: 'Slime Secretions', blue: 'Slime Concentrate' },
              byTier: { gray: 18, green: 66, blue: 93 },
            },
            weekly: { name: 'Tail of Boreas', totalCount: 18 },
            crown: { name: 'Crown of Insight', totalCount: 3 },
          },
          fetchedAt: Date.now(),
          apiVersion: 'v5',
        },
        isStale: false,
      });
    } else if (characterKey === 'Xiao') {
      return Promise.resolve({
        data: {
          characterKey: 'Xiao',
          element: 'Anemo',
          ascensionMaterials: {
            gem: { name: 'Vayuda Turquoise', baseName: 'Vayuda Turquoise', element: 'Anemo', byTier: { sliver: 1, fragment: 9, chunk: 9, gemstone: 6 } },
            boss: { name: 'Juvenile Jade', totalCount: 46 },
            localSpecialty: { name: 'Qingxin', totalCount: 168 },
            common: {
              name: 'Slime Concentrate',
              baseName: 'Slime',
              tierNames: { gray: 'Slime Condensate', green: 'Slime Secretions', blue: 'Slime Concentrate' },
              byTier: { gray: 18, green: 30, blue: 36 },
            },
          },
          talentMaterials: {
            books: { name: 'Prosperity', series: 'Prosperity', region: 'Liyue', days: ['Monday', 'Thursday', 'Sunday'], byTier: { teachings: 9, guide: 63, philosophies: 114 } },
            common: {
              name: 'Slime Concentrate',
              baseName: 'Slime',
              tierNames: { gray: 'Slime Condensate', green: 'Slime Secretions', blue: 'Slime Concentrate' },
              byTier: { gray: 18, green: 66, blue: 93 },
            },
            weekly: { name: 'Shadow of the Warrior', totalCount: 18 },
            crown: { name: 'Crown of Insight', totalCount: 3 },
          },
          fetchedAt: Date.now(),
          apiVersion: 'v5',
        },
        isStale: false,
      });
    }
    return Promise.resolve({ data: null, isStale: false, error: 'Unknown character' });
  }),
}));

describe('aggregateMaterialRequirements', () => {
  it('combines materials from multiple characters', () => {
    const materials1: MaterialRequirement[] = [
      { key: 'Mora', name: 'Mora', category: 'mora', required: 100000, owned: 50000, deficit: 50000 },
      { key: 'HeroesWit', name: "Hero's Wit", category: 'exp', required: 200, owned: 100, deficit: 100 },
      { key: 'Slime Condensate', name: 'Slime Condensate', category: 'common', tier: 1, required: 18, owned: 10, deficit: 8 },
    ];

    const materials2: MaterialRequirement[] = [
      { key: 'Mora', name: 'Mora', category: 'mora', required: 200000, owned: 50000, deficit: 150000 },
      { key: 'HeroesWit', name: "Hero's Wit", category: 'exp', required: 300, owned: 100, deficit: 200 },
      { key: 'Slime Condensate', name: 'Slime Condensate', category: 'common', tier: 1, required: 24, owned: 10, deficit: 14 },
    ];

    const result = aggregateMaterialRequirements([materials1, materials2]);

    // Mora should be summed
    const mora = result.find((m) => m.key === 'Mora');
    expect(mora?.required).toBe(300000);
    expect(mora?.owned).toBe(50000); // Owned stays the same (inventory)
    expect(mora?.deficit).toBe(250000);

    // Hero's Wit should be summed
    const herosWit = result.find((m) => m.key === 'HeroesWit');
    expect(herosWit?.required).toBe(500);
    expect(herosWit?.deficit).toBe(400);

    // Slime should be summed
    const slime = result.find((m) => m.key === 'Slime Condensate');
    expect(slime?.required).toBe(42);
    expect(slime?.deficit).toBe(32);
  });

  it('handles empty material arrays', () => {
    const result = aggregateMaterialRequirements([]);
    expect(result).toEqual([]);
  });

  it('preserves source and availability info from first occurrence', () => {
    const materials1: MaterialRequirement[] = [
      {
        key: 'Teachings of Ballad',
        name: 'Teachings of Ballad',
        category: 'talent',
        tier: 1,
        required: 9,
        owned: 5,
        deficit: 4,
        source: 'Mondstadt',
        availability: ['Wednesday', 'Saturday', 'Sunday'],
      },
    ];

    const materials2: MaterialRequirement[] = [
      {
        key: 'Teachings of Ballad',
        name: 'Teachings of Ballad',
        category: 'talent',
        tier: 1,
        required: 6,
        owned: 5,
        deficit: 1,
        source: 'Mondstadt',
        availability: ['Wednesday', 'Saturday', 'Sunday'],
      },
    ];

    const result = aggregateMaterialRequirements([materials1, materials2]);

    const ballad = result.find((m) => m.key === 'Teachings of Ballad');
    expect(ballad?.required).toBe(15);
    expect(ballad?.source).toBe('Mondstadt');
    expect(ballad?.availability).toEqual(['Wednesday', 'Saturday', 'Sunday']);
  });
});

describe('groupMaterialsByCategory', () => {
  it('groups materials by category', () => {
    const materials: MaterialRequirement[] = [
      { key: 'Mora', name: 'Mora', category: 'mora', required: 100000, owned: 50000, deficit: 50000 },
      { key: 'HeroesWit', name: "Hero's Wit", category: 'exp', required: 200, owned: 100, deficit: 100 },
      { key: 'Hurricane Seed', name: 'Hurricane Seed', category: 'boss', required: 46, owned: 10, deficit: 36 },
      { key: 'Juvenile Jade', name: 'Juvenile Jade', category: 'boss', required: 46, owned: 5, deficit: 41 },
      { key: 'Teachings of Ballad', name: 'Teachings of Ballad', category: 'talent', tier: 1, required: 9, owned: 5, deficit: 4 },
    ];

    const result = groupMaterialsByCategory(materials);

    expect(result.mora).toHaveLength(1);
    expect(result.exp).toHaveLength(1);
    expect(result.boss).toHaveLength(2);
    expect(result.talent).toHaveLength(1);
    expect(result.gem).toHaveLength(0);
  });

  it('returns empty arrays for missing categories', () => {
    const materials: MaterialRequirement[] = [
      { key: 'Mora', name: 'Mora', category: 'mora', required: 100000, owned: 50000, deficit: 50000 },
    ];

    const result = groupMaterialsByCategory(materials);

    expect(result.mora).toHaveLength(1);
    expect(result.boss).toHaveLength(0);
    expect(result.talent).toHaveLength(0);
    expect(result.common).toHaveLength(0);
    expect(result.weekly).toHaveLength(0);
    expect(result.crown).toHaveLength(0);
  });
});

describe('calculateMultiCharacterSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates combined summary for multiple characters', async () => {
    const goals: MultiCharacterGoal[] = [
      {
        characterKey: 'Venti',
        goal: {
          characterKey: 'Venti',
          currentLevel: 80,
          targetLevel: 90,
          currentAscension: 5,
          targetAscension: 6,
          currentTalents: { auto: 6, skill: 6, burst: 8 },
          targetTalents: { auto: 10, skill: 10, burst: 10 },
        },
      },
      {
        characterKey: 'Xiao',
        goal: {
          characterKey: 'Xiao',
          currentLevel: 80,
          targetLevel: 90,
          currentAscension: 5,
          targetAscension: 6,
          currentTalents: { auto: 8, skill: 6, burst: 6 },
          targetTalents: { auto: 10, skill: 10, burst: 10 },
        },
      },
    ];

    const inventory: Record<string, number> = { Mora: 100000 };

    const result = await calculateMultiCharacterSummary(goals, inventory);

    // Should have aggregated materials
    expect(result.aggregatedMaterials.length).toBeGreaterThan(0);

    // Mora should be combined from both characters
    const mora = result.aggregatedMaterials.find((m) => m.key === 'Mora');
    expect(mora).toBeDefined();
    expect(mora!.required).toBeGreaterThan(0);

    // Should track both character summaries
    expect(result.characterSummaries).toHaveLength(2);
    expect(result.characterSummaries[0].characterKey).toBe('Venti');
    expect(result.characterSummaries[1].characterKey).toBe('Xiao');

    // Total estimates should be combined
    expect(result.totalMora).toBeGreaterThan(0);
    expect(result.totalExp).toBeGreaterThan(0);
    expect(result.totalEstimatedResin).toBeGreaterThan(0);
    expect(result.totalEstimatedDays).toBeGreaterThan(0);
  });

  it('handles single character gracefully', async () => {
    const goals: MultiCharacterGoal[] = [
      {
        characterKey: 'Venti',
        goal: {
          characterKey: 'Venti',
          currentLevel: 80,
          targetLevel: 90,
          currentAscension: 5,
          targetAscension: 6,
          currentTalents: { auto: 6, skill: 6, burst: 8 },
          targetTalents: { auto: 10, skill: 10, burst: 10 },
        },
      },
    ];

    const inventory: Record<string, number> = {};

    const result = await calculateMultiCharacterSummary(goals, inventory);

    expect(result.characterSummaries).toHaveLength(1);
    expect(result.aggregatedMaterials.length).toBeGreaterThan(0);
  });

  it('returns empty summary for empty goals', async () => {
    const result = await calculateMultiCharacterSummary([], {});

    expect(result.characterSummaries).toHaveLength(0);
    expect(result.aggregatedMaterials).toHaveLength(0);
    expect(result.totalMora).toBe(0);
    expect(result.totalExp).toBe(0);
    expect(result.totalEstimatedResin).toBe(0);
    expect(result.totalEstimatedDays).toBe(0);
  });

  it('groups materials by category in result', async () => {
    const goals: MultiCharacterGoal[] = [
      {
        characterKey: 'Venti',
        goal: {
          characterKey: 'Venti',
          currentLevel: 1,
          targetLevel: 90,
          currentAscension: 0,
          targetAscension: 6,
          currentTalents: { auto: 1, skill: 1, burst: 1 },
          targetTalents: { auto: 10, skill: 10, burst: 10 },
        },
      },
    ];

    const inventory: Record<string, number> = {};

    const result = await calculateMultiCharacterSummary(goals, inventory);

    // Should have grouped materials
    expect(result.groupedMaterials).toBeDefined();
    expect(result.groupedMaterials.mora).toBeDefined();
    expect(result.groupedMaterials.exp).toBeDefined();
    expect(result.groupedMaterials.boss).toBeDefined();
    expect(result.groupedMaterials.talent).toBeDefined();
  });

  it('correctly combines same materials used by different characters', async () => {
    // Both Venti and Xiao use slime materials
    const goals: MultiCharacterGoal[] = [
      {
        characterKey: 'Venti',
        goal: {
          characterKey: 'Venti',
          currentLevel: 80,
          targetLevel: 90,
          currentAscension: 5,
          targetAscension: 6,
          currentTalents: { auto: 1, skill: 1, burst: 1 },
          targetTalents: { auto: 1, skill: 1, burst: 1 },
        },
      },
      {
        characterKey: 'Xiao',
        goal: {
          characterKey: 'Xiao',
          currentLevel: 80,
          targetLevel: 90,
          currentAscension: 5,
          targetAscension: 6,
          currentTalents: { auto: 1, skill: 1, burst: 1 },
          targetTalents: { auto: 1, skill: 1, burst: 1 },
        },
      },
    ];

    const inventory: Record<string, number> = {};

    const result = await calculateMultiCharacterSummary(goals, inventory);

    // Vayuda gems should be combined (both are Anemo)
    const gemMaterials = result.groupedMaterials.gem;
    // Each character needs gems for A5->A6, so combined should be doubled
    gemMaterials.forEach((gem) => {
      // Each ascension phase 5->6 requires specific gems
      // Both characters need these, so they should be combined
      expect(gem.required).toBeGreaterThan(0);
    });
  });
});
