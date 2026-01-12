/**
 * Ascension Calculator
 *
 * Calculates materials needed to reach target levels
 * and compares against current inventory
 */

import type { Character } from '@/types';
import {
  CHARACTER_ASCENSION_COSTS,
  TALENT_LEVEL_COSTS,
  EXP_BOOK_VALUES,
  CHARACTER_EXP_REQUIREMENTS,
  RESIN_COSTS,
  DOMAIN_DROPS_PER_RUN,
  MATERIAL_CONVERSION_RATE,
} from './materialConstants';

/**
 * Normalize a material key for lookup by converting to lowercase and removing special chars
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Look up a material count from inventory with flexible key matching
 * Handles variations like "Hero's Wit", "HeroesWit", "HerosWit"
 */
function getMaterialCount(
  inventory: Record<string, number>,
  ...possibleKeys: string[]
): number {
  // Try exact key matches first
  for (const key of possibleKeys) {
    if (inventory[key] !== undefined) {
      return inventory[key];
    }
  }

  // Try normalized lookups
  const normalizedTargets = possibleKeys.map(normalizeKey);
  for (const [key, value] of Object.entries(inventory)) {
    const normalizedKey = normalizeKey(key);
    if (normalizedTargets.includes(normalizedKey)) {
      return value;
    }
  }

  return 0;
}

export interface AscensionGoal {
  characterKey: string;
  currentLevel: number;
  targetLevel: number;
  currentAscension: number;
  targetAscension: number;
  currentTalents: { auto: number; skill: number; burst: number };
  targetTalents: { auto: number; skill: number; burst: number };
}

export interface MaterialRequirement {
  key: string;
  name: string;
  category: 'mora' | 'exp' | 'boss' | 'gem' | 'localSpecialty' | 'common' | 'talent' | 'weekly' | 'crown';
  tier?: number; // For tiered materials (1-4)
  required: number;
  owned: number;
  deficit: number;
}

export interface AscensionSummary {
  characterKey: string;
  materials: MaterialRequirement[];
  totalMora: number;
  totalExp: number;
  estimatedResin: number;
  estimatedDays: number;
  canAscend: boolean;
  nextAscensionReady: boolean;
}

/**
 * Get the ascension phase for a given level cap
 */
export function getAscensionPhase(levelCap: number): number {
  const phases = [20, 40, 50, 60, 70, 80, 90];
  return phases.findIndex((cap) => cap >= levelCap);
}

/**
 * Calculate materials needed between two ascension phases
 */
export function calculateAscensionMaterials(
  fromAscension: number,
  toAscension: number
): {
  mora: number;
  bossMat: number;
  localSpecialty: number;
  commonMat: number[];
  gem: number[];
} {
  const result = {
    mora: 0,
    bossMat: 0,
    localSpecialty: 0,
    commonMat: [0, 0, 0],
    gem: [0, 0, 0, 0],
  };

  // Sum up costs for each ascension phase
  for (let phase = fromAscension; phase < toAscension && phase < CHARACTER_ASCENSION_COSTS.length - 1; phase++) {
    const cost = CHARACTER_ASCENSION_COSTS[phase];
    if (cost) {
      result.mora += cost.mora;
      result.bossMat += cost.bossMat;
      result.localSpecialty += cost.localSpecialty;
      cost.commonMat.forEach((val, i) => {
        if (result.commonMat[i] !== undefined) result.commonMat[i] += val;
      });
      cost.gem.forEach((val, i) => {
        if (result.gem[i] !== undefined) result.gem[i] += val;
      });
    }
  }

  return result;
}

/**
 * Calculate materials needed for talent levels
 */
export function calculateTalentMaterials(
  fromLevel: number,
  toLevel: number
): {
  mora: number;
  books: number[];
  commonMat: number[];
  weeklyBoss: number;
  crown: number;
} {
  const result = {
    mora: 0,
    books: [0, 0, 0],
    commonMat: [0, 0, 0],
    weeklyBoss: 0,
    crown: 0,
  };

  // Talent costs are 0-indexed (level 2 is index 0)
  for (let level = fromLevel; level < toLevel; level++) {
    const costIndex = level - 1; // Level 2 = index 0
    if (costIndex >= 0 && costIndex < TALENT_LEVEL_COSTS.length) {
      const cost = TALENT_LEVEL_COSTS[costIndex];
      if (cost) {
        result.mora += cost.mora;
        cost.books.forEach((val, i) => {
          if (result.books[i] !== undefined) result.books[i] += val;
        });
        cost.commonMat.forEach((val, i) => {
          if (result.commonMat[i] !== undefined) result.commonMat[i] += val;
        });
        result.weeklyBoss += cost.weeklyBoss;
        result.crown += cost.crown;
      }
    }
  }

  return result;
}

/**
 * Calculate EXP books needed between levels
 */
