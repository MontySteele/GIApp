/**
 * Material Deficit Priority Calculator
 *
 * Analyzes material deficits across multiple characters to determine
 * which materials should be prioritized for farming
 */

import type { MaterialRequirement } from './ascensionCalculator';
import type { GroupedMaterials } from './multiCharacterCalculator';

export interface MaterialPriority {
  material: MaterialRequirement;
  blockedCharacters: string[];
  blockedCount: number;
  totalDeficit: number;
  priorityScore: number;
  category: string;
  farmingType: 'domain' | 'boss' | 'overworld' | 'weekly' | 'leyline' | 'other';
}

export interface DeficitPrioritySummary {
  priorities: MaterialPriority[];
  highPriority: MaterialPriority[];
  mediumPriority: MaterialPriority[];
  lowPriority: MaterialPriority[];
  totalBlockedCharacters: number;
  mostBlockingMaterial: MaterialPriority | null;
}

// Category to farming type mapping
const CATEGORY_FARMING_TYPE: Record<string, MaterialPriority['farmingType']> = {
  talent: 'domain',
  boss: 'boss',
  gem: 'boss', // Gems primarily from bosses
  localSpecialty: 'overworld',
  common: 'overworld',
  weekly: 'weekly',
  exp: 'leyline',
  mora: 'leyline',
  crown: 'other',
};

/**
 * Calculate priority score for a material
 * Higher score = higher priority
 */
function calculatePriorityScore(
  deficit: number,
  blockedCount: number,
  category: string
): number {
  // Base score from deficit amount (logarithmic to prevent huge deficits from dominating)
  const deficitScore = Math.log10(deficit + 1) * 10;

  // Multiplier based on how many characters are blocked
  const blockMultiplier = 1 + (blockedCount - 1) * 0.5;

  // Category weight (talent books and boss materials are harder to farm)
  const categoryWeights: Record<string, number> = {
    talent: 1.5, // Time-gated by domain schedule
    weekly: 2.0, // Time-gated by weekly reset
    boss: 1.3, // Resin-heavy
    gem: 1.2,
    crown: 0.5, // Very limited, can't really farm
    localSpecialty: 0.8, // Easy to collect
    common: 0.7, // Very easy to collect
    exp: 0.6,
    mora: 0.5,
  };

  const categoryWeight = categoryWeights[category] ?? 1.0;

  return deficitScore * blockMultiplier * categoryWeight;
}

/**
 * Analyze character summaries to determine which materials block which characters
 */
export function analyzeDeficitPriority(
  characterMaterialsByName: Map<string, MaterialRequirement[]>,
  groupedMaterials: GroupedMaterials
): DeficitPrioritySummary {
  // Build a map of material key -> characters that need it
  const materialToCharacters: Map<string, Set<string>> = new Map();
  const materialDeficits: Map<string, number> = new Map();

  // Analyze each character's materials
  for (const [characterName, materials] of characterMaterialsByName) {
    for (const mat of materials) {
      if (mat.deficit > 0) {
        const key = `${mat.key}-${mat.tier ?? 0}`;

        // Track which characters need this material
        if (!materialToCharacters.has(key)) {
          materialToCharacters.set(key, new Set());
        }
        materialToCharacters.get(key)?.add(characterName);

        // Track total deficit
        materialDeficits.set(key, (materialDeficits.get(key) ?? 0) + mat.deficit);
      }
    }
  }

  // Get all materials with deficits from grouped materials
  const allCategories: (keyof GroupedMaterials)[] = [
    'talent',
    'boss',
    'gem',
    'weekly',
    'localSpecialty',
    'common',
    'exp',
    'mora',
    'crown',
  ];

  const priorities: MaterialPriority[] = [];

  for (const category of allCategories) {
    const materials = groupedMaterials[category];
    if (!materials) continue;

    for (const mat of materials) {
      if (mat.deficit <= 0) continue;

      const key = `${mat.key}-${mat.tier ?? 0}`;
      const blockedCharacters = Array.from(materialToCharacters.get(key) ?? []);
      const blockedCount = blockedCharacters.length;

      if (blockedCount === 0) continue;

      const priorityScore = calculatePriorityScore(mat.deficit, blockedCount, category);
      const farmingType = CATEGORY_FARMING_TYPE[category] ?? 'other';

      priorities.push({
        material: mat,
        blockedCharacters,
        blockedCount,
        totalDeficit: mat.deficit,
        priorityScore,
        category,
        farmingType,
      });
    }
  }

  // Sort by priority score (highest first)
  priorities.sort((a, b) => b.priorityScore - a.priorityScore);

  // Categorize into high/medium/low priority
  const maxScore = priorities[0]?.priorityScore ?? 0;
  const highThreshold = maxScore * 0.7;
  const mediumThreshold = maxScore * 0.3;

  const highPriority = priorities.filter((p) => p.priorityScore >= highThreshold);
  const mediumPriority = priorities.filter(
    (p) => p.priorityScore >= mediumThreshold && p.priorityScore < highThreshold
  );
  const lowPriority = priorities.filter((p) => p.priorityScore < mediumThreshold);

  // Calculate total blocked characters (unique)
  const allBlockedChars = new Set<string>();
  for (const p of priorities) {
    for (const char of p.blockedCharacters) {
      allBlockedChars.add(char);
    }
  }

  return {
    priorities,
    highPriority,
    mediumPriority,
    lowPriority,
    totalBlockedCharacters: allBlockedChars.size,
    mostBlockingMaterial: priorities[0] ?? null,
  };
}

