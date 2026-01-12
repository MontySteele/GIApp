/**
 * Genshin DB API Service
 *
 * Fetches character and talent data from genshin-db-api.vercel.app
 * with IndexedDB caching for offline support
 */

import { db } from '@/db/schema';
import type {
  CharacterMaterialData,
  GenshinDbCharacterResponse,
  GenshinDbTalentResponse,
} from '@/features/planner/domain/characterMaterials';
import { DOMAIN_SCHEDULE } from '@/features/planner/domain/materialConstants';

const API_BASE_URL = 'https://genshin-db-api.vercel.app/api/v5';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const API_VERSION = 'v5';

/**
 * Cache key generator
 */
function getCacheKey(characterKey: string): string {
  return `genshin-character:${characterKey.toLowerCase()}`;
}

/**
 * Fetch character data from API
 */
async function fetchCharacterData(characterKey: string): Promise<GenshinDbCharacterResponse> {
  const url = `${API_BASE_URL}/characters?query=${encodeURIComponent(characterKey)}&matchCategories=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch character data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch talent data from API
 */
async function fetchTalentData(characterKey: string): Promise<GenshinDbTalentResponse> {
  const url = `${API_BASE_URL}/talents?query=${encodeURIComponent(characterKey)}&matchCategories=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch talent data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Identify gem type from material name
 */
function identifyGemType(name: string): string {
  const gemMap: Record<string, string> = {
    'Agnidus Agate': 'Pyro',
    'Varunada Lazurite': 'Hydro',
    'Vayuda Turquoise': 'Anemo',
    'Vajrada Amethyst': 'Electro',
    'Nagadus Emerald': 'Dendro',
    'Shivada Jade': 'Cryo',
    'Prithiva Topaz': 'Geo',
  };

  for (const [gem, element] of Object.entries(gemMap)) {
    if (name.includes(gem)) {
      return element;
    }
  }

  return 'Unknown';
}

/**
 * Get base gem name (without tier suffix)
 */
function getBaseGemName(name: string): string {
  const suffixes = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'];
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      return name.replace(suffix, '').trim();
    }
  }
  return name;
}

/**
 * Identify talent book series and get domain schedule
 */
function identifyTalentBookSeries(name: string): {
  series: string;
  region: string;
  days: string[];
} {
  const prefixes = ['Teachings of', 'Guide to', 'Philosophies of'];
  let bookName = name;

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      bookName = name.replace(prefix, '').trim();
      break;
    }
  }

  // Look up in domain schedule
  const days = DOMAIN_SCHEDULE[bookName] ?? [];

  // Identify region
  const regionMap: Record<string, string[]> = {
    Mondstadt: ['Freedom', 'Resistance', 'Ballad'],
    Liyue: ['Prosperity', 'Diligence', 'Gold'],
    Inazuma: ['Transience', 'Elegance', 'Light'],
    Sumeru: ['Admonition', 'Ingenuity', 'Praxis'],
    Fontaine: ['Equity', 'Justice', 'Order'],
    Natlan: ['Contention', 'Kindling', 'Conflict'],
  };

  let region = 'Unknown';
  for (const [reg, books] of Object.entries(regionMap)) {
    if (books.includes(bookName)) {
      region = reg;
      break;
    }
  }

  return { series: bookName, region, days };
}

/**
 * Get base common material name (without tier prefix/suffix)
 */
function getBaseCommonName(name: string): string {
  // Common patterns to remove
  const patterns = [
    'Damaged ', 'Stained ', 'Ominous ',
    'Divining ', 'Sealed ', 'Golden ',
    'Whopperflower ',
  ];

  for (const pattern of patterns) {
    if (name.includes(pattern)) {
      return name.replace(pattern, '').trim();
    }
  }

  return name;
}

/**
 * Process raw API responses into structured material data
 */
