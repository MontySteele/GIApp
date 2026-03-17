import type { Character, InventoryArtifact, InventoryWeapon, SlotKey } from '@/types';
import { toGoodArtifactSetKey, toGoodCharacterKey, toGoodStatKey, toGoodWeaponKey } from '@/lib/gameData';

const VALID_SLOT_KEYS: readonly SlotKey[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

/**
 * Safely converts a string to SlotKey with validation
 */
function toSlotKey(value: string): SlotKey {
  if (VALID_SLOT_KEYS.includes(value as SlotKey)) {
    return value as SlotKey;
  }
  return 'flower'; // Default fallback
}

// GOOD Format v2 Specification
// https://frzyc.github.io/genshin-optimizer/#/doc

export interface GOODFormat {
  format: 'GOOD';
  version: number;
  source: string;
  active?: string | null;
  targets?: GOODTarget[];
  characters?: GOODCharacter[];
  artifacts?: GOODArtifact[];
  weapons?: GOODWeapon[];
  materials?: Record<string, number>;
}

export interface GOODTarget {
  level: number;
  pos: [number, number];
  radius: number;
}

export interface GOODCharacter {
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

export interface GOODWeapon {
  key: string;
  level: number;
  ascension: number;
  refinement: number;
  location: string; // Character key
  lock: boolean;
}

export interface GOODArtifact {
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  location: string; // Character key
  lock: boolean;
  substats: Array<{
    key: string;
    value: number;
  }>;
}

const getMaxArtifactLevel = (rarity: number): number => {
  switch (rarity) {
    case 1:
      return 4;
    case 2:
      return 8;
    case 3:
      return 12;
    case 4:
      return 16;
    case 5:
    default:
      return 20;
  }
};

/**
 * Convert internal Character format to GOOD format
 */
export function toGOOD(characters: Character[]): GOODFormat {
  const goodCharacters: GOODCharacter[] = [];
  const goodWeapons: GOODWeapon[] = [];
  const goodArtifacts: GOODArtifact[] = [];

  for (const char of characters) {
    const characterKey = toGoodCharacterKey(char.key);

    // Add character
    goodCharacters.push({
      key: characterKey,
      level: char.level,
      constellation: char.constellation,
      ascension: char.ascension,
      talent: {
        auto: char.talent.auto,
        skill: char.talent.skill,
        burst: char.talent.burst,
      },
    });

    // Add weapon
    goodWeapons.push({
      key: toGoodWeaponKey(char.weapon.key),
      level: char.weapon.level,
      ascension: char.weapon.ascension,
      refinement: char.weapon.refinement,
      location: characterKey,
      lock: true,
    });

    // Add artifacts
    for (const artifact of char.artifacts) {
      const maxLevel = getMaxArtifactLevel(artifact.rarity);
      goodArtifacts.push({
        setKey: toGoodArtifactSetKey(artifact.setKey),
        slotKey: artifact.slotKey,
        level: Math.min(artifact.level, maxLevel),
        rarity: artifact.rarity,
        mainStatKey: toGoodStatKey(artifact.mainStatKey),
        location: characterKey,
        lock: true,
        substats: artifact.substats.map((substat) => ({
          key: toGoodStatKey(substat.key),
          value: substat.value,
        })),
      });
    }
  }

  const active = goodCharacters[0]?.key;
  const targets: GOODTarget[] =
    goodCharacters.length > 0
      ? [
          {
            level: 1,
            pos: [0, 0],
            radius: 1,
          },
        ]
      : [];

  return {
    format: 'GOOD',
    version: 2,
    source: 'Genshin Progress Tracker',
    ...(active ? { active } : {}),
    targets,
    characters: goodCharacters,
    weapons: goodWeapons,
    artifacts: goodArtifacts,
  };
}

/**
 * Convert GOOD format to internal Character format
 */
export function fromGOOD(good: GOODFormat): Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (good.format !== 'GOOD') {
    throw new Error('Invalid format: expected GOOD format');
  }

  const characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const goodCharacters = good.characters || [];
  const goodWeapons = good.weapons || [];
  const goodArtifacts = good.artifacts || [];

  for (const goodChar of goodCharacters) {
    // Find weapon for this character
    const weapon = goodWeapons.find((w) => w.location === goodChar.key);
    if (!weapon) {
      console.warn(`No weapon found for character ${goodChar.key}, skipping`);
      continue;
    }

    // Find artifacts for this character
    const artifacts = goodArtifacts
      .filter((a) => a.location === goodChar.key)
      .map((a) => ({
        setKey: a.setKey,
        slotKey: toSlotKey(a.slotKey),
        level: a.level,
        rarity: a.rarity,
        mainStatKey: a.mainStatKey,
        substats: a.substats,
      }));

    characters.push({
      key: goodChar.key,
      level: goodChar.level,
      ascension: goodChar.ascension,
      constellation: goodChar.constellation,
      talent: {
        auto: goodChar.talent.auto,
        skill: goodChar.talent.skill,
        burst: goodChar.talent.burst,
      },
      weapon: {
        key: weapon.key,
        level: weapon.level,
        ascension: weapon.ascension,
        refinement: weapon.refinement,
      },
      artifacts,
      notes: '',
      priority: 'unbuilt',
      teamIds: [],
    });
  }

  return characters;
}

/**
 * Validate GOOD format JSON
 */
export function validateGOOD(data: unknown): data is GOODFormat {
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

  if (obj.active !== undefined && obj.active !== null && typeof obj.active !== 'string') {
    return false;
  }

  const isValidTarget = (target: unknown): target is GOODTarget => {
    if (typeof target !== 'object' || target === null) return false;
    const t = target as Record<string, unknown>;
    return (
      typeof t.level === 'number' &&
      Array.isArray(t.pos) &&
      t.pos.length === 2 &&
      t.pos.every((value: unknown) => typeof value === 'number') &&
      typeof t.radius === 'number'
    );
  };

  const isValidSubstat = (substat: unknown): substat is { key: string; value: number } => {
    if (typeof substat !== 'object' || substat === null) return false;
    const s = substat as Record<string, unknown>;
    return typeof s.key === 'string' && typeof s.value === 'number';
  };

  const isValidArtifact = (artifact: unknown): artifact is GOODArtifact => {
    if (typeof artifact !== 'object' || artifact === null) return false;
    const a = artifact as Record<string, unknown>;
    return (
      typeof a.setKey === 'string' &&
      typeof a.slotKey === 'string' &&
      typeof a.level === 'number' &&
      typeof a.rarity === 'number' &&
      typeof a.mainStatKey === 'string' &&
      typeof a.location === 'string' &&
      typeof a.lock === 'boolean' &&
      Array.isArray(a.substats) &&
      a.substats.every(isValidSubstat)
    );
  };

  const isValidWeapon = (weapon: unknown): weapon is GOODWeapon => {
    if (typeof weapon !== 'object' || weapon === null) return false;
    const w = weapon as Record<string, unknown>;
    return (
      typeof w.key === 'string' &&
      typeof w.level === 'number' &&
      typeof w.ascension === 'number' &&
      typeof w.refinement === 'number' &&
      typeof w.location === 'string' &&
      typeof w.lock === 'boolean'
    );
  };

  const isValidCharacter = (character: unknown): character is GOODCharacter => {
    if (typeof character !== 'object' || character === null) return false;
    const c = character as Record<string, unknown>;
    if (
      typeof c.key !== 'string' ||
      typeof c.level !== 'number' ||
      typeof c.constellation !== 'number' ||
      typeof c.ascension !== 'number' ||
      typeof c.talent !== 'object' ||
      c.talent === null
    ) {
      return false;
    }
    const talent = c.talent as Record<string, unknown>;
    return (
      typeof talent.auto === 'number' &&
      typeof talent.skill === 'number' &&
      typeof talent.burst === 'number'
    );
  };

  // Characters array is optional but must be valid if present
  if (obj.characters !== undefined) {
    if (!Array.isArray(obj.characters)) {
      return false;
    }

    if (!obj.characters.every(isValidCharacter)) {
      return false;
    }
  }

  if (obj.targets !== undefined) {
    if (!Array.isArray(obj.targets)) {
      return false;
    }

    if (!obj.targets.every(isValidTarget)) {
      return false;
    }
  }

  if (obj.weapons !== undefined) {
    if (!Array.isArray(obj.weapons)) {
      return false;
    }

    if (!obj.weapons.every(isValidWeapon)) {
      return false;
    }
  }

  if (obj.artifacts !== undefined) {
    if (!Array.isArray(obj.artifacts)) {
      return false;
    }

    if (!obj.artifacts.every(isValidArtifact)) {
      return false;
    }
  }

  return true;
}

export interface InventoryExportData {
  characters: Character[];
  inventoryArtifacts: InventoryArtifact[];
  inventoryWeapons: InventoryWeapon[];
  materials: Record<string, number>;
}

/**
 * Result of importing GOOD format with inventory data
 */
export interface GOODImportResult {
  characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[];
  inventoryArtifacts: Omit<InventoryArtifact, 'createdAt' | 'updatedAt'>[];
  inventoryWeapons: Omit<InventoryWeapon, 'createdAt' | 'updatedAt'>[];
  materials: Record<string, number>;
}

/**
 * Convert GOOD format to internal format including inventory artifacts/weapons.
 * Unlike fromGOOD(), this also extracts unequipped artifacts and weapons
 * that were exported via toGOODWithInventory().
 */
export function fromGOODWithInventory(good: GOODFormat): GOODImportResult {
  if (good.format !== 'GOOD') {
    throw new Error('Invalid format: expected GOOD format');
  }

  const characters = fromGOOD(good);

  const goodArtifacts = good.artifacts || [];
  const goodWeapons = good.weapons || [];
  const goodCharacters = good.characters || [];

  // Build a set of character keys for location validation
  const characterKeys = new Set(goodCharacters.map((c) => c.key));

  // Track which artifacts are already embedded in characters (equipped artifacts)
  // so we don't duplicate them in the inventory
  const equippedArtifactKeys = new Set<string>();
  for (const char of characters) {
    for (const artifact of char.artifacts) {
      equippedArtifactKeys.add(
        `${char.key}:${artifact.setKey}:${artifact.slotKey}:${artifact.mainStatKey}:${artifact.level}`
      );
    }
  }

  // Extract ALL artifacts into inventory format (both equipped and unequipped)
  // Track occurrences so that artifacts with identical visible properties
  // get distinct IDs instead of silently colliding.
  const inventoryArtifacts: Omit<InventoryArtifact, 'createdAt' | 'updatedAt'>[] = [];
  const artifactKeyOccurrences = new Map<string, number>();

  for (const a of goodArtifacts) {
    // Generate deterministic ID from artifact properties
    const substatStr = a.substats
      .map((s) => `${s.key}:${s.value}`)
      .sort()
      .join('|');
    const baseId = `good-${a.setKey}-${a.slotKey}-${a.mainStatKey}-${a.level}-${a.rarity}-${substatStr}`.replace(
      /[^a-zA-Z0-9-_|:]/g,
      ''
    );

    const occurrence = artifactKeyOccurrences.get(baseId) || 0;
    artifactKeyOccurrences.set(baseId, occurrence + 1);
    const id = occurrence === 0 ? baseId : `${baseId}-${occurrence}`;

    // Only include location if the character exists in this export
    const location = a.location && characterKeys.has(a.location) ? a.location : '';

    inventoryArtifacts.push({
      id,
      setKey: a.setKey,
      slotKey: toSlotKey(a.slotKey),
      level: a.level,
      rarity: a.rarity,
      mainStatKey: a.mainStatKey,
      substats: a.substats
        .filter((s) => s.key !== '' && s.key !== undefined)
        .map((s) => ({ key: s.key, value: s.value })),
      location,
      lock: a.lock,
    });
  }

  // Extract unequipped weapons into inventory format
  const equippedWeaponKeys = new Set<string>();
  for (const char of characters) {
    equippedWeaponKeys.add(`${char.key}:${char.weapon.key}`);
  }

  const inventoryWeapons: Omit<InventoryWeapon, 'createdAt' | 'updatedAt'>[] = [];

  for (const w of goodWeapons) {
    const location = w.location && characterKeys.has(w.location) ? w.location : '';
    const id = `good-${w.key}-${w.level}-${w.ascension}-${w.refinement}-${location}`.replace(
      /[^a-zA-Z0-9-_]/g,
      ''
    );

    inventoryWeapons.push({
      id,
      key: w.key,
      level: w.level,
      ascension: w.ascension,
      refinement: w.refinement,
      location,
      lock: w.lock,
    });
  }

  return {
    characters,
    inventoryArtifacts,
    inventoryWeapons,
    materials: good.materials || {},
  };
}

/**
 * Convert all data (characters + standalone inventory) to GOOD format for full export
 * This is used for cross-platform sync (e.g., Windows to Mac)
 */
export function toGOODWithInventory(data: InventoryExportData): GOODFormat {
  const goodCharacters: GOODCharacter[] = [];
  const goodWeapons: GOODWeapon[] = [];
  const goodArtifacts: GOODArtifact[] = [];

  // Track which artifacts and weapons are embedded in characters
  const embeddedArtifactKeys = new Set<string>();
  const embeddedWeaponKeys = new Set<string>();

  // First, process characters and their equipped items
  for (const char of data.characters) {
    const characterKey = toGoodCharacterKey(char.key);

    // Add character
    goodCharacters.push({
      key: characterKey,
      level: char.level,
      constellation: char.constellation,
      ascension: char.ascension,
      talent: {
        auto: char.talent.auto,
        skill: char.talent.skill,
        burst: char.talent.burst,
      },
    });

    // Add weapon (from character's embedded weapon)
    goodWeapons.push({
      key: toGoodWeaponKey(char.weapon.key),
      level: char.weapon.level,
      ascension: char.weapon.ascension,
      refinement: char.weapon.refinement,
      location: characterKey,
      lock: true,
    });

    // Mark this weapon as embedded
    embeddedWeaponKeys.add(`${characterKey}:${char.weapon.key}`);

    // Add artifacts from character's embedded artifacts
    for (const artifact of char.artifacts) {
      const maxLevel = getMaxArtifactLevel(artifact.rarity);
      goodArtifacts.push({
        setKey: toGoodArtifactSetKey(artifact.setKey),
        slotKey: artifact.slotKey,
        level: Math.min(artifact.level, maxLevel),
        rarity: artifact.rarity,
        mainStatKey: toGoodStatKey(artifact.mainStatKey),
        location: characterKey,
        lock: true,
        substats: artifact.substats.map((substat) => ({
          key: toGoodStatKey(substat.key),
          value: substat.value,
        })),
      });
    }

    // Mark embedded artifacts
    for (const artifact of char.artifacts) {
      embeddedArtifactKeys.add(
        `${characterKey}:${artifact.setKey}:${artifact.slotKey}:${artifact.mainStatKey}:${artifact.level}`
      );
    }
  }

  // Add standalone inventory artifacts (unequipped ones)
  for (const artifact of data.inventoryArtifacts) {
    // Skip if already exported via character embedding
    const artifactKey = `${artifact.location}:${artifact.setKey}:${artifact.slotKey}:${artifact.mainStatKey}:${artifact.level}`;
    if (artifact.location && embeddedArtifactKeys.has(artifactKey)) {
      continue;
    }

    const maxLevel = getMaxArtifactLevel(artifact.rarity);
    goodArtifacts.push({
      setKey: toGoodArtifactSetKey(artifact.setKey),
      slotKey: artifact.slotKey,
      level: Math.min(artifact.level, maxLevel),
      rarity: artifact.rarity,
      mainStatKey: toGoodStatKey(artifact.mainStatKey),
      location: artifact.location || '',
      lock: artifact.lock,
      substats: artifact.substats.map((substat) => ({
        key: toGoodStatKey(substat.key),
        value: substat.value,
      })),
    });
  }

  // Add standalone inventory weapons (unequipped ones)
  for (const weapon of data.inventoryWeapons) {
    // Skip if already exported via character embedding
    const weaponKey = `${weapon.location}:${weapon.key}`;
    if (weapon.location && embeddedWeaponKeys.has(weaponKey)) {
      continue;
    }

    goodWeapons.push({
      key: toGoodWeaponKey(weapon.key),
      level: weapon.level,
      ascension: weapon.ascension,
      refinement: weapon.refinement,
      location: weapon.location || '',
      lock: weapon.lock,
    });
  }

  const active = goodCharacters[0]?.key;
  const targets: GOODTarget[] =
    goodCharacters.length > 0
      ? [
          {
            level: 1,
            pos: [0, 0],
            radius: 1,
          },
        ]
      : [];

  return {
    format: 'GOOD',
    version: 3,
    source: 'Genshin Progress Tracker',
    ...(active ? { active } : {}),
    targets,
    characters: goodCharacters,
    weapons: goodWeapons,
    artifacts: goodArtifacts,
    materials: Object.keys(data.materials).length > 0 ? data.materials : undefined,
  };
}