/**
 * Simplified version that works directly with grouped materials
 * (when character-level breakdown isn't available)
 */
export function analyzeSimpleDeficitPriority(
  groupedMaterials: GroupedMaterials
): DeficitPrioritySummary {
  const allCategories: (keyof GroupedMaterials)[] = [
    'talent',
    'boss',
    'gem',
    'weekly',
    'localSpecialty',
    'common',
    'exp',
    'mora',
    'crown',
  ];

  const priorities: MaterialPriority[] = [];

  for (const category of allCategories) {
    const materials = groupedMaterials[category];
    if (!materials) continue;

    for (const mat of materials) {
      if (mat.deficit <= 0) continue;

      // Without character-level data, estimate blocked count based on deficit magnitude
      const estimatedBlockedCount = Math.min(Math.ceil(mat.deficit / 10), 5);
      const priorityScore = calculatePriorityScore(mat.deficit, estimatedBlockedCount, category);
      const farmingType = CATEGORY_FARMING_TYPE[category] ?? 'other';

      priorities.push({
        material: mat,
        blockedCharacters: [], // Unknown without character data
        blockedCount: estimatedBlockedCount,
        totalDeficit: mat.deficit,
        priorityScore,
        category,
        farmingType,
      });
    }
  }

  // Sort by priority score (highest first)
  priorities.sort((a, b) => b.priorityScore - a.priorityScore);

  // Categorize into high/medium/low priority
  const maxScore = priorities[0]?.priorityScore ?? 0;
  const highThreshold = maxScore * 0.7;
  const mediumThreshold = maxScore * 0.3;

  const highPriority = priorities.filter((p) => p.priorityScore >= highThreshold);
  const mediumPriority = priorities.filter(
    (p) => p.priorityScore >= mediumThreshold && p.priorityScore < highThreshold
  );
  const lowPriority = priorities.filter((p) => p.priorityScore < mediumThreshold);

  return {
    priorities,
    highPriority,
    mediumPriority,
    lowPriority,
    totalBlockedCharacters: 0, // Unknown
    mostBlockingMaterial: priorities[0] ?? null,
  };
}

/**
 * Get a farming recommendation summary
 */
export function getDeficitRecommendation(summary: DeficitPrioritySummary): string {
  if (summary.priorities.length === 0) {
    return 'All materials collected! No farming needed.';
  }

  const top = summary.mostBlockingMaterial;
  if (!top) return 'Check your material deficits.';

  const farmingTypeLabels: Record<MaterialPriority['farmingType'], string> = {
    domain: 'talent domain',
    boss: 'world boss',
    weekly: 'weekly boss',
    overworld: 'overworld collection',
    leyline: 'ley lines',
    other: 'special source',
  };

  const sourceLabel = farmingTypeLabels[top.farmingType];
  const charNote =
    top.blockedCharacters.length > 0
      ? ` (blocking ${top.blockedCharacters.slice(0, 3).join(', ')}${top.blockedCharacters.length > 3 ? '...' : ''})`
      : '';

  return `Priority: ${top.material.name} from ${sourceLabel}${charNote}`;
}
