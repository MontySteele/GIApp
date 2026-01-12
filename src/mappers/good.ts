import type { Character, InventoryArtifact, InventoryWeapon } from '@/types';
import { toGoodArtifactSetKey, toGoodCharacterKey, toGoodStatKey, toGoodWeaponKey } from '@/lib/gameData';

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
        slotKey: a.slotKey as any,
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
export function validateGOOD(data: any): data is GOODFormat {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  if (data.format !== 'GOOD') {
    return false;
  }

  if (typeof data.version !== 'number') {
    return false;
  }

  if (data.active !== undefined && data.active !== null && typeof data.active !== 'string') {
    return false;
  }

  const isValidTarget = (target: any): target is GOODTarget =>
    typeof target === 'object' &&
    target !== null &&
    typeof target.level === 'number' &&
    Array.isArray(target.pos) &&
    target.pos.length === 2 &&
    target.pos.every((value: any) => typeof value === 'number') &&
    typeof target.radius === 'number';

  const isValidSubstat = (substat: any): substat is { key: string; value: number } =>
    typeof substat === 'object' &&
    substat !== null &&
    typeof substat.key === 'string' &&
    typeof substat.value === 'number';

  const isValidArtifact = (artifact: any): artifact is GOODArtifact =>
    typeof artifact === 'object' &&
    artifact !== null &&
    typeof artifact.setKey === 'string' &&
    typeof artifact.slotKey === 'string' &&
    typeof artifact.level === 'number' &&
    typeof artifact.rarity === 'number' &&
    typeof artifact.mainStatKey === 'string' &&
    typeof artifact.location === 'string' &&
    typeof artifact.lock === 'boolean' &&
    Array.isArray(artifact.substats) &&
    artifact.substats.every(isValidSubstat);

  const isValidWeapon = (weapon: any): weapon is GOODWeapon =>
    typeof weapon === 'object' &&
    weapon !== null &&
    typeof weapon.key === 'string' &&
    typeof weapon.level === 'number' &&
    typeof weapon.ascension === 'number' &&
    typeof weapon.refinement === 'number' &&
    typeof weapon.location === 'string' &&
    typeof weapon.lock === 'boolean';

  const isValidCharacter = (character: any): character is GOODCharacter =>
    typeof character === 'object' &&
    character !== null &&
    typeof character.key === 'string' &&
    typeof character.level === 'number' &&
    typeof character.constellation === 'number' &&
    typeof character.ascension === 'number' &&
    typeof character.talent === 'object' &&
    character.talent !== null &&
    typeof character.talent.auto === 'number' &&
    typeof character.talent.skill === 'number' &&
    typeof character.talent.burst === 'number';

  // Characters array is optional but must be valid if present
  if (data.characters !== undefined) {
    if (!Array.isArray(data.characters)) {
      return false;
    }

    if (!data.characters.every(isValidCharacter)) {
      return false;
    }
  }

  if (data.targets !== undefined) {
    if (!Array.isArray(data.targets)) {
      return false;
    }

    if (!data.targets.every(isValidTarget)) {
      return false;
    }
  }

  if (data.weapons !== undefined) {
    if (!Array.isArray(data.weapons)) {
      return false;
    }

    if (!data.weapons.every(isValidWeapon)) {
      return false;
    }
  }

  if (data.artifacts !== undefined) {
    if (!Array.isArray(data.artifacts)) {
      return false;
    }

    if (!data.artifacts.every(isValidArtifact)) {
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