function processCharacterMaterials(
  characterKey: string,
  characterData: GenshinDbCharacterResponse,
  talentData: GenshinDbTalentResponse
): CharacterMaterialData {
  const materials: CharacterMaterialData = {
    characterKey,
    element: characterData.element || 'Unknown',
    ascensionMaterials: {
      gem: {
        name: '',
        baseName: '',
        element: '',
        byTier: { sliver: 0, fragment: 0, chunk: 0, gemstone: 0 },
      },
      boss: { name: '', totalCount: 0 },
      localSpecialty: { name: '', totalCount: 0 },
      common: {
        name: '',
        baseName: '',
        byTier: { gray: 0, green: 0, blue: 0 },
      },
    },
    talentMaterials: {
      books: {
        name: '',
        series: '',
        region: '',
        days: [],
        byTier: { teachings: 0, guide: 0, philosophies: 0 },
      },
      common: {
        name: '',
        baseName: '',
        byTier: { gray: 0, green: 0, blue: 0 },
      },
      weekly: { name: '', totalCount: 0 },
      crown: { name: 'Crown of Insight', totalCount: 0 },
    },
    fetchedAt: Date.now(),
    apiVersion: API_VERSION,
  };

  // Process ascension materials
  if (characterData.costs) {
    const ascensions = [
      characterData.costs.ascend1,
      characterData.costs.ascend2,
      characterData.costs.ascend3,
      characterData.costs.ascend4,
      characterData.costs.ascend5,
      characterData.costs.ascend6,
    ];

    for (const ascension of ascensions) {
      if (!ascension?.items) continue;

      for (const item of ascension.items) {
        const name = item.name;

        // Identify material type
        if (name.includes('Sliver')) {
          materials.ascensionMaterials.gem.name = name;
          materials.ascensionMaterials.gem.baseName = getBaseGemName(name);
          materials.ascensionMaterials.gem.element = identifyGemType(name);
          materials.ascensionMaterials.gem.byTier.sliver += item.count;
        } else if (name.includes('Fragment')) {
          materials.ascensionMaterials.gem.name = getBaseGemName(name);
          materials.ascensionMaterials.gem.baseName = getBaseGemName(name);
          materials.ascensionMaterials.gem.element = identifyGemType(name);
          materials.ascensionMaterials.gem.byTier.fragment += item.count;
        } else if (name.includes('Chunk')) {
          materials.ascensionMaterials.gem.name = getBaseGemName(name);
          materials.ascensionMaterials.gem.baseName = getBaseGemName(name);
          materials.ascensionMaterials.gem.element = identifyGemType(name);
          materials.ascensionMaterials.gem.byTier.chunk += item.count;
        } else if (name.includes('Gemstone')) {
          materials.ascensionMaterials.gem.name = getBaseGemName(name);
          materials.ascensionMaterials.gem.baseName = getBaseGemName(name);
          materials.ascensionMaterials.gem.element = identifyGemType(name);
          materials.ascensionMaterials.gem.byTier.gemstone += item.count;
        } else if (
          // Boss materials (common patterns)
          name.includes('Orb') ||
          name.includes('Heart') ||
          name.includes('Horn') ||
          name.includes('Scale') ||
          name.includes('Prism') ||
          name.includes('Jewel') ||
          name.includes('Magatama') ||
          name.includes('Pearl') ||
          name.includes('Dew') ||
          name.includes('Light') ||
          name.includes('Rift')
        ) {
          materials.ascensionMaterials.boss.name = name;
          materials.ascensionMaterials.boss.totalCount += item.count;
        } else if (
          // Common enemy materials (tier 1 - gray)
          name.includes('Damaged') ||
          name.includes('Divining') ||
          (name.includes('Mask') && !name.includes('Stained')) ||
          (name.includes('Scroll') && !name.includes('Sealed')) ||
          (name.includes('Nectar') && !name.includes('Shimmering'))
        ) {
          materials.ascensionMaterials.common.name = name;
          materials.ascensionMaterials.common.baseName = getBaseCommonName(name);
          materials.ascensionMaterials.common.byTier.gray += item.count;
        } else if (
          // Common enemy materials (tier 2 - green)
          name.includes('Stained') ||
          name.includes('Sealed') ||
          name.includes('Shimmering')
        ) {
          materials.ascensionMaterials.common.name = getBaseCommonName(name);
          materials.ascensionMaterials.common.baseName = getBaseCommonName(name);
          materials.ascensionMaterials.common.byTier.green += item.count;
        } else if (
          // Common enemy materials (tier 3 - blue)
          name.includes('Ominous') ||
          name.includes('Golden') ||
          name.includes('Energy')
        ) {
          materials.ascensionMaterials.common.name = getBaseCommonName(name);
          materials.ascensionMaterials.common.baseName = getBaseCommonName(name);
          materials.ascensionMaterials.common.byTier.blue += item.count;
        } else {
          // Assume local specialty if not matched
          materials.ascensionMaterials.localSpecialty.name = name;
          materials.ascensionMaterials.localSpecialty.totalCount += item.count;
        }
      }
    }
  }

  // Process talent materials
  if (talentData.costs) {
    const talents = [
      talentData.costs.lvl2,
      talentData.costs.lvl3,
      talentData.costs.lvl4,
      talentData.costs.lvl5,
      talentData.costs.lvl6,
      talentData.costs.lvl7,
      talentData.costs.lvl8,
      talentData.costs.lvl9,
      talentData.costs.lvl10,
    ];

    for (const talent of talents) {
      if (!talent?.items) continue;

      for (const item of talent.items) {
        const name = item.name;

        // Identify talent material type
        if (name.startsWith('Teachings of')) {
          const bookInfo = identifyTalentBookSeries(name);
          materials.talentMaterials.books.name = bookInfo.series;
          materials.talentMaterials.books.series = bookInfo.series;
          materials.talentMaterials.books.region = bookInfo.region;
          materials.talentMaterials.books.days = bookInfo.days;
          materials.talentMaterials.books.byTier.teachings += item.count;
        } else if (name.startsWith('Guide to')) {
          const bookInfo = identifyTalentBookSeries(name);
          materials.talentMaterials.books.name = bookInfo.series;
          materials.talentMaterials.books.series = bookInfo.series;
          materials.talentMaterials.books.region = bookInfo.region;
          materials.talentMaterials.books.days = bookInfo.days;
          materials.talentMaterials.books.byTier.guide += item.count;
        } else if (name.startsWith('Philosophies of')) {
          const bookInfo = identifyTalentBookSeries(name);
          materials.talentMaterials.books.name = bookInfo.series;
          materials.talentMaterials.books.series = bookInfo.series;
          materials.talentMaterials.books.region = bookInfo.region;
          materials.talentMaterials.books.days = bookInfo.days;
          materials.talentMaterials.books.byTier.philosophies += item.count;
        } else if (name === 'Crown of Insight') {
          materials.talentMaterials.crown.name = name;
          materials.talentMaterials.crown.totalCount += item.count;
        } else if (
          // Common enemy materials (same as ascension)
          name.includes('Damaged') ||
          name.includes('Divining') ||
          name.includes('Mask') ||
          name.includes('Scroll') ||
          name.includes('Nectar') ||
          name.includes('Arrowhead') ||
          name.includes('Insignia')
        ) {
          const baseName = getBaseCommonName(name);
          materials.talentMaterials.common.baseName = baseName;

          if (name.includes('Damaged') || name.includes('Divining') || (!name.includes('Stained') && !name.includes('Ominous'))) {
            materials.talentMaterials.common.name = name;
            materials.talentMaterials.common.byTier.gray += item.count;
          } else if (name.includes('Stained') || name.includes('Sealed') || name.includes('Shimmering')) {
            materials.talentMaterials.common.name = baseName;
            materials.talentMaterials.common.byTier.green += item.count;
          } else if (name.includes('Ominous') || name.includes('Golden') || name.includes('Energy')) {
            materials.talentMaterials.common.name = baseName;
            materials.talentMaterials.common.byTier.blue += item.count;
          }
        } else {
          // Assume weekly boss material
          materials.talentMaterials.weekly.name = name;
          materials.talentMaterials.weekly.totalCount += item.count;
        }
      }
    }
  }

  return materials;
}

