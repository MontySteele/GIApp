/**
 * Weapon Calculator Tests
 *
 * Tests for calculating weapon ascension material requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateWeaponAscensionMaterials,
  calculateWeaponAscensionSummary,
  createWeaponGoal,
  type WeaponAscensionGoal,
} from './weaponCalculator';

// Mock the genshin-db service
vi.mock('@/lib/services/genshinDbService', () => ({
  getWeaponMaterials: vi.fn().mockImplementation((weaponKey: string) => {
    if (weaponKey === 'Primordial Jade Winged-Spear') {
      return Promise.resolve({
        data: {
          weaponKey: 'Primordial Jade Winged-Spear',
          rarity: 5,
          ascensionMaterials: {
            domain: {
              name: 'Luminous Sands from Guyun',
              series: 'Guyun',
              region: 'Liyue',
              days: ['Monday', 'Thursday', 'Sunday'],
              byTier: {
                green: 5,
                blue: 14,
                purple: 14,
                gold: 6,
              },
            },
            elite: {
              name: 'Hunter\'s Sacrificial Knife',
              baseName: 'Sacrificial Knife',
              byTier: {
                gray: 23,
                green: 27,
                blue: 41,
              },
            },
            common: {
              name: 'Recruit\'s Insignia',
              baseName: 'Insignia',
              tierNames: { gray: 'Recruit\'s Insignia', green: 'Sergeant\'s Insignia', blue: 'Lieutenant\'s Insignia' },
              byTier: {
                gray: 15,
                green: 23,
                blue: 27,
              },
            },
          },
          fetchedAt: Date.now(),
          apiVersion: 'v5',
        },
        isStale: false,
      });
    } else if (weaponKey === 'The Catch') {
      return Promise.resolve({
        data: {
          weaponKey: 'The Catch',
          rarity: 4,
          ascensionMaterials: {
            domain: {
              name: 'Mask of the Wicked Lieutenant',
              series: 'Mask',
              region: 'Inazuma',
              days: ['Monday', 'Thursday', 'Sunday'],
              byTier: {
                green: 3,
                blue: 9,
                purple: 9,
                gold: 4,
              },
            },
            elite: {
              name: 'Chaos Core',
              baseName: 'Chaos',
              byTier: {
                gray: 15,
                green: 18,
                blue: 27,
              },
            },
            common: {
              name: 'Spectral Husk',
              baseName: 'Spectral',
              tierNames: { gray: 'Spectral Husk', green: 'Spectral Heart', blue: 'Spectral Nucleus' },
              byTier: {
                gray: 10,
                green: 15,
                blue: 18,
              },
            },
          },
          fetchedAt: Date.now(),
          apiVersion: 'v5',
        },
        isStale: false,
      });
    }
    return Promise.resolve({ data: null, isStale: false, error: 'Unknown weapon' });
  }),
}));

describe('calculateWeaponAscensionMaterials', () => {
  it('calculates materials for 5-star weapon A5 -> A6', () => {
    const result = calculateWeaponAscensionMaterials(5, 6, 5);

    // 5-star weapon phase 5 (80) costs from WEAPON_ASCENSION_COSTS_5STAR
    expect(result.mora).toBe(65000);
    expect(result.domainMat).toEqual([0, 0, 0, 6]); // Only gold tier
    expect(result.eliteMat).toEqual([0, 0, 27]); // Only blue tier
    expect(result.commonMat).toEqual([0, 0, 18]); // Only blue tier
  });

  it('calculates materials for 4-star weapon A0 -> A6', () => {
    const result = calculateWeaponAscensionMaterials(0, 6, 4);

    // Should sum up all 4-star costs
    expect(result.mora).toBe(150000); // 5k + 15k + 20k + 30k + 35k + 45k
    expect(result.domainMat[0]).toBe(3); // green from first phase
    expect(result.domainMat[3]).toBe(4); // gold from last phase
  });

  it('returns zero for same ascension phase', () => {
    const result = calculateWeaponAscensionMaterials(3, 3, 5);

    expect(result.mora).toBe(0);
    expect(result.domainMat).toEqual([0, 0, 0, 0]);
    expect(result.eliteMat).toEqual([0, 0, 0]);
    expect(result.commonMat).toEqual([0, 0, 0]);
  });
});

describe('createWeaponGoal', () => {
  it('creates a goal for full ascension', () => {
    const weapon = {
      key: 'Primordial Jade Winged-Spear',
      level: 60,
      ascension: 3,
      rarity: 5 as const,
    };

    const goal = createWeaponGoal(weapon, 'full');

    expect(goal.weaponKey).toBe('Primordial Jade Winged-Spear');
    expect(goal.currentLevel).toBe(60);
    expect(goal.targetLevel).toBe(90);
    expect(goal.currentAscension).toBe(3);
    expect(goal.targetAscension).toBe(6);
    expect(goal.rarity).toBe(5);
  });

  it('creates a goal for next ascension only', () => {
    const weapon = {
      key: 'The Catch',
      level: 40,
      ascension: 1,
      rarity: 4 as const,
    };

    const goal = createWeaponGoal(weapon, 'next');

    expect(goal.targetLevel).toBe(50);
    expect(goal.targetAscension).toBe(2);
  });
});

describe('calculateWeaponAscensionSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates summary for a 5-star weapon', async () => {
    const goal: WeaponAscensionGoal = {
      weaponKey: 'Primordial Jade Winged-Spear',
      currentLevel: 80,
      targetLevel: 90,
      currentAscension: 5,
      targetAscension: 6,
      rarity: 5,
    };

    const inventory: Record<string, number> = {};

    const summary = await calculateWeaponAscensionSummary(goal, inventory);

    expect(summary.materials.length).toBeGreaterThan(0);
    expect(summary.totalMora).toBeGreaterThan(0);
    expect(summary.estimatedResin).toBeGreaterThan(0);
    expect(summary.estimatedDays).toBeGreaterThan(0);
  });

  it('calculates summary for a 4-star weapon', async () => {
    const goal: WeaponAscensionGoal = {
      weaponKey: 'The Catch',
      currentLevel: 1,
      targetLevel: 90,
      currentAscension: 0,
      targetAscension: 6,
      rarity: 4,
    };

    const inventory: Record<string, number> = { Mora: 100000 };

    const summary = await calculateWeaponAscensionSummary(goal, inventory);

    // 4-star weapon should need less materials than 5-star
    expect(summary.totalMora).toBe(150000);
    expect(summary.materials.length).toBeGreaterThan(0);
  });

  it('calculates deficit correctly against inventory', async () => {
    const goal: WeaponAscensionGoal = {
      weaponKey: 'Primordial Jade Winged-Spear',
      currentLevel: 80,
      targetLevel: 90,
      currentAscension: 5,
      targetAscension: 6,
      rarity: 5,
    };

    const inventory: Record<string, number> = {
      Mora: 100000, // More than needed
    };

    const summary = await calculateWeaponAscensionSummary(goal, inventory);

    const mora = summary.materials.find((m) => m.key === 'Mora');
    expect(mora).toBeDefined();
    expect(mora!.deficit).toBe(0); // Has enough mora
  });

  it('handles fallback when API returns null', async () => {
    const { getWeaponMaterials } = await import('@/lib/services/genshinDbService');
    vi.mocked(getWeaponMaterials).mockResolvedValueOnce({
      data: null,
      isStale: false,
      error: 'API unavailable',
    });

    const goal: WeaponAscensionGoal = {
      weaponKey: 'Unknown Weapon',
      currentLevel: 1,
      targetLevel: 90,
      currentAscension: 0,
      targetAscension: 6,
      rarity: 4,
    };

    const summary = await calculateWeaponAscensionSummary(goal, {});

    // Should still return materials with generic names
    expect(summary.materials.length).toBeGreaterThan(0);
    expect(summary.error).toBeDefined();
  });
});
