/**
 * Weapon Ascension Calculator
 *
 * Calculates materials needed for weapon ascension
 * and compares against current inventory
 */

import {
  WEAPON_ASCENSION_COSTS_5STAR,
  WEAPON_ASCENSION_COSTS_4STAR,
  RESIN_COSTS,
} from './materialConstants';
import { getWeaponMaterials } from '@/lib/services/genshinDbService';
import { findInventoryKey } from '@/lib/utils/materialNormalization';
import type { WeaponMaterialData } from './weaponMaterials';

export interface WeaponAscensionGoal {
  weaponKey: string;
  currentLevel: number;
  targetLevel: number;
  currentAscension: number;
  targetAscension: number;
  rarity: 4 | 5;
}

export interface WeaponMaterialRequirement {
  key: string;
  name: string;
  category: 'mora' | 'domain' | 'elite' | 'common';
  tier?: number;
  required: number;
  owned: number;
  deficit: number;
  source?: string;
  availability?: string[];
}

export interface WeaponAscensionSummary {
  weaponKey: string;
  materials: WeaponMaterialRequirement[];
  totalMora: number;
  estimatedResin: number;
  estimatedDays: number;
  canAscend: boolean;
  isStale?: boolean;
  error?: string;
}

/**
 * Get ascension costs based on weapon rarity
 */
function getAscensionCosts(rarity: 4 | 5) {
  return rarity === 5 ? WEAPON_ASCENSION_COSTS_5STAR : WEAPON_ASCENSION_COSTS_4STAR;
}

/**
 * Calculate materials needed between two ascension phases
 */
export function calculateWeaponAscensionMaterials(
  fromAscension: number,
  toAscension: number,
  rarity: 4 | 5
): {
  mora: number;
  domainMat: number[];
  eliteMat: number[];
  commonMat: number[];
} {
  const result = {
    mora: 0,
    domainMat: [0, 0, 0, 0], // green, blue, purple, gold
    eliteMat: [0, 0, 0], // gray, green, blue
    commonMat: [0, 0, 0], // gray, green, blue
  };

  const costs = getAscensionCosts(rarity);

  for (let phase = fromAscension; phase < toAscension && phase < costs.length; phase++) {
    const cost = costs[phase];
    if (cost) {
      result.mora += cost.mora;
      cost.domainMat.forEach((val, i) => {
        if (result.domainMat[i] !== undefined) result.domainMat[i] += val;
      });
      cost.eliteMat.forEach((val, i) => {
        if (result.eliteMat[i] !== undefined) result.eliteMat[i] += val;
      });
      cost.commonMat.forEach((val, i) => {
        if (result.commonMat[i] !== undefined) result.commonMat[i] += val;
      });
    }
  }

  return result;
}

/**
 * Build material requirements using real weapon data from genshin-db API
 */
async function buildWeaponMaterialsWithApiData(
  inventory: Record<string, number>,
  ascensionMats: ReturnType<typeof calculateWeaponAscensionMaterials>,
  weaponData: WeaponMaterialData | null
): Promise<{ materials: WeaponMaterialRequirement[]; isStale: boolean; error?: string }> {
  const materials: WeaponMaterialRequirement[] = [];
  let error: string | undefined;

  if (!weaponData) {
    error = 'Using generic material names (API data unavailable)';
  }

  // Helper to add material
  const addMaterial = (
    apiName: string,
    displayName: string,
    category: WeaponMaterialRequirement['category'],
    required: number,
    tier?: number,
    source?: string,
    availability?: string[]
  ) => {
    const inventoryKey = findInventoryKey(apiName, inventory);
    const owned = inventory[inventoryKey] ?? 0;

    materials.push({
      key: inventoryKey,
      name: displayName,
      category,
      tier,
      required,
      owned,
      deficit: Math.max(0, required - owned),
      source,
      availability,
    });
  };

  // Add domain materials by tier
  const domainTierNames = ['Green', 'Blue', 'Purple', 'Gold'];
  const domainTierKeys = ['green', 'blue', 'purple', 'gold'] as const;

  ascensionMats.domainMat.forEach((amt, tier) => {
    if (amt > 0) {
      const tierKey = domainTierKeys[tier];
      // Get actual name from API data if available
      const actualName = tierKey && weaponData?.ascensionMaterials?.domain?.byTier?.[tierKey]
        ? weaponData.ascensionMaterials.domain.name
        : null;
      const baseName = weaponData?.ascensionMaterials?.domain?.series || 'Weapon Domain Material';
      const displayName = actualName || `${baseName} (${domainTierNames[tier]})`;
      const days = weaponData?.ascensionMaterials?.domain?.days;
      const region = weaponData?.ascensionMaterials?.domain?.region;

      addMaterial(displayName, displayName, 'domain', amt, tier + 1, region, days);
    }
  });

  // Add elite materials by tier
  const eliteTierNames = ['Gray', 'Green', 'Blue'];
  ascensionMats.eliteMat.forEach((amt, tier) => {
    if (amt > 0) {
      const baseName = weaponData?.ascensionMaterials?.elite?.baseName || 'Elite Material';
      const displayName = `${baseName} (${eliteTierNames[tier]})`;
      addMaterial(displayName, displayName, 'elite', amt, tier + 1);
    }
  });

  // Add common materials by tier
  const commonTierInfo: Array<{ label: string; key: 'gray' | 'green' | 'blue' }> = [
    { label: 'Gray', key: 'gray' },
    { label: 'Green', key: 'green' },
    { label: 'Blue', key: 'blue' },
  ];

  ascensionMats.commonMat.forEach((amt, tier) => {
    const tierInfo = commonTierInfo[tier];
    if (amt > 0 && tierInfo) {
      const actualName = weaponData?.ascensionMaterials?.common?.tierNames?.[tierInfo.key];
      const fallbackName = weaponData?.ascensionMaterials?.common?.baseName || 'Common Material';
      const displayName = actualName || `${fallbackName} (${tierInfo.label})`;
      addMaterial(displayName, displayName, 'common', amt, tier + 1);
    }
  });

  return { materials, isStale: false, error };
}

