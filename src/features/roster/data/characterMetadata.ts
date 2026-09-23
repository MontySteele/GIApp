/**
 * Roster filter/sort metadata, derived from the canonical character list in
 * src/lib/constants/characterList.ts so patch updates only touch one file.
 *
 * Lookups normalize spaces and casing and accept either a character's key or
 * display name, so "Hu Tao", "HuTao", "hutao", and "Kamisato Ayaka"/"Ayaka"
 * all resolve.
 */
import { ALL_CHARACTERS } from '@/lib/constants/characterList';

export interface CharacterMetadata {
  key: string;
  element: string;
  weaponType: string;
  rarity: number;
}

export const CHARACTER_METADATA: CharacterMetadata[] = ALL_CHARACTERS.map((character) => ({
  key: character.key,
  element: character.element,
  weaponType: character.weapon,
  rarity: character.rarity,
}));

// Keys that older imports may have stored, mapped to their canonical key
const LEGACY_KEY_ALIASES: Record<string, string> = {
  olorun: 'Ororon', // Enka's internal name
  aether: 'TravelerAnemo',
  lumine: 'TravelerAnemo',
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

const metadataByKey = new Map<string, CharacterMetadata>();
ALL_CHARACTERS.forEach((character, index) => {
  const entry = CHARACTER_METADATA[index]!;
  metadataByKey.set(normalize(character.key), entry);
  if (!metadataByKey.has(normalize(character.name))) {
    metadataByKey.set(normalize(character.name), entry);
  }
});
for (const [alias, key] of Object.entries(LEGACY_KEY_ALIASES)) {
  const entry = metadataByKey.get(normalize(key));
  if (entry) metadataByKey.set(alias, entry);
}

export function getCharacterMetadata(key: string): CharacterMetadata | undefined {
  return metadataByKey.get(normalize(key));
}

export const KNOWN_ELEMENTS = Array.from(new Set(CHARACTER_METADATA.map((entry) => entry.element))).sort();

export const KNOWN_WEAPON_TYPES = Array.from(new Set(CHARACTER_METADATA.map((entry) => entry.weaponType))).sort();

export const KNOWN_RARITIES = Array.from(new Set(CHARACTER_METADATA.map((entry) => entry.rarity))).sort(
  (a, b) => b - a
);