export function calculateExpNeeded(fromLevel: number, toLevel: number): number {
  const fromExp = CHARACTER_EXP_REQUIREMENTS[fromLevel] || 0;
  const toExp = CHARACTER_EXP_REQUIREMENTS[toLevel] || CHARACTER_EXP_REQUIREMENTS[90] || 0;
  return Math.max(0, toExp - fromExp);
}

/**
 * Convert tiered materials to equivalent count (considering crafting)
 */
export function convertToBaseTier(amounts: number[], ownedAmounts: number[]): number {
  // Convert everything to base tier equivalent
  let totalEquivalent = 0;
  let ownedEquivalent = 0;

  amounts.forEach((amt, tier) => {
    totalEquivalent += amt * Math.pow(MATERIAL_CONVERSION_RATE, tier);
  });

  ownedAmounts.forEach((amt, tier) => {
    ownedEquivalent += amt * Math.pow(MATERIAL_CONVERSION_RATE, tier);
  });

  return Math.max(0, totalEquivalent - ownedEquivalent);
}

/**
 * Estimate resin cost for materials
 */
export function estimateResinCost(summary: {
  bossMat: number;
  talentDomainRuns: number;
  expLeyLines: number;
  moraLeyLines: number;
}): number {
  let resin = 0;

  // World boss runs (40 resin each, ~2-3 mats per run)
  resin += Math.ceil(summary.bossMat / 2.5) * RESIN_COSTS.worldBoss;

  // Talent domain runs
  resin += summary.talentDomainRuns * RESIN_COSTS.domainRun;

  // EXP ley lines (average ~4.5 Hero's Wit per run)
  resin += summary.expLeyLines * RESIN_COSTS.leyLine;

  // Mora ley lines (average ~60k per run)
  resin += summary.moraLeyLines * RESIN_COSTS.leyLine;

  return resin;
}

/**
 * Calculate full ascension summary for a character goal
 */