/**
 * Calculate full weapon ascension summary
 */
export async function calculateWeaponAscensionSummary(
  goal: WeaponAscensionGoal,
  inventory: Record<string, number>
): Promise<WeaponAscensionSummary> {
  // Fetch weapon material data from genshin-db API
  const { data: weaponData, isStale, error } = await getWeaponMaterials(goal.weaponKey, {
    useStaleOnError: true,
  });

  // Calculate ascension materials
  const ascensionMats = calculateWeaponAscensionMaterials(
    goal.currentAscension,
    goal.targetAscension,
    goal.rarity
  );

  // Build materials list with API data
  const {
    materials: apiMaterials,
    isStale: materialsStale,
    error: materialsError,
  } = await buildWeaponMaterialsWithApiData(inventory, ascensionMats, weaponData);

  const materials: WeaponMaterialRequirement[] = [];

  // Add Mora requirement
  const ownedMora = inventory['Mora'] ?? inventory['mora'] ?? 0;
  materials.push({
    key: 'Mora',
    name: 'Mora',
    category: 'mora',
    required: ascensionMats.mora,
    owned: ownedMora,
    deficit: Math.max(0, ascensionMats.mora - ownedMora),
  });

  // Add API-sourced materials
  materials.push(...apiMaterials);

  // Estimate resin
  // Domain materials: ~20 resin per run, ~2-3 drops per run average
  const domainTotal = ascensionMats.domainMat.reduce((sum, amt, tier) => sum + amt * (tier + 1), 0);
  const domainRuns = Math.ceil(domainTotal / 2.5);
  const domainResin = domainRuns * RESIN_COSTS.domainRun;

  // Mora ley lines for remaining mora
  const moraDef = Math.max(0, ascensionMats.mora - ownedMora);
  const moraLeyLines = Math.ceil(moraDef / 60000);
  const moraResin = moraLeyLines * RESIN_COSTS.leyLine;

  const estimatedResin = domainResin + moraResin;
  const estimatedDays = Math.ceil(estimatedResin / 180);

  // Check if can ascend
  const canAscend = materials.every((m) => m.deficit === 0);

  return {
    weaponKey: goal.weaponKey,
    materials,
    totalMora: ascensionMats.mora,
    estimatedResin,
    estimatedDays,
    canAscend,
    isStale: isStale || materialsStale,
    error: error || materialsError,
  };
}

/**
 * Create a weapon goal
 */
export function createWeaponGoal(
  weapon: {
    key: string;
    level: number;
    ascension: number;
    rarity: 4 | 5;
  },
  goalType: 'full' | 'comfortable' | 'next' = 'full'
): WeaponAscensionGoal {
  const levelCaps = [20, 40, 50, 60, 70, 80, 90];

  if (goalType === 'next') {
    const nextAscension = Math.min(weapon.ascension + 1, 6);
    const nextLevelCap = levelCaps[nextAscension] || 90;

    return {
      weaponKey: weapon.key,
      currentLevel: weapon.level,
      targetLevel: nextLevelCap,
      currentAscension: weapon.ascension,
      targetAscension: nextAscension,
      rarity: weapon.rarity,
    };
  }

  if (goalType === 'comfortable') {
    // 80/80 build - A5
    return {
      weaponKey: weapon.key,
      currentLevel: weapon.level,
      targetLevel: 80,
      currentAscension: weapon.ascension,
      targetAscension: 5,
      rarity: weapon.rarity,
    };
  }

  // Full ascension (90)
  return {
    weaponKey: weapon.key,
    currentLevel: weapon.level,
    targetLevel: 90,
    currentAscension: weapon.ascension,
    targetAscension: 6,
    rarity: weapon.rarity,
  };
}
