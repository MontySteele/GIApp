/**
 * Character Material Types
 *
 * Types for character-specific material requirements from genshin-db API
 */

export interface CharacterMaterialData {
  characterKey: string;
  element: string;
  ascensionMaterials: {
    gem: {
      name: string; // e.g., "Varunada Lazurite"
      baseName: string; // e.g., "Varunada Lazurite" (for all tiers)
      element: string; // e.g., "Hydro"
      byTier: {
        sliver: number; // Tier 1
        fragment: number; // Tier 2
        chunk: number; // Tier 3
        gemstone: number; // Tier 4
      };
    };
    boss: {
      name: string; // e.g., "Water Orb of the Font of All Waters"
      totalCount: number;
      source?: string; // e.g., "Hydro Tulpa"
    };
    localSpecialty: {
      name: string; // e.g., "Lakelight Lily"
      totalCount: number;
      region?: string; // e.g., "Fontaine"
    };
    common: {
      name: string; // e.g., "Whopperflower Nectar"
      baseName: string; // e.g., "Whopperflower Nectar" (for all tiers)
      byTier: {
        gray: number; // Tier 1
        green: number; // Tier 2
        blue: number; // Tier 3
      };
    };
  };
  talentMaterials: {
    books: {
      name: string; // e.g., "Justice"
      series: string; // e.g., "Justice" (base name)
      region: string; // e.g., "Fontaine"
      domain?: string; // e.g., "Pale Forgotten Glory"
      days: string[]; // e.g., ["Tuesday", "Friday", "Sunday"]
      byTier: {
        teachings: number; // Tier 1
        guide: number; // Tier 2
        philosophies: number; // Tier 3
      };
    };
    common: {
      name: string; // Same as ascension common mats
      baseName: string;
      byTier: {
        gray: number;
        green: number;
        blue: number;
      };
    };
    weekly: {
      name: string; // e.g., "Lightless Silk String"
      totalCount: number;
      boss?: string; // e.g., "All-Devouring Narwhal"
    };
    crown: {
      name: string; // "Crown of Insight"
      totalCount: number;
    };
  };
  // Metadata
  fetchedAt: number; // Timestamp
  apiVersion: string; // API version used
}

/**
 * Normalized material requirement for display
 */
export interface NormalizedMaterial {
  key: string; // Normalized inventory key
  apiName: string; // Original API name
  displayName: string; // User-friendly display name
  category: 'mora' | 'exp' | 'boss' | 'gem' | 'localSpecialty' | 'common' | 'talent' | 'weekly' | 'crown';
  tier?: number; // For tiered materials (1-4)
  required: number;
  owned: number;
  deficit: number;
  source?: string; // Domain, boss, or region info
  availability?: string[]; // Days available (for talent books)
}

/**
 * Raw API response types (simplified)
 * Note: genshin-db-api returns ascend/lvl as direct arrays, not {cost, items} objects
 */

export type MaterialItem = { id: number; name: string; count: number };

export interface GenshinDbCharacterResponse {
  name: string;
  element: string;
  costs?: {
    ascend1?: MaterialItem[];
    ascend2?: MaterialItem[];
    ascend3?: MaterialItem[];
    ascend4?: MaterialItem[];
    ascend5?: MaterialItem[];
    ascend6?: MaterialItem[];
  };
}

export interface GenshinDbTalentResponse {
  name: string;
  combat1?: {
    name: string;
    info: string;
    attributes?: {
      labels?: string[];
      parameters?: Record<string, number[]>;
    };
  };
  combat2?: {
    name: string;
    info: string;
  };
  combat3?: {
    name: string;
    info: string;
  };
  costs?: {
    lvl2?: MaterialItem[];
    lvl3?: MaterialItem[];
    lvl4?: MaterialItem[];
    lvl5?: MaterialItem[];
    lvl6?: MaterialItem[];
    lvl7?: MaterialItem[];
    lvl8?: MaterialItem[];
    lvl9?: MaterialItem[];
    lvl10?: MaterialItem[];
  };
}

/**
 * Material category identification helpers
 */

export const MATERIAL_CATEGORIES = {
  // Elemental gems by element
  GEMS: {
    Pyro: 'Agnidus Agate',
    Hydro: 'Varunada Lazurite',
    Anemo: 'Vayuda Turquoise',
    Electro: 'Vajrada Amethyst',
    Dendro: 'Nagadus Emerald',
    Cryo: 'Shivada Jade',
    Geo: 'Prithiva Topaz',
  },
  // Gem tier suffixes
  GEM_TIERS: {
    sliver: ['Sliver'],
    fragment: ['Fragment'],
    chunk: ['Chunk'],
    gemstone: ['Gemstone'],
  },
  // Talent book regions and series
  TALENT_BOOKS: {
    Mondstadt: ['Freedom', 'Resistance', 'Ballad'],
    Liyue: ['Prosperity', 'Diligence', 'Gold'],
    Inazuma: ['Transience', 'Elegance', 'Light'],
    Sumeru: ['Admonition', 'Ingenuity', 'Praxis'],
    Fontaine: ['Equity', 'Justice', 'Order'],
    Natlan: ['Contention', 'Kindling', 'Conflict'],
  },
  // Talent book tier prefixes
  BOOK_TIERS: {
    teachings: ['Teachings of'],
    guide: ['Guide to'],
    philosophies: ['Philosophies of'],
  },
  // Common material tier suffixes (various patterns)
  COMMON_TIERS: {
    gray: ['', 'Damaged', 'Divining', 'Whopperflower', 'Mask', 'Scroll', 'Arrowhead', 'Insignia'],
    green: ['Stained', 'Sealed', 'Shimmering', 'Mask', 'Scroll', 'Arrowhead', 'Insignia'],
    blue: ['Ominous', 'Golden', 'Energy', 'Mask', 'Scroll', 'Arrowhead', 'Insignia'],
  },
} as const;
