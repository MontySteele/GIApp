/**
 * Weapon Material Types
 *
 * Types for weapon-specific material requirements from genshin-db API
 */

export interface WeaponMaterialData {
  weaponKey: string;
  rarity: number;
  ascensionMaterials: {
    domain: {
      name: string; // e.g., "Luminous Sands from Guyun"
      series: string; // e.g., "Guyun"
      region: string; // e.g., "Liyue"
      domain?: string; // Domain name
      days: string[]; // e.g., ["Monday", "Thursday", "Sunday"]
      byTier: {
        green: number; // Tier 1
        blue: number; // Tier 2
        purple: number; // Tier 3
        gold: number; // Tier 4
      };
    };
    elite: {
      name: string; // e.g., "Hunter's Sacrificial Knife"
      baseName: string; // e.g., "Sacrificial Knife"
      byTier: {
        gray: number; // Tier 1
        green: number; // Tier 2
        blue: number; // Tier 3
      };
    };
    common: {
      name: string; // e.g., "Recruit's Insignia"
      baseName: string; // e.g., "Insignia"
      tierNames: {
        gray: string;
        green: string;
        blue: string;
      };
      byTier: {
        gray: number;
        green: number;
        blue: number;
      };
    };
  };
  // Metadata
  fetchedAt: number;
  apiVersion: string;
}

/**
 * Raw API response types for weapons
 */
export type WeaponMaterialItem = { id: number; name: string; count: number };

export interface GenshinDbWeaponResponse {
  name: string;
  rarity: number;
  weapontype: string;
  substat: string;
  costs?: {
    ascend1?: WeaponMaterialItem[];
    ascend2?: WeaponMaterialItem[];
    ascend3?: WeaponMaterialItem[];
    ascend4?: WeaponMaterialItem[];
    ascend5?: WeaponMaterialItem[];
    ascend6?: WeaponMaterialItem[];
  };
}

/**
 * Weapon domain schedule
 */
export const WEAPON_DOMAIN_SCHEDULE: Record<string, string[]> = {
  // Mondstadt
  'Decarabian': ['Monday', 'Thursday', 'Sunday'],
  'Boreal Wolf': ['Tuesday', 'Friday', 'Sunday'],
  'Dandelion Gladiator': ['Wednesday', 'Saturday', 'Sunday'],
  // Liyue
  'Guyun': ['Monday', 'Thursday', 'Sunday'],
  'Mist Veiled': ['Tuesday', 'Friday', 'Sunday'],
  'Aerosiderite': ['Wednesday', 'Saturday', 'Sunday'],
  // Inazuma
  'Distant Sea': ['Monday', 'Thursday', 'Sunday'],
  'Narukami': ['Tuesday', 'Friday', 'Sunday'],
  'Mask': ['Wednesday', 'Saturday', 'Sunday'],
  // Sumeru
  'Forest Dew': ['Monday', 'Thursday', 'Sunday'],
  'Oasis Garden': ['Tuesday', 'Friday', 'Sunday'],
  'Scorching Might': ['Wednesday', 'Saturday', 'Sunday'],
  // Fontaine
  'Dewdrop': ['Monday', 'Thursday', 'Sunday'],
  'Pristine Sea': ['Tuesday', 'Friday', 'Sunday'],
  'Ancient Chord': ['Wednesday', 'Saturday', 'Sunday'],
  // Natlan
  'Blazing Sacrificial': ['Monday', 'Thursday', 'Sunday'],
  'Night-Wind': ['Tuesday', 'Friday', 'Sunday'],
  'Sacred Brilliance': ['Wednesday', 'Saturday', 'Sunday'],
};