/**
 * Get character materials from cache or API
 */
export async function getCharacterMaterials(
  characterKey: string,
  options: { forceRefresh?: boolean; useStaleOnError?: boolean } = {}
): Promise<{ data: CharacterMaterialData | null; isStale: boolean; error?: string }> {
  const cacheKey = getCacheKey(characterKey);

  // Check cache first (unless force refresh)
  if (!options.forceRefresh) {
    const cached = await db.externalCache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      const expiresAt = new Date(cached.expiresAt).getTime();

      // Return fresh cache data
      if (now < expiresAt) {
        return {
          data: cached.data as CharacterMaterialData,
          isStale: false,
        };
      }

      // Cache is stale - we'll try to refresh, but keep as fallback
    }
  }

  // Fetch from API
  try {
    const [characterData, talentData] = await Promise.all([
      fetchCharacterData(characterKey),
      fetchTalentData(characterKey),
    ]);

    const materials = processCharacterMaterials(characterKey, characterData, talentData);

    // Update cache
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
    await db.externalCache.put({
      id: cacheKey,
      cacheKey,
      data: materials,
      fetchedAt: now,
      expiresAt,
    });

    return { data: materials, isStale: false };
  } catch (error) {
    // If API fetch fails and we have stale cache, use it
    if (options.useStaleOnError) {
      const cached = await db.externalCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data as CharacterMaterialData,
          isStale: true,
          error: error instanceof Error ? error.message : 'Failed to fetch character data',
        };
      }
    }

    // No cache available
    return {
      data: null,
      isStale: false,
      error: error instanceof Error ? error.message : 'Failed to fetch character data',
    };
  }
}

/**
 * Preload multiple characters (useful for initialization)
 */
export async function preloadCharacters(characterKeys: string[]): Promise<void> {
  const promises = characterKeys.map((key) =>
    getCharacterMaterials(key, { useStaleOnError: true })
  );

  await Promise.allSettled(promises);
}

/**
 * Clear character cache (for manual refresh)
 */
export async function clearCharacterCache(characterKey?: string): Promise<void> {
  if (characterKey) {
    const cacheKey = getCacheKey(characterKey);
    await db.externalCache.delete(cacheKey);
  } else {
    // Clear all character caches
    const allCaches = await db.externalCache.toArray();
    const characterCaches = allCaches.filter((cache) =>
      cache.cacheKey.startsWith('genshin-character:')
    );
    await Promise.all(characterCaches.map((cache) => db.externalCache.delete(cache.id)));
  }
}
