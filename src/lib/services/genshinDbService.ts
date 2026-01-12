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
const CACHE_SCHEMA_VERSION = 2; // Increment when cache structure changes

/**
 * Known local specialties (region-specific gathering items)
 * Used to distinguish from common enemy materials
 */
const LOCAL_SPECIALTIES = new Set([
  // Mondstadt
  'Calla Lily', 'Cecilia', 'Dandelion Seed', 'Philanemo Mushroom',
  'Small Lamp Grass', 'Valberry', 'Windwheel Aster', 'Wolfhook',
  // Liyue
  'Cor Lapis', 'Glaze Lily', 'Jueyun Chili', 'Noctilucous Jade',
  'Qingxin', 'Silk Flower', 'Starconch', 'Violetgrass',
  // Inazuma
  'Amakumo Fruit', 'Crystal Marrow', 'Dendrobium', 'Fluorescent Fungus',
  'Naku Weed', 'Onikabuto', 'Sakura Bloom', 'Sango Pearl', 'Sea Ganoderma',
  // Sumeru
  'Henna Berry', 'Kalpalata Lotus', 'Nilotpala Lotus', 'Padisarah',
  'Rukkhashava Mushrooms', 'Sand Grease Pupa', 'Scarab', 'Sumeru Rose',
  // Fontaine
  'Beryl Conch', 'Lumidouce Bell', 'Lakelight Lily', 'Rainbow Rose',
  'Romaritime Flower', 'Spring of the First Dewdrop', 'Lumitoile', 'Subdetection Unit',
  // Natlan
  'Brilliant Chrysanthemum', 'Quenepa Berry', 'Saurian Claw Succulent', 'Talisman of the Warrior\'s Spirit',
  'Glowing Hornshroom', 'Withering Purpurbloom', 'Smoking Sunfire Saurian Eye', 'Sacred Chalice\'s Dew',
]);

/**
 * Common material tier identification patterns
 */
const COMMON_TIER_PATTERNS = {
  // Tier 1 (Gray/White) patterns
  tier1: [
    'Slime Condensate', 'Damaged Mask', 'Divining Scroll', 'Firm Arrowhead',
    'Whopperflower Nectar', 'Recruit\'s Insignia', 'Treasure Hoarder Insignia',
    'Fragile Bone Shard', 'Mist Grass Pollen', 'Hunter\'s Sacrificial Knife',
    'Chaos Device', 'Spectral Husk', 'Fungal Spores', 'Old Handguard',
    'Gloomy Statuette', 'Dismal Prism', 'Heavy Horn', 'Dead Ley Line Branch',
    'Faded Red Satin', 'Transoceanic Pearl', 'Juvenile Fang', 'A Flower Yet to Bloom',
    'Shard of a Shattered Will', 'Old Operative\'s Pocket Watch', 'Feathery Fin',
    'Ruined Hilt', 'Axis of the Secret Source',
  ],
  // Tier 2 (Green) patterns
  tier2: [
    'Slime Secretions', 'Stained Mask', 'Sealed Scroll', 'Sharp Arrowhead',
    'Shimmering Nectar', 'Sergeant\'s Insignia', 'Silver Raven Insignia',
    'Sturdy Bone Shard', 'Mist Grass', 'Agent\'s Sacrificial Knife',
    'Chaos Circuit', 'Spectral Heart', 'Luminescent Pollen', 'Kageuchi Handguard',
    'Dark Statuette', 'Crystal Prism', 'Black Bronze Horn', 'Dead Ley Line Leaves',
    'Trimmed Red Silk', 'Transoceanic Chunk', 'Seasoned Fang', 'Budding Greenery',
    'Shard of a Foul Legacy', 'Operative\'s Standard Pocket Watch', 'Lunar Fin',
    'Splintered Hilt', 'Sheath of the Secret Source',
  ],
  // Tier 3 (Blue) patterns
  tier3: [
    'Slime Concentrate', 'Ominous Mask', 'Forbidden Curse Scroll', 'Weathered Arrowhead',
    'Energy Nectar', 'Lieutenant\'s Insignia', 'Golden Raven Insignia',
    'Fossilized Bone Shard', 'Mist Grass Wick', 'Inspector\'s Sacrificial Knife',
    'Chaos Core', 'Spectral Nucleus', 'Crystalline Cyst Dust', 'Famed Handguard',
    'Deathly Statuette', 'Polarizing Prism', 'Black Crystal Horn', 'Ley Line Sprout',
    'Rich Red Brocade', 'Xenochromatic Crystal', 'Tyrant\'s Fang', 'Wilting Glory',
    'Shard of a Conquered Will', 'Operative\'s Constancy', 'Chasmlight Fin',
    'Still-Smoldering Hilt', 'Heart of the Secret Source',
  ],
};

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
  // Try to find base name by matching against tier patterns
  // Tier 1 materials often ARE the base name (e.g., "Slime Condensate" -> "Slime")
  // Tier 2/3 have prefixes like "Stained", "Ominous", etc.

  // Common tier prefixes to remove
  const prefixes = [
    'Damaged ', 'Stained ', 'Ominous ',
    'Divining ', 'Sealed ', 'Forbidden Curse ',
    'Firm ', 'Sharp ', 'Weathered ',
    'Whopperflower ', 'Shimmering ', 'Energy ',
    'Recruit\'s ', 'Sergeant\'s ', 'Lieutenant\'s ',
    'Treasure Hoarder ', 'Silver Raven ', 'Golden Raven ',
    'Fragile ', 'Sturdy ', 'Fossilized ',
    'Hunter\'s ', 'Agent\'s ', 'Inspector\'s ',
    'Old ', 'Kageuchi ', 'Famed ',
    'Gloomy ', 'Dark ', 'Deathly ',
    'Dismal ', 'Crystal ', 'Polarizing ',
    'Heavy ', 'Black Bronze ', 'Black Crystal ',
    'Dead Ley Line ', 'Ley Line ',
    'Faded Red ', 'Trimmed Red ', 'Rich Red ',
    'Juvenile ', 'Seasoned ', 'Tyrant\'s ',
  ];

  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return name.replace(prefix, '').trim();
    }
  }

  // For materials like "Slime Condensate/Secretions/Concentrate", extract the family name
  if (name.includes('Slime')) return 'Slime';
  if (name.includes('Nectar')) return 'Nectar';
  if (name.includes('Insignia')) return 'Insignia';
  if (name.includes('Bone Shard')) return 'Bone Shard';
  if (name.includes('Mist Grass')) return 'Mist Grass';
  if (name.includes('Sacrificial Knife')) return 'Sacrificial Knife';
  if (name.includes('Chaos')) return 'Chaos';
  if (name.includes('Spectral')) return 'Spectral';
  if (name.includes('Handguard')) return 'Handguard';
  if (name.includes('Statuette')) return 'Statuette';
  if (name.includes('Prism')) return 'Prism';
  if (name.includes('Horn')) return 'Horn';

  return name;
}

