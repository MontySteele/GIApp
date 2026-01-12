/**
 * Multi-Character Calculator
 *
 * Aggregates material requirements across multiple characters
 * for unified planning and deficit calculations
 */

import {
  calculateAscensionSummary,
  type AscensionGoal,
  type AscensionSummary,
  type MaterialRequirement,
} from './ascensionCalculator';

/**
 * Goal for a single character in multi-character planning
 */
export interface MultiCharacterGoal {
  characterKey: string;
  goal: AscensionGoal;
}

/**
 * Materials grouped by category
 */
export interface GroupedMaterials {
  mora: MaterialRequirement[];
  exp: MaterialRequirement[];
  boss: MaterialRequirement[];
  gem: MaterialRequirement[];
  localSpecialty: MaterialRequirement[];
  common: MaterialRequirement[];
  talent: MaterialRequirement[];
  weekly: MaterialRequirement[];
  crown: MaterialRequirement[];
}

/**
 * Aggregated summary for multiple characters
 */
export interface AggregatedMaterialSummary {
  characterSummaries: AscensionSummary[];
  aggregatedMaterials: MaterialRequirement[];
  groupedMaterials: GroupedMaterials;
  totalMora: number;
  totalExp: number;
  totalEstimatedResin: number;
  totalEstimatedDays: number;
  allCanAscend: boolean;
  anyStale: boolean;
  errors: string[];
}

/**
 * Aggregate material requirements from multiple character summaries
 * Combines same materials and recalculates deficits
 */
