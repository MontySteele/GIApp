/**
 * Irminsul Import Mapper
 *
 * Irminsul exports in GOOD format v3 with additional fields.
 * This mapper handles the full import including:
 * - Characters (with reconciliation against existing data)
 * - Artifacts (standalone inventory)
 * - Weapons (standalone inventory)
 * - Materials (counts)
 */

import type {
  Character,
  InventoryArtifact,
  InventoryWeapon,
  SlotKey,
  ExtendedSubstat,
} from '@/types';
import { getAvatarIdFromKey } from '@/lib/gameData';

// ============================================
// Irminsul Format Types (extends GOOD v3)
// ============================================

export interface IrminsulFormat {
  format: 'GOOD';
  version: number;
  source: string; // 'Irminsul'
  characters?: IrminsulCharacter[];
  artifacts?: IrminsulArtifact[];
  weapons?: IrminsulWeapon[];
  materials?: Record<string, number>;
}

export interface IrminsulCharacter {
  key: string;
  level: number;
  constellation: number;
  ascension: number;
  talent: {
    auto: number;
    skill: number;
    burst: number;
  };
}

export interface IrminsulArtifact {
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  location: string; // Character key or empty string
  lock: boolean;
  substats: IrminsulSubstat[];
  // Irminsul-specific fields
  totalRolls?: number;
  astralMark?: boolean;
  elixerCrafted?: boolean;
  unactivatedSubstats?: unknown[];
}

export interface IrminsulSubstat {
  key: string;
  value: number;
  initialValue?: number;
}

export interface IrminsulWeapon {
  key: string;
  level: number;
  ascension: number;
  refinement: number;
  location: string; // Character key or empty string
  lock: boolean;
}

// ============================================
// Import Result Types
// ============================================

export interface IrminsulImportResult {
  characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[];
  // Include id for deterministic deduplication
  artifacts: Omit<InventoryArtifact, 'createdAt' | 'updatedAt'>[];
  weapons: Omit<InventoryWeapon, 'createdAt' | 'updatedAt'>[];
  materials: Record<string, number>;
  stats: {
    characterCount: number;
    artifactCount: number;
    weaponCount: number;
    materialCount: number;
  };
}

// ============================================
// Validation
// ============================================

export function validateIrminsulFormat(data: unknown): data is IrminsulFormat {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (obj.format !== 'GOOD') {
    return false;
  }

  if (typeof obj.version !== 'number') {
    return false;
  }

  // Validate characters array if present
  if (obj.characters !== undefined) {
    if (!Array.isArray(obj.characters)) {
      return false;
    }
    for (const char of obj.characters) {
      if (!isValidCharacter(char)) {
        return false;
      }
    }
  }

  // Validate artifacts array if present
  if (obj.artifacts !== undefined) {
    if (!Array.isArray(obj.artifacts)) {
      return false;
    }
    for (const artifact of obj.artifacts) {
      if (!isValidArtifact(artifact)) {
        return false;
      }
    }
  }

  // Validate weapons array if present
  if (obj.weapons !== undefined) {
    if (!Array.isArray(obj.weapons)) {
      return false;
    }
    for (const weapon of obj.weapons) {
      if (!isValidWeapon(weapon)) {
        return false;
      }
    }
  }

  // Validate materials object if present
  if (obj.materials !== undefined) {
    if (typeof obj.materials !== 'object' || obj.materials === null) {
      return false;
    }
  }

  return true;
}

function isValidCharacter(char: unknown): char is IrminsulCharacter {
  if (typeof char !== 'object' || char === null) {
    return false;
  }

  const c = char as Record<string, unknown>;
  return (
    typeof c.key === 'string' &&
    typeof c.level === 'number' &&
    typeof c.constellation === 'number' &&
    typeof c.ascension === 'number' &&
    typeof c.talent === 'object' &&
    c.talent !== null &&
    typeof (c.talent as Record<string, unknown>).auto === 'number' &&
    typeof (c.talent as Record<string, unknown>).skill === 'number' &&
    typeof (c.talent as Record<string, unknown>).burst === 'number'
  );
}

function isValidArtifact(artifact: unknown): artifact is IrminsulArtifact {
  if (typeof artifact !== 'object' || artifact === null) {
    return false;
  }

  const a = artifact as Record<string, unknown>;
  return (
    typeof a.setKey === 'string' &&
    typeof a.slotKey === 'string' &&
    typeof a.level === 'number' &&
    typeof a.rarity === 'number' &&
    typeof a.mainStatKey === 'string' &&
    typeof a.location === 'string' &&
    typeof a.lock === 'boolean' &&
    Array.isArray(a.substats)
  );
}

