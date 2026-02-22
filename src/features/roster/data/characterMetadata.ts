/**
 * Expanded metadata for roster filtering and sorting.
 * Generated from Enka Network character manifest with common aliases.
 *
 * IMPORTANT: Each character should have exactly ONE entry using its canonical key.
 * The lookup function normalizes spaces and casing, so "Hu Tao", "HuTao", and "hutao"
 * all resolve to the same entry. Do NOT add duplicate alias entries.
 */
export interface CharacterMetadata {
  key: string;
  element: string;
  weaponType: string;
  rarity: number;
}

export const CHARACTER_METADATA: CharacterMetadata[] = [
  // Mondstadt
  { key: 'Albedo', element: 'Geo', weaponType: 'Sword', rarity: 5 },
  { key: 'Amber', element: 'Pyro', weaponType: 'Bow', rarity: 4 },
  { key: 'Barbara', element: 'Hydro', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Bennett', element: 'Pyro', weaponType: 'Sword', rarity: 4 },
  { key: 'Diluc', element: 'Pyro', weaponType: 'Claymore', rarity: 5 },
  { key: 'Diona', element: 'Cryo', weaponType: 'Bow', rarity: 4 },
  { key: 'Eula', element: 'Cryo', weaponType: 'Claymore', rarity: 5 },
  { key: 'Fischl', element: 'Electro', weaponType: 'Bow', rarity: 4 },
  { key: 'Jean', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Kaeya', element: 'Cryo', weaponType: 'Sword', rarity: 4 },
  { key: 'Klee', element: 'Pyro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Lisa', element: 'Electro', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Mika', element: 'Cryo', weaponType: 'Polearm', rarity: 4 },
  { key: 'Mona', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Noelle', element: 'Geo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Razor', element: 'Electro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Rosaria', element: 'Cryo', weaponType: 'Polearm', rarity: 4 },
  { key: 'Sucrose', element: 'Anemo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Venti', element: 'Anemo', weaponType: 'Bow', rarity: 5 },
  { key: 'Xinyan', element: 'Pyro', weaponType: 'Claymore', rarity: 4 },
  // Liyue
  { key: 'Beidou', element: 'Electro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Chongyun', element: 'Cryo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Ganyu', element: 'Cryo', weaponType: 'Bow', rarity: 5 },
  { key: 'Hu Tao', element: 'Pyro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Keqing', element: 'Electro', weaponType: 'Sword', rarity: 5 },
  { key: 'Ningguang', element: 'Geo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Qiqi', element: 'Cryo', weaponType: 'Sword', rarity: 5 },
  { key: 'Shenhe', element: 'Cryo', weaponType: 'Polearm', rarity: 5 },
  { key: 'Xiangling', element: 'Pyro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Xiao', element: 'Anemo', weaponType: 'Polearm', rarity: 5 },
  { key: 'Xingqiu', element: 'Hydro', weaponType: 'Sword', rarity: 4 },
  { key: 'Yanfei', element: 'Pyro', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Yelan', element: 'Hydro', weaponType: 'Bow', rarity: 5 },
  { key: 'Yun Jin', element: 'Geo', weaponType: 'Polearm', rarity: 4 },
  { key: 'Zhongli', element: 'Geo', weaponType: 'Polearm', rarity: 5 },
  { key: 'Gaming', element: 'Pyro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Xianyun', element: 'Anemo', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Yaoyao', element: 'Dendro', weaponType: 'Polearm', rarity: 4 },
  // Inazuma
  { key: 'Arataki Itto', element: 'Geo', weaponType: 'Claymore', rarity: 5 },
  { key: 'Kamisato Ayaka', element: 'Cryo', weaponType: 'Sword', rarity: 5 },
  { key: 'Kamisato Ayato', element: 'Hydro', weaponType: 'Sword', rarity: 5 },
  { key: 'Gorou', element: 'Geo', weaponType: 'Bow', rarity: 4 },
  { key: 'Kaedehara Kazuha', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Kirara', element: 'Dendro', weaponType: 'Sword', rarity: 4 },
  { key: 'Kujou Sara', element: 'Electro', weaponType: 'Bow', rarity: 4 },
  { key: 'Kuki Shinobu', element: 'Electro', weaponType: 'Sword', rarity: 4 },
  { key: 'Raiden Shogun', element: 'Electro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Sangonomiya Kokomi', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Sayu', element: 'Anemo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Shikanoin Heizou', element: 'Anemo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Thoma', element: 'Pyro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Yae Miko', element: 'Electro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Yoimiya', element: 'Pyro', weaponType: 'Bow', rarity: 5 },
  // Sumeru
  { key: 'Alhaitham', element: 'Dendro', weaponType: 'Sword', rarity: 5 },
  { key: 'Baizhu', element: 'Dendro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Candace', element: 'Hydro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Collei', element: 'Dendro', weaponType: 'Bow', rarity: 4 },
  { key: 'Cyno', element: 'Electro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Dehya', element: 'Pyro', weaponType: 'Claymore', rarity: 5 },
  { key: 'Dori', element: 'Electro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Faruzan', element: 'Anemo', weaponType: 'Bow', rarity: 4 },
  { key: 'Kaveh', element: 'Dendro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Layla', element: 'Cryo', weaponType: 'Sword', rarity: 4 },
  { key: 'Nahida', element: 'Dendro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Nilou', element: 'Hydro', weaponType: 'Sword', rarity: 5 },
  { key: 'Sethos', element: 'Electro', weaponType: 'Bow', rarity: 4 },
  { key: 'Tighnari', element: 'Dendro', weaponType: 'Bow', rarity: 5 },
  { key: 'Wanderer', element: 'Anemo', weaponType: 'Catalyst', rarity: 5 },
  // Fontaine
  { key: 'Arlecchino', element: 'Pyro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Charlotte', element: 'Cryo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Chevreuse', element: 'Pyro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Chiori', element: 'Geo', weaponType: 'Sword', rarity: 5 },
  { key: 'Clorinde', element: 'Electro', weaponType: 'Sword', rarity: 5 },
  { key: 'Emilie', element: 'Dendro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Freminet', element: 'Cryo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Furina', element: 'Hydro', weaponType: 'Sword', rarity: 5 },
  { key: 'Lynette', element: 'Anemo', weaponType: 'Sword', rarity: 4 },
  { key: 'Lyney', element: 'Pyro', weaponType: 'Bow', rarity: 5 },
  { key: 'Navia', element: 'Geo', weaponType: 'Claymore', rarity: 5 },
  { key: 'Neuvillette', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Sigewinne', element: 'Hydro', weaponType: 'Bow', rarity: 5 },
  { key: 'Wriothesley', element: 'Cryo', weaponType: 'Catalyst', rarity: 5 },
  // Natlan
  { key: 'Chasca', element: 'Anemo', weaponType: 'Bow', rarity: 5 },
  { key: 'Citlali', element: 'Cryo', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Iansan', element: 'Electro', weaponType: 'Polearm', rarity: 4 },
  { key: 'Kachina', element: 'Geo', weaponType: 'Claymore', rarity: 4 },
  { key: 'Kinich', element: 'Dendro', weaponType: 'Claymore', rarity: 5 },
  { key: 'Lan Yan', element: 'Anemo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Mavuika', element: 'Pyro', weaponType: 'Claymore', rarity: 5 },
  { key: 'Mualani', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Ororon', element: 'Electro', weaponType: 'Bow', rarity: 4 },
  { key: 'Varesa', element: 'Electro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Xilonen', element: 'Geo', weaponType: 'Sword', rarity: 5 },
  // Other / Traveler / Collab
  { key: 'Aloy', element: 'Cryo', weaponType: 'Bow', rarity: 5 },
  { key: 'Lumine', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Aether', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Tartaglia', element: 'Hydro', weaponType: 'Bow', rarity: 5 },
  { key: 'Yumemizuki Mizuki', element: 'Anemo', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Manekin', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Manekina', element: 'Anemo', weaponType: 'Sword', rarity: 5 },
  { key: 'Illuga', element: 'Geo', weaponType: 'Polearm', rarity: 4 },
  { key: 'Zibai', element: 'Geo', weaponType: 'Sword', rarity: 5 },
  { key: 'Varka', element: 'Anemo', weaponType: 'Claymore', rarity: 5 },
  // Upcoming / leaked (metadata only, may not have avatarId yet)
  { key: 'Avero', element: 'Anemo', weaponType: 'Bow', rarity: 4 },
  { key: 'Iljane', element: 'Hydro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Olorun', element: 'Electro', weaponType: 'Bow', rarity: 4 },
  { key: 'Escoffier', element: 'Cryo', weaponType: 'Polearm', rarity: 5 },
  { key: 'Ifa', element: 'Anemo', weaponType: 'Catalyst', rarity: 4 },
  { key: 'Skirk', element: 'Cryo', weaponType: 'Sword', rarity: 5 },
  { key: 'Dahlia', element: 'Hydro', weaponType: 'Sword', rarity: 4 },
  { key: 'Ineffa', element: 'Electro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Columbina', element: 'Hydro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Lauma', element: 'Dendro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Flins', element: 'Electro', weaponType: 'Polearm', rarity: 5 },
  { key: 'Aino', element: 'Hydro', weaponType: 'Claymore', rarity: 4 },
  { key: 'Nefer', element: 'Dendro', weaponType: 'Catalyst', rarity: 5 },
  { key: 'Durin', element: 'Pyro', weaponType: 'Sword', rarity: 5 },
  { key: 'Jahoda', element: 'Anemo', weaponType: 'Bow', rarity: 4 },
];

const metadataByKey = new Map<string, CharacterMetadata>();

for (const entry of CHARACTER_METADATA) {
  // Index by both the raw lowercase key and the space-stripped version
  // so lookups work with "Hu Tao", "HuTao", "hutao", etc.
  metadataByKey.set(entry.key.toLowerCase(), entry);
  const stripped = entry.key.toLowerCase().replace(/\s+/g, '');
  if (stripped !== entry.key.toLowerCase()) {
    metadataByKey.set(stripped, entry);
  }
}

export function getCharacterMetadata(key: string): CharacterMetadata | undefined {
  // Try exact lowercase first, then try without spaces
  return metadataByKey.get(key.toLowerCase()) ?? metadataByKey.get(key.toLowerCase().replace(/\s+/g, ''));
}

const validElements = CHARACTER_METADATA
  .map((entry) => entry.element)
  .filter((element) => element && element !== 'Unknown' && element !== 'None');

export const KNOWN_ELEMENTS = Array.from(new Set(validElements)).sort();

const validWeapons = CHARACTER_METADATA
  .map((entry) => entry.weaponType)
  .filter((type) => type && type !== 'Unknown');

export const KNOWN_WEAPON_TYPES = Array.from(new Set(validWeapons)).sort();

export const KNOWN_RARITIES = Array.from(
  new Set(CHARACTER_METADATA.map((entry) => entry.rarity).filter((rarity) => rarity > 0))
).sort((a, b) => b - a);