export function aggregateMaterialRequirements(
  materialArrays: MaterialRequirement[][]
): MaterialRequirement[] {
  if (materialArrays.length === 0) {
    return [];
  }

  const aggregated = new Map<string, MaterialRequirement>();

  for (const materials of materialArrays) {
    for (const material of materials) {
      // Create a unique key for the material (key + tier for tiered materials)
      const mapKey = material.tier ? `${material.key}:${material.tier}` : material.key;

      const existing = aggregated.get(mapKey);

      if (existing) {
        // Add to existing: sum required, keep owned the same (it's inventory)
        existing.required += material.required;
        // Recalculate deficit based on combined required vs inventory owned
        existing.deficit = Math.max(0, existing.required - existing.owned);
      } else {
        // Add new material (clone to avoid mutation)
        aggregated.set(mapKey, {
          ...material,
          // Keep all original properties including source and availability
        });
      }
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Group materials by their category for organized display
 */
export function groupMaterialsByCategory(materials: MaterialRequirement[]): GroupedMaterials {
  const groups: GroupedMaterials = {
    mora: [],
    exp: [],
    boss: [],
    gem: [],
    localSpecialty: [],
    common: [],
    talent: [],
    weekly: [],
    crown: [],
  };

  for (const material of materials) {
    const category = material.category;
    if (category in groups) {
      groups[category].push(material);
    }
  }

  return groups;
}

/**
 * Calculate combined material summary for multiple characters
 */
export async function calculateMultiCharacterSummary(
  goals: MultiCharacterGoal[],
  inventory: Record<string, number>
): Promise<AggregatedMaterialSummary> {
  // Handle empty goals
  if (goals.length === 0) {
    return {
      characterSummaries: [],
      aggregatedMaterials: [],
      groupedMaterials: {
        mora: [],
        exp: [],
        boss: [],
        gem: [],
        localSpecialty: [],
        common: [],
        talent: [],
        weekly: [],
        crown: [],
      },
      totalMora: 0,
      totalExp: 0,
      totalEstimatedResin: 0,
      totalEstimatedDays: 0,
      allCanAscend: true,
      anyStale: false,
      errors: [],
    };
  }

  // Calculate summary for each character in parallel
  const summaryPromises = goals.map((g) =>
    calculateAscensionSummary(g.goal, inventory)
  );

  const characterSummaries = await Promise.all(summaryPromises);

  // Extract material arrays from each summary
  const materialArrays = characterSummaries.map((s) => s.materials);

  // Aggregate all materials
  const aggregatedMaterials = aggregateMaterialRequirements(materialArrays);

  // Group materials by category
  const groupedMaterials = groupMaterialsByCategory(aggregatedMaterials);

  // Calculate totals
  const totalMora = characterSummaries.reduce((sum, s) => sum + s.totalMora, 0);
  const totalExp = characterSummaries.reduce((sum, s) => sum + s.totalExp, 0);
  const totalEstimatedResin = characterSummaries.reduce(
    (sum, s) => sum + s.estimatedResin,
    0
  );

  // Days should be max of individual, since we can farm for multiple characters simultaneously
  // But we need more resin, so use resin-based calculation
  const totalEstimatedDays = Math.ceil(totalEstimatedResin / 180);

  // Check if all characters can ascend
  const allCanAscend = characterSummaries.every((s) => s.canAscend);

  // Check if any data is stale
  const anyStale = characterSummaries.some((s) => s.isStale);

  // Collect all errors
  const errors = characterSummaries
    .filter((s) => s.error)
    .map((s) => `${s.characterKey}: ${s.error}`);

  return {
    characterSummaries,
    aggregatedMaterials,
    groupedMaterials,
    totalMora,
    totalExp,
    totalEstimatedResin,
    totalEstimatedDays,
    allCanAscend,
    anyStale,
    errors,
  };
}

/**
 * Create default goals from multiple characters
 */
export function createGoalsFromCharacters(
  characters: Array<{ key: string; level: number; ascension: number; talent: { auto: number; skill: number; burst: number } }>,
  goalType: 'full' | 'comfortable' | 'next' = 'full'
): MultiCharacterGoal[] {
  return characters.map((char) => {
    let goal: AscensionGoal;

    if (goalType === 'comfortable') {
      // 80/8/8/8 build
      goal = {
        characterKey: char.key,
        currentLevel: char.level,
        targetLevel: 80,
        currentAscension: char.ascension,
        targetAscension: 6,
        currentTalents: { ...char.talent },
        targetTalents: {
          auto: Math.max(char.talent.auto, 8),
          skill: Math.max(char.talent.skill, 8),
          burst: Math.max(char.talent.burst, 8),
        },
      };
    } else if (goalType === 'next') {
      // Next ascension only
      const levelCaps = [20, 40, 50, 60, 70, 80, 90];
      const nextAscension = Math.min(char.ascension + 1, 6);
      const nextLevelCap = levelCaps[nextAscension] || 90;

      goal = {
        characterKey: char.key,
        currentLevel: char.level,
        targetLevel: nextLevelCap,
        currentAscension: char.ascension,
        targetAscension: nextAscension,
        currentTalents: { ...char.talent },
        targetTalents: { ...char.talent },
      };
    } else {
      // Full 90/10/10/10 build
      goal = {
        characterKey: char.key,
        currentLevel: char.level,
        targetLevel: 90,
        currentAscension: char.ascension,
        targetAscension: 6,
        currentTalents: { ...char.talent },
        targetTalents: { auto: 10, skill: 10, burst: 10 },
      };
    }

    return {
      characterKey: char.key,
      goal,
    };
  });
}

/**
 * Calculate materials needed from selected characters in roster
 */
export async function calculateFromRoster(
  selectedCharacterKeys: string[],
  characters: Array<{ key: string; level: number; ascension: number; talent: { auto: number; skill: number; burst: number } }>,
  inventory: Record<string, number>,
  goalType: 'full' | 'comfortable' | 'next' = 'full'
): Promise<AggregatedMaterialSummary> {
  const selectedCharacters = characters.filter((c) =>
    selectedCharacterKeys.includes(c.key)
  );

  const goals = createGoalsFromCharacters(selectedCharacters, goalType);

  return calculateMultiCharacterSummary(goals, inventory);
}
