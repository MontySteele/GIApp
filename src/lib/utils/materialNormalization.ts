/**
 * Material Key Normalization
 *
 * Handles matching between genshin-db API material names
 * and Irminsul inventory keys (which can have various formats)
 */

/**
 * Common material name aliases for better matching
 */
const MATERIAL_ALIASES: Record<string, string[]> = {
  // EXP Books
  heroswit: ["Hero's Wit", 'HeroesWit', 'HerosWit', 'heros_wit', 'Heros Wit'],
  adventurersexperience: ["Adventurer's Experience", 'AdventurersExperience', 'adventurers_experience'],
  wanderersadvice: ["Wanderer's Advice", 'WanderersAdvice', 'wanderers_advice'],

  // Currency
  mora: ['Mora', 'mora', 'MORA'],
  primogem: ['Primogem', 'primogem', 'Primogems'],

  // Crown
  crownofinsight: ['Crown of Insight', 'CrownOfInsight', 'crown_of_insight', 'Crown'],

  // Common patterns
  whopperflowernectar: ['Whopperflower Nectar', 'WhopperflowerNectar', 'whopperflower_nectar'],
  shimmernectar: ['Shimmering Nectar', 'ShimmeringNectar', 'shimmering_nectar'],
  energynectar: ['Energy Nectar', 'EnergyNectar', 'energy_nectar'],
};

/**
 * Normalize a string for comparison:
 * - Lowercase
 * - Remove all non-alphanumeric characters
 * - Remove spaces, apostrophes, hyphens, underscores
 */
export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find the best matching inventory key for an API material name
 *
 * Strategy:
 * 1. Try exact match first
 * 2. Try normalized match
 * 3. Try known aliases
 * 4. Return original if no match (will show 0 owned)
 */
export function findInventoryKey(
  apiName: string,
  inventory: Record<string, number>
): string {
  // 1. Try exact match
  if (inventory[apiName] !== undefined) {
    return apiName;
  }

  // 2. Try normalized matching against all inventory keys
  const normalizedTarget = normalizeKey(apiName);
  for (const [key] of Object.entries(inventory)) {
    if (normalizeKey(key) === normalizedTarget) {
      return key;
    }
  }

  // 3. Try known aliases
  const aliases = MATERIAL_ALIASES[normalizedTarget];
  if (aliases) {
    for (const alias of aliases) {
      if (inventory[alias] !== undefined) {
        return alias;
      }
      // Also try normalized alias
      const normalizedAlias = normalizeKey(alias);
      for (const [key] of Object.entries(inventory)) {
        if (normalizeKey(key) === normalizedAlias) {
          return key;
        }
      }
    }
  }

  // 4. Return original name as fallback
  return apiName;
}

/**
 * Get material count from inventory with fuzzy matching
 */
export function getMaterialCount(
  apiName: string,
  inventory: Record<string, number>
): number {
  const key = findInventoryKey(apiName, inventory);
  return inventory[key] ?? 0;
}

/**
 * Batch lookup for multiple materials
 */
export function getMaterialCounts(
  apiNames: string[],
  inventory: Record<string, number>
): Record<string, { inventoryKey: string; count: number }> {
  const result: Record<string, { inventoryKey: string; count: number }> = {};

  for (const apiName of apiNames) {
    const inventoryKey = findInventoryKey(apiName, inventory);
    const count = inventory[inventoryKey] ?? 0;
    result[apiName] = { inventoryKey, count };
  }

  return result;
}

/**
 * Identify material tier from name
 * Returns 1-4 for gems, 1-3 for books/common mats
 */
export function identifyMaterialTier(name: string): number | undefined {
  const lower = name.toLowerCase();

  // Gem tiers
  if (lower.includes('sliver')) return 1;
  if (lower.includes('fragment')) return 2;
  if (lower.includes('chunk')) return 3;
  if (lower.includes('gemstone')) return 4;

  // Book tiers
  if (lower.includes('teachings')) return 1;
  if (lower.includes('guide')) return 2;
  if (lower.includes('philosophies')) return 3;

  // Common material patterns (tier 1 = basic, tier 3 = enhanced)
  if (lower.includes('damaged') || lower.includes('divining') || lower.includes('mask') && !lower.includes('stained')) return 1;
  if (lower.includes('stained') || lower.includes('sealed') || lower.includes('shimmering')) return 2;
  if (lower.includes('ominous') || lower.includes('golden') || lower.includes('energy')) return 3;

  return undefined;
}

/**
 * Extract base material name (without tier prefix/suffix)
 */
export function getBaseMaterialName(name: string): string {
  // Remove tier prefixes
  const tierPrefixes = ['Teachings of', 'Guide to', 'Philosophies of'];
  for (const prefix of tierPrefixes) {
    if (name.startsWith(prefix)) {
      return name.replace(prefix, '').trim();
    }
  }

  // Remove tier suffixes
  const tierSuffixes = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'];
  for (const suffix of tierSuffixes) {
    if (name.endsWith(suffix)) {
      return name.replace(suffix, '').trim();
    }
  }

  return name;
}

/**
 * Build a display-friendly material name with context
 */
export function formatMaterialDisplay(
  name: string,
  tier?: number,
  source?: string,
  availability?: string[]
): string {
  let display = name;

  if (tier) {
    display += ` (Tier ${tier})`;
  }

  if (availability && availability.length > 0) {
    display += ` • ${availability.join('/')}`;
  } else if (source) {
    display += ` • ${source}`;
  }

  return display;
}
