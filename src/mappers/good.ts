import type { Character } from '@/types';

// GOOD Format v2 Specification
// https://frzyc.github.io/genshin-optimizer/#/doc

export interface GOODFormat {
  format: 'GOOD';
  version: number;
  source: string;
  characters?: GOODCharacter[];
  artifacts?: GOODArtifact[];
  weapons?: GOODWeapon[];
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

/**
 * Convert internal Character format to GOOD format
 */
export function toGOOD(characters: Character[]): GOODFormat {
  const goodCharacters: GOODCharacter[] = [];
  const goodWeapons: GOODWeapon[] = [];
  const goodArtifacts: GOODArtifact[] = [];

  for (const char of characters) {
    // Add character
    goodCharacters.push({
      key: char.key,
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
      key: char.weapon.key,
      level: char.weapon.level,
      ascension: char.weapon.ascension,
      refinement: char.weapon.refinement,
      location: char.key,
      lock: true,
    });

    // Add artifacts
    for (const artifact of char.artifacts) {
      goodArtifacts.push({
        setKey: artifact.setKey,
        slotKey: artifact.slotKey,
        level: artifact.level,
        rarity: artifact.rarity,
        mainStatKey: artifact.mainStatKey,
        location: char.key,
        lock: true,
        substats: artifact.substats,
      });
    }
  }

  return {
    format: 'GOOD',
    version: 2,
    source: 'Genshin Progress Tracker',
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
