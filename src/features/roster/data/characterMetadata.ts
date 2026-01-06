export interface CharacterMetadata {
  key: string;
  element: string;
  weaponType: string;
  rarity: number;
}

const CHARACTER_METADATA: CharacterMetadata[] = [
  { key: 'Furina', element: 'Hydro', weaponType: 'Sword', rarity: 5 },
  { key: 'Neuvillette', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Kazuha', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Bennett', element: 'Pyro', weaponType: 'Sword', rarity: 4 },
  { key: 'Xiangling', element: 'Pyro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Raiden Shogun', element: 'Electro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Noelle', element: 'Geo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Amber', element: 'Pyro', weaponType: 'Bow', rarity: 4 },
];

const metadataByKey = new Map<string, CharacterMetadata>();

for (const entry of CHARACTER_METADATA) {
  metadataByKey.set(entry.key.toLowerCase(), entry);
}

export function getCharacterMetadata(key: string): CharacterMetadata | undefined {
  return metadataByKey.get(key.toLowerCase());
}

export const KNOWN_ELEMENTS = Array.from(
  new Set(CHARACTER_METADATA.map((entry) => entry.element))
);

export const KNOWN_WEAPON_TYPES = Array.from(
  new Set(CHARACTER_METADATA.map((entry) => entry.weaponType))
);

export const KNOWN_RARITIES = Array.from(
  new Set(CHARACTER_METADATA.map((entry) => entry.rarity))
).sort((a, b) => b - a);