/**
 * Check if material is a known local specialty
 */
function isLocalSpecialty(name: string): boolean {
  return LOCAL_SPECIALTIES.has(name);
}

/**
 * Identify common material tier (1=gray, 2=green, 3=blue)
 * Returns 0 if not a recognized common material
 */
function identifyCommonTier(name: string): 1 | 2 | 3 | 0 {
  // Exact match first
  if (COMMON_TIER_PATTERNS.tier1.includes(name)) return 1;
  if (COMMON_TIER_PATTERNS.tier2.includes(name)) return 2;
  if (COMMON_TIER_PATTERNS.tier3.includes(name)) return 3;

  // Partial match for flexibility
  for (const pattern of COMMON_TIER_PATTERNS.tier1) {
    if (name.includes(pattern) || pattern.includes(name)) return 1;
  }
  for (const pattern of COMMON_TIER_PATTERNS.tier2) {
    if (name.includes(pattern) || pattern.includes(name)) return 2;
  }
  for (const pattern of COMMON_TIER_PATTERNS.tier3) {
    if (name.includes(pattern) || pattern.includes(name)) return 3;
  }

  return 0;
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
        tierNames: { gray: '', green: '', blue: '' },
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
        tierNames: { gray: '', green: '', blue: '' },
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
      if (!ascension) continue;

      for (const item of ascension) {
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
        } else if (isLocalSpecialty(name)) {
          // Local specialty (known gathering items)
          materials.ascensionMaterials.localSpecialty.name = name;
          materials.ascensionMaterials.localSpecialty.totalCount += item.count;
        } else {
          // Check if it's a common material by tier
          const tier = identifyCommonTier(name);
          if (tier > 0) {
            materials.ascensionMaterials.common.name = name;
            materials.ascensionMaterials.common.baseName = getBaseCommonName(name);
            if (tier === 1) {
              materials.ascensionMaterials.common.tierNames.gray = name;
              materials.ascensionMaterials.common.byTier.gray += item.count;
            } else if (tier === 2) {
              materials.ascensionMaterials.common.tierNames.green = name;
              materials.ascensionMaterials.common.byTier.green += item.count;
            } else {
              materials.ascensionMaterials.common.tierNames.blue = name;
              materials.ascensionMaterials.common.byTier.blue += item.count;
            }
          } else {
            // Unknown material - assume boss drop if significant count, else local specialty
            // Boss drops typically have higher counts and unique names
            if (
              name.includes('Seed') ||
              name.includes('Core') ||
              name.includes('Orb') ||
              name.includes('Scale') ||
              name.includes('Claw') ||
              name.includes('Bone') ||
              name.includes('Cleansing') ||
              name.includes('Hurricane') ||
              name.includes('Lightning') ||
              name.includes('Basalt') ||
              name.includes('Hoarfrost') ||
              name.includes('Everflame') ||
              name.includes('Crystalline') ||
              name.includes('Juvenile Jade') ||
              name.includes('Smoldering') ||
              name.includes('Perpetual') ||
              name.includes('Runic') ||
              name.includes('Dew of Repudiation') ||
              name.includes('Storm Beads') ||
              name.includes('Dragonheir') ||
              name.includes('Riftborn') ||
              name.includes('Puppet Strings') ||
              name.includes('Quelled') ||
              name.includes('Thunderclap') ||
              name.includes('Artificed') ||
              name.includes('Fontemer') ||
              name.includes('Water That Failed') ||
              name.includes('Light Guiding') ||
              name.includes('Cloudseam') ||
              name.includes('Fragment of a') ||
              name.includes('Denial and Judgment') ||
              name.includes('Overripe') ||
              name.includes('Gold-Inscribed') ||
              name.includes('Mark of the Binding')
            ) {
              materials.ascensionMaterials.boss.name = name;
              materials.ascensionMaterials.boss.totalCount += item.count;
            } else {
              // Truly unknown - default to local specialty
              materials.ascensionMaterials.localSpecialty.name = name;
              materials.ascensionMaterials.localSpecialty.totalCount += item.count;
            }
          }
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
      if (!talent) continue;

      for (const item of talent) {
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
        } else if (name === 'Mora') {
          // Skip mora in talent materials (already tracked elsewhere)
          continue;
        } else {
          // Check if it's a common material by tier
          const tier = identifyCommonTier(name);
          if (tier > 0) {
            const baseName = getBaseCommonName(name);
            materials.talentMaterials.common.name = name;
            materials.talentMaterials.common.baseName = baseName;

            if (tier === 1) {
              materials.talentMaterials.common.tierNames.gray = name;
              materials.talentMaterials.common.byTier.gray += item.count;
            } else if (tier === 2) {
              materials.talentMaterials.common.tierNames.green = name;
              materials.talentMaterials.common.byTier.green += item.count;
            } else {
              materials.talentMaterials.common.tierNames.blue = name;
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
  }

  return materials;
}

/**
 * Cache entry structure with schema versioning
 */
interface CacheEntry {
  data: CharacterMaterialData;
  schemaVersion?: number;
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
  let cachedData: CharacterMaterialData | null = null;

  if (!options.forceRefresh) {
    try {
      const cached = await db.externalCache.get(cacheKey);
      if (cached) {
        const cacheEntry = cached.data as CacheEntry | CharacterMaterialData;
        const cacheExpiresAt = new Date(cached.expiresAt).getTime();

        // Detect cache format - new format has schemaVersion, old format is raw CharacterMaterialData
        const schemaVersion = 'schemaVersion' in cacheEntry ? cacheEntry.schemaVersion : 0;
        const materialData = 'schemaVersion' in cacheEntry ? cacheEntry.data : cacheEntry;

        // Cache is valid if not expired AND schema version matches
        const isSchemaValid = schemaVersion === CACHE_SCHEMA_VERSION;
        const isNotExpired = Date.now() < cacheExpiresAt;

        if (isNotExpired && isSchemaValid) {
          return {
            data: materialData,
            isStale: false,
          };
        }

        // Cache is stale (expired or old schema) - we'll try to refresh, but keep as fallback
        cachedData = materialData;
      }
    } catch (dbError) {
      console.warn('Failed to read from cache:', dbError);
      // Continue to API fetch even if cache read fails
    }
  }

  // Fetch from API
  try {
    const [characterData, talentData] = await Promise.all([
      fetchCharacterData(characterKey),
      fetchTalentData(characterKey),
    ]);

    const materials = processCharacterMaterials(characterKey, characterData, talentData);

    // Update cache (ignore errors - cache is optional)
    try {
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + CACHE_TTL).toISOString();
      // Store with schema version for cache invalidation on structure changes
      const cacheEntry: CacheEntry = {
        data: materials,
        schemaVersion: CACHE_SCHEMA_VERSION,
      };
      await db.externalCache.put({
        id: cacheKey,
        cacheKey,
        data: cacheEntry,
        fetchedAt: now,
        expiresAt,
      });
    } catch (cacheWriteError) {
      console.warn('Failed to write to cache:', cacheWriteError);
    }

    return { data: materials, isStale: false };
  } catch (error) {
    // If API fetch fails and we have cached data (even stale), use it
    if (options.useStaleOnError && cachedData) {
      return {
        data: cachedData,
        isStale: true,
        error: error instanceof Error ? error.message : 'Failed to fetch character data',
      };
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