function isValidWeapon(weapon: unknown): weapon is IrminsulWeapon {
  if (typeof weapon !== 'object' || weapon === null) {
    return false;
  }

  const w = weapon as Record<string, unknown>;
  return (
    typeof w.key === 'string' &&
    typeof w.level === 'number' &&
    typeof w.ascension === 'number' &&
    typeof w.refinement === 'number' &&
    typeof w.location === 'string' &&
    typeof w.lock === 'boolean'
  );
}

// ============================================
// Conversion Functions
// ============================================

/**
 * Generate a deterministic ID for an artifact based on its properties
 * This allows us to detect duplicates across imports
 */
function generateArtifactId(artifact: IrminsulArtifact): string {
  const substatsKey = artifact.substats
    .map((s) => `${s.key}:${s.value}`)
    .sort()
    .join('|');
  return `artifact:${artifact.setKey}:${artifact.slotKey}:${artifact.mainStatKey}:${artifact.rarity}:${artifact.level}:${substatsKey}`;
}

/**
 * Generate a deterministic ID for a weapon based on its properties
 * Note: Multiple identical weapons can exist, so we include location
 */
function generateWeaponId(weapon: IrminsulWeapon, index: number): string {
  return `weapon:${weapon.key}:${weapon.level}:${weapon.refinement}:${weapon.location || 'unequipped'}:${index}`;
}

/**
 * Convert Irminsul format to internal format for import
 */
export function fromIrminsul(data: IrminsulFormat): IrminsulImportResult {
  const characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const artifacts: Omit<InventoryArtifact, 'createdAt' | 'updatedAt'>[] = [];
  const weapons: Omit<InventoryWeapon, 'createdAt' | 'updatedAt'>[] = [];
  const materials: Record<string, number> = data.materials || {};

  // Process characters
  for (const char of data.characters || []) {
    // Find equipped weapon for this character
    const equippedWeapon = (data.weapons || []).find(
      (w) => w.location === char.key
    );

    // Find equipped artifacts for this character
    const equippedArtifacts = (data.artifacts || [])
      .filter((a) => a.location === char.key)
      .map((a) => ({
        setKey: a.setKey,
        slotKey: a.slotKey as SlotKey,
        level: a.level,
        rarity: a.rarity,
        mainStatKey: a.mainStatKey,
        substats: a.substats.map((s) => ({
          key: s.key,
          value: s.value,
        })),
      }));

    characters.push({
      key: char.key,
      level: char.level,
      ascension: char.ascension,
      constellation: char.constellation,
      talent: {
        auto: char.talent.auto,
        skill: char.talent.skill,
        burst: char.talent.burst,
      },
      weapon: equippedWeapon
        ? {
            key: equippedWeapon.key,
            level: equippedWeapon.level,
            ascension: equippedWeapon.ascension,
            refinement: equippedWeapon.refinement,
          }
        : {
            key: 'DullBlade',
            level: 1,
            ascension: 0,
            refinement: 1,
          },
      artifacts: equippedArtifacts,
      notes: '',
      priority: 'unbuilt',
      teamIds: [],
      avatarId: getAvatarIdFromKey(char.key),
    });
  }

  // Process all artifacts (including unequipped)
  for (const artifact of data.artifacts || []) {
    const substats: ExtendedSubstat[] = artifact.substats.map((s) => ({
      key: s.key,
      value: s.value,
      initialValue: s.initialValue,
    }));

    artifacts.push({
      id: generateArtifactId(artifact),
      setKey: artifact.setKey,
      slotKey: artifact.slotKey as SlotKey,
      level: artifact.level,
      rarity: artifact.rarity,
      mainStatKey: artifact.mainStatKey,
      substats,
      location: artifact.location || '',
      lock: artifact.lock,
      totalRolls: artifact.totalRolls,
      astralMark: artifact.astralMark,
      elixerCrafted: artifact.elixerCrafted,
    });
  }

  // Process all weapons (including unequipped)
  (data.weapons || []).forEach((weapon, index) => {
    weapons.push({
      id: generateWeaponId(weapon, index),
      key: weapon.key,
      level: weapon.level,
      ascension: weapon.ascension,
      refinement: weapon.refinement,
      location: weapon.location || '',
      lock: weapon.lock,
    });
  });

  return {
    characters,
    artifacts,
    weapons,
    materials,
    stats: {
      characterCount: characters.length,
      artifactCount: artifacts.length,
      weaponCount: weapons.length,
      materialCount: Object.keys(materials).length,
    },
  };
}

/**
 * Merge imported character with existing character
 * Prioritizes newer (imported) data for stats, but preserves local metadata
 */
export function mergeCharacter(
  existing: Character,
  imported: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
): Partial<Character> {
  return {
    // Update game stats from import
    level: imported.level,
    ascension: imported.ascension,
    constellation: imported.constellation,
    talent: imported.talent,
    weapon: imported.weapon,
    artifacts: imported.artifacts,
    // Preserve local metadata
    notes: existing.notes,
    priority: existing.priority,
    teamIds: existing.teamIds,
    avatarId: existing.avatarId,
  };
}