export function calculateAscensionSummary(
  goal: AscensionGoal,
  inventory: Record<string, number>
): AscensionSummary {
  const materials: MaterialRequirement[] = [];

  // Calculate ascension materials
  const ascensionMats = calculateAscensionMaterials(goal.currentAscension, goal.targetAscension);

  // Calculate talent materials (all three talents)
  const talentKeys: (keyof typeof goal.currentTalents)[] = ['auto', 'skill', 'burst'];
  const talentMats = {
    mora: 0,
    books: [0, 0, 0],
    commonMat: [0, 0, 0],
    weeklyBoss: 0,
    crown: 0,
  };

  talentKeys.forEach((key) => {
    const from = goal.currentTalents[key];
    const to = goal.targetTalents[key];
    const mats = calculateTalentMaterials(from, to);
    talentMats.mora += mats.mora;
    mats.books.forEach((v, i) => {
      if (talentMats.books[i] !== undefined) talentMats.books[i] += v;
    });
    mats.commonMat.forEach((v, i) => {
      if (talentMats.commonMat[i] !== undefined) talentMats.commonMat[i] += v;
    });
    talentMats.weeklyBoss += mats.weeklyBoss;
    talentMats.crown += mats.crown;
  });

  // Calculate EXP needed
  const expNeeded = calculateExpNeeded(goal.currentLevel, goal.targetLevel);
  const herosWitNeeded = Math.ceil(expNeeded / EXP_BOOK_VALUES.herosWit);

  // Total mora (ascension + talents + leveling)
  const levelingMora = Math.round(expNeeded * 0.1); // ~10% of EXP value in mora
  const totalMora = ascensionMats.mora + talentMats.mora + levelingMora;

  // Add Mora requirement
  const ownedMora = getMaterialCount(inventory, 'Mora', 'mora');
  materials.push({
    key: 'Mora',
    name: 'Mora',
    category: 'mora',
    required: totalMora,
    owned: ownedMora,
    deficit: Math.max(0, totalMora - ownedMora),
  });

  // Add EXP requirement
  const ownedHerosWit = getMaterialCount(
    inventory,
    'HeroesWit',
    'HerosWit',
    "Hero's Wit",
    'heros_wit'
  );
  materials.push({
    key: 'HeroesWit',
    name: "Hero's Wit",
    category: 'exp',
    required: herosWitNeeded,
    owned: ownedHerosWit,
    deficit: Math.max(0, herosWitNeeded - ownedHerosWit),
  });

  // Add boss material requirement
  if (ascensionMats.bossMat > 0) {
    const ownedBoss = 0; // Would need character-specific boss mat key
    materials.push({
      key: 'BossMaterial',
      name: 'Boss Material',
      category: 'boss',
      required: ascensionMats.bossMat,
      owned: ownedBoss,
      deficit: ascensionMats.bossMat,
    });
  }

  // Add gem requirements by tier
  const gemTierNames = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'];
  ascensionMats.gem.forEach((amt, tier) => {
    if (amt > 0) {
      materials.push({
        key: `Gem_${tier}`,
        name: `Elemental ${gemTierNames[tier] ?? 'Unknown'}`,
        category: 'gem',
        tier: tier + 1,
        required: amt,
        owned: 0,
        deficit: amt,
      });
    }
  });

  // Add local specialty
  if (ascensionMats.localSpecialty > 0) {
    materials.push({
      key: 'LocalSpecialty',
      name: 'Local Specialty',
      category: 'localSpecialty',
      required: ascensionMats.localSpecialty,
      owned: 0,
      deficit: ascensionMats.localSpecialty,
    });
  }

  // Add common enemy materials by tier
  const commonTierNames = ['Common (Gray)', 'Common (Green)', 'Common (Blue)'];
  ascensionMats.commonMat.forEach((amt, tier) => {
    if (amt > 0) {
      materials.push({
        key: `CommonAscension_${tier}`,
        name: commonTierNames[tier] ?? `Common Tier ${tier + 1}`,
        category: 'common',
        tier: tier + 1,
        required: amt,
        owned: 0,
        deficit: amt,
      });
    }
  });

  // Add talent book requirements
  const bookTierNames = ['Teachings', 'Guide', 'Philosophies'];
  talentMats.books.forEach((amt, tier) => {
    if (amt > 0) {
      materials.push({
        key: `TalentBook_${tier}`,
        name: `Talent ${bookTierNames[tier] ?? `Tier ${tier + 1}`}`,
        category: 'talent',
        tier: tier + 1,
        required: amt,
        owned: 0,
        deficit: amt,
      });
    }
  });

  // Add weekly boss material
  if (talentMats.weeklyBoss > 0) {
    materials.push({
      key: 'WeeklyBossMat',
      name: 'Weekly Boss Material',
      category: 'weekly',
      required: talentMats.weeklyBoss,
      owned: 0,
      deficit: talentMats.weeklyBoss,
    });
  }

  // Add crown
  if (talentMats.crown > 0) {
    const ownedCrowns = getMaterialCount(
      inventory,
      'CrownOfInsight',
      'Crown of Insight',
      'crown_of_insight'
    );
    materials.push({
      key: 'CrownOfInsight',
      name: 'Crown of Insight',
      category: 'crown',
      required: talentMats.crown,
      owned: ownedCrowns,
      deficit: Math.max(0, talentMats.crown - ownedCrowns),
    });
  }

  // Estimate resin
  const books0 = talentMats.books[0] ?? 0;
  const books1 = talentMats.books[1] ?? 0;
  const books2 = talentMats.books[2] ?? 0;
  const talentDomainRuns = Math.ceil(
    (books0 / DOMAIN_DROPS_PER_RUN.talentBooks.green) +
    (books1 / (DOMAIN_DROPS_PER_RUN.talentBooks.green * 3 + DOMAIN_DROPS_PER_RUN.talentBooks.blue)) +
    (books2 / (DOMAIN_DROPS_PER_RUN.talentBooks.purple))
  );

  const expLeyLines = Math.ceil(herosWitNeeded / 4.5); // ~4.5 Hero's Wit per run
  const moraLeyLines = Math.ceil(Math.max(0, totalMora - ownedMora) / 60000);

  const estimatedResin = estimateResinCost({
    bossMat: ascensionMats.bossMat,
    talentDomainRuns,
    expLeyLines: Math.max(0, expLeyLines - Math.floor(ownedHerosWit / 4.5)),
    moraLeyLines,
  });

  const estimatedDays = Math.ceil(estimatedResin / 180); // 180 resin per day

  // Check if can ascend (all deficits are 0)
  const canAscend = materials.every((m) => m.deficit === 0);

  // Check if next ascension is ready
  const nextAscensionMats = calculateAscensionMaterials(goal.currentAscension, goal.currentAscension + 1);
  const nextAscensionReady = nextAscensionMats.mora <= ownedMora;

  return {
    characterKey: goal.characterKey,
    materials,
    totalMora,
    totalExp: expNeeded,
    estimatedResin,
    estimatedDays,
    canAscend,
    nextAscensionReady,
  };
}

/**
 * Create a default goal from a character
 */
export function createGoalFromCharacter(character: Character): AscensionGoal {
  return {
    characterKey: character.key,
    currentLevel: character.level,
    targetLevel: 90,
    currentAscension: character.ascension,
    targetAscension: 6,
    currentTalents: { ...character.talent },
    targetTalents: { auto: 10, skill: 10, burst: 10 },
  };
}

/**
 * Create a goal for next ascension only
 */
export function createNextAscensionGoal(character: Character): AscensionGoal {
  const levelCaps = [20, 40, 50, 60, 70, 80, 90];
  const nextAscension = Math.min(character.ascension + 1, 6);
  const nextLevelCap = levelCaps[nextAscension] || 90;

  return {
    characterKey: character.key,
    currentLevel: character.level,
    targetLevel: nextLevelCap,
    currentAscension: character.ascension,
    targetAscension: nextAscension,
    currentTalents: { ...character.talent },
    targetTalents: { ...character.talent }, // Keep talents same for ascension-only goal
  };
}
