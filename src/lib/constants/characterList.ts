/**
 * Complete list of all Genshin Impact characters
 * Used for wishlist and other features
 */

export interface CharacterInfo {
  /** Canonical GOOD-format key (PascalCase of the full name, e.g. "KamisatoAyaka", "HuTao"). */
  key: string;
  name: string;
  rarity: 4 | 5;
  element: 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';
  weapon: 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
}

// Last updated for version 6.7
// See src/lib/constants/patchVersion.ts for the single source of truth.
export const ALL_CHARACTERS: CharacterInfo[] = [
  // Traveler (special - can use multiple elements)
  { key: 'TravelerAnemo', name: 'Traveler (Anemo)', rarity: 5, element: 'Anemo', weapon: 'Sword' },
  { key: 'TravelerGeo', name: 'Traveler (Geo)', rarity: 5, element: 'Geo', weapon: 'Sword' },
  { key: 'TravelerElectro', name: 'Traveler (Electro)', rarity: 5, element: 'Electro', weapon: 'Sword' },
  { key: 'TravelerDendro', name: 'Traveler (Dendro)', rarity: 5, element: 'Dendro', weapon: 'Sword' },
  { key: 'TravelerHydro', name: 'Traveler (Hydro)', rarity: 5, element: 'Hydro', weapon: 'Sword' },
  { key: 'TravelerPyro', name: 'Traveler (Pyro)', rarity: 5, element: 'Pyro', weapon: 'Sword' },

  // 5-Star Characters
  { key: 'Albedo', name: 'Albedo', rarity: 5, element: 'Geo', weapon: 'Sword' },
  { key: 'Alhaitham', name: 'Alhaitham', rarity: 5, element: 'Dendro', weapon: 'Sword' },
  { key: 'AratakiItto', name: 'Arataki Itto', rarity: 5, element: 'Geo', weapon: 'Claymore' },
  { key: 'KamisatoAyaka', name: 'Kamisato Ayaka', rarity: 5, element: 'Cryo', weapon: 'Sword' },
  { key: 'KamisatoAyato', name: 'Kamisato Ayato', rarity: 5, element: 'Hydro', weapon: 'Sword' },
  { key: 'Baizhu', name: 'Baizhu', rarity: 5, element: 'Dendro', weapon: 'Catalyst' },
  { key: 'Chasca', name: 'Chasca', rarity: 5, element: 'Anemo', weapon: 'Bow' },
  { key: 'Chiori', name: 'Chiori', rarity: 5, element: 'Geo', weapon: 'Sword' },
  { key: 'Citlali', name: 'Citlali', rarity: 5, element: 'Cryo', weapon: 'Catalyst' },
  { key: 'Clorinde', name: 'Clorinde', rarity: 5, element: 'Electro', weapon: 'Sword' },
  { key: 'Cyno', name: 'Cyno', rarity: 5, element: 'Electro', weapon: 'Polearm' },
  { key: 'Dehya', name: 'Dehya', rarity: 5, element: 'Pyro', weapon: 'Claymore' },
  { key: 'Diluc', name: 'Diluc', rarity: 5, element: 'Pyro', weapon: 'Claymore' },
  { key: 'Emilie', name: 'Emilie', rarity: 5, element: 'Dendro', weapon: 'Polearm' },
  { key: 'Escoffier', name: 'Escoffier', rarity: 5, element: 'Cryo', weapon: 'Polearm' },
  { key: 'Eula', name: 'Eula', rarity: 5, element: 'Cryo', weapon: 'Claymore' },
  { key: 'Furina', name: 'Furina', rarity: 5, element: 'Hydro', weapon: 'Sword' },
  { key: 'Ganyu', name: 'Ganyu', rarity: 5, element: 'Cryo', weapon: 'Bow' },
  { key: 'HuTao', name: 'Hu Tao', rarity: 5, element: 'Pyro', weapon: 'Polearm' },
  { key: 'Jean', name: 'Jean', rarity: 5, element: 'Anemo', weapon: 'Sword' },
  { key: 'KaedeharaKazuha', name: 'Kaedehara Kazuha', rarity: 5, element: 'Anemo', weapon: 'Sword' },
  { key: 'Keqing', name: 'Keqing', rarity: 5, element: 'Electro', weapon: 'Sword' },
  { key: 'Kinich', name: 'Kinich', rarity: 5, element: 'Dendro', weapon: 'Claymore' },
  { key: 'Klee', name: 'Klee', rarity: 5, element: 'Pyro', weapon: 'Catalyst' },
  { key: 'SangonomiyaKokomi', name: 'Sangonomiya Kokomi', rarity: 5, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Lyney', name: 'Lyney', rarity: 5, element: 'Pyro', weapon: 'Bow' },
  { key: 'Mavuika', name: 'Mavuika', rarity: 5, element: 'Pyro', weapon: 'Claymore' },
  { key: 'Mona', name: 'Mona', rarity: 5, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Mualani', name: 'Mualani', rarity: 5, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Nahida', name: 'Nahida', rarity: 5, element: 'Dendro', weapon: 'Catalyst' },
  { key: 'Navia', name: 'Navia', rarity: 5, element: 'Geo', weapon: 'Claymore' },
  { key: 'Neuvillette', name: 'Neuvillette', rarity: 5, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Nilou', name: 'Nilou', rarity: 5, element: 'Hydro', weapon: 'Sword' },
  { key: 'Qiqi', name: 'Qiqi', rarity: 5, element: 'Cryo', weapon: 'Sword' },
  { key: 'RaidenShogun', name: 'Raiden Shogun', rarity: 5, element: 'Electro', weapon: 'Polearm' },
  { key: 'Shenhe', name: 'Shenhe', rarity: 5, element: 'Cryo', weapon: 'Polearm' },
  { key: 'Sigewinne', name: 'Sigewinne', rarity: 5, element: 'Hydro', weapon: 'Bow' },
  { key: 'Tartaglia', name: 'Tartaglia', rarity: 5, element: 'Hydro', weapon: 'Bow' },
  { key: 'Tighnari', name: 'Tighnari', rarity: 5, element: 'Dendro', weapon: 'Bow' },
  { key: 'Venti', name: 'Venti', rarity: 5, element: 'Anemo', weapon: 'Bow' },
  { key: 'Wanderer', name: 'Wanderer', rarity: 5, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Wriothesley', name: 'Wriothesley', rarity: 5, element: 'Cryo', weapon: 'Catalyst' },
  { key: 'Xiao', name: 'Xiao', rarity: 5, element: 'Anemo', weapon: 'Polearm' },
  { key: 'Xianyun', name: 'Xianyun', rarity: 5, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Xilonen', name: 'Xilonen', rarity: 5, element: 'Geo', weapon: 'Sword' },
  { key: 'YaeMiko', name: 'Yae Miko', rarity: 5, element: 'Electro', weapon: 'Catalyst' },
  { key: 'Yelan', name: 'Yelan', rarity: 5, element: 'Hydro', weapon: 'Bow' },
  { key: 'Yoimiya', name: 'Yoimiya', rarity: 5, element: 'Pyro', weapon: 'Bow' },
  { key: 'Zhongli', name: 'Zhongli', rarity: 5, element: 'Geo', weapon: 'Polearm' },
  { key: 'Arlecchino', name: 'Arlecchino', rarity: 5, element: 'Pyro', weapon: 'Polearm' },
  { key: 'Aloy', name: 'Aloy', rarity: 5, element: 'Cryo', weapon: 'Bow' },
  { key: 'Durin', name: 'Durin', rarity: 5, element: 'Pyro', weapon: 'Sword' },
  { key: 'Flins', name: 'Flins', rarity: 5, element: 'Electro', weapon: 'Polearm' },
  { key: 'Lauma', name: 'Lauma', rarity: 5, element: 'Dendro', weapon: 'Catalyst' },
  { key: 'Linnea', name: 'Linnea', rarity: 5, element: 'Geo', weapon: 'Bow' },
  { key: 'YumemizukiMizuki', name: 'Yumemizuki Mizuki', rarity: 5, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Nefer', name: 'Nefer', rarity: 5, element: 'Dendro', weapon: 'Catalyst' },
  { key: 'Skirk', name: 'Skirk', rarity: 5, element: 'Cryo', weapon: 'Sword' },
  { key: 'Varesa', name: 'Varesa', rarity: 5, element: 'Electro', weapon: 'Catalyst' },
  { key: 'Columbina', name: 'Columbina', rarity: 5, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Ineffa', name: 'Ineffa', rarity: 5, element: 'Electro', weapon: 'Polearm' },
  { key: 'Zibai', name: 'Zibai', rarity: 5, element: 'Geo', weapon: 'Sword' },
  { key: 'Varka', name: 'Varka', rarity: 5, element: 'Anemo', weapon: 'Claymore' },
  { key: 'Nicole', name: 'Nicole', rarity: 5, element: 'Pyro', weapon: 'Catalyst' },
  { key: 'Lohen', name: 'Lohen', rarity: 5, element: 'Cryo', weapon: 'Polearm' },
  { key: 'Sandrone', name: 'Sandrone', rarity: 5, element: 'Cryo', weapon: 'Claymore' },

  // 4-Star Characters
  { key: 'Amber', name: 'Amber', rarity: 4, element: 'Pyro', weapon: 'Bow' },
  { key: 'Barbara', name: 'Barbara', rarity: 4, element: 'Hydro', weapon: 'Catalyst' },
  { key: 'Beidou', name: 'Beidou', rarity: 4, element: 'Electro', weapon: 'Claymore' },
  { key: 'Bennett', name: 'Bennett', rarity: 4, element: 'Pyro', weapon: 'Sword' },
  { key: 'Candace', name: 'Candace', rarity: 4, element: 'Hydro', weapon: 'Polearm' },
  { key: 'Charlotte', name: 'Charlotte', rarity: 4, element: 'Cryo', weapon: 'Catalyst' },
  { key: 'Chevreuse', name: 'Chevreuse', rarity: 4, element: 'Pyro', weapon: 'Polearm' },
  { key: 'Chongyun', name: 'Chongyun', rarity: 4, element: 'Cryo', weapon: 'Claymore' },
  { key: 'Collei', name: 'Collei', rarity: 4, element: 'Dendro', weapon: 'Bow' },
  { key: 'Diona', name: 'Diona', rarity: 4, element: 'Cryo', weapon: 'Bow' },
  { key: 'Dori', name: 'Dori', rarity: 4, element: 'Electro', weapon: 'Claymore' },
  { key: 'Faruzan', name: 'Faruzan', rarity: 4, element: 'Anemo', weapon: 'Bow' },
  { key: 'Fischl', name: 'Fischl', rarity: 4, element: 'Electro', weapon: 'Bow' },
  { key: 'Freminet', name: 'Freminet', rarity: 4, element: 'Cryo', weapon: 'Claymore' },
  { key: 'Gaming', name: 'Gaming', rarity: 4, element: 'Pyro', weapon: 'Claymore' },
  { key: 'Gorou', name: 'Gorou', rarity: 4, element: 'Geo', weapon: 'Bow' },
  { key: 'ShikanoinHeizou', name: 'Shikanoin Heizou', rarity: 4, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Kachina', name: 'Kachina', rarity: 4, element: 'Geo', weapon: 'Polearm' },
  { key: 'Kaeya', name: 'Kaeya', rarity: 4, element: 'Cryo', weapon: 'Sword' },
  { key: 'Kaveh', name: 'Kaveh', rarity: 4, element: 'Dendro', weapon: 'Claymore' },
  { key: 'Kirara', name: 'Kirara', rarity: 4, element: 'Dendro', weapon: 'Sword' },
  { key: 'KujouSara', name: 'Kujou Sara', rarity: 4, element: 'Electro', weapon: 'Bow' },
  { key: 'KukiShinobu', name: 'Kuki Shinobu', rarity: 4, element: 'Electro', weapon: 'Sword' },
  { key: 'LanYan', name: 'Lan Yan', rarity: 4, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Layla', name: 'Layla', rarity: 4, element: 'Cryo', weapon: 'Sword' },
  { key: 'Lisa', name: 'Lisa', rarity: 4, element: 'Electro', weapon: 'Catalyst' },
  { key: 'Lynette', name: 'Lynette', rarity: 4, element: 'Anemo', weapon: 'Sword' },
  { key: 'Mika', name: 'Mika', rarity: 4, element: 'Cryo', weapon: 'Polearm' },
  { key: 'Ningguang', name: 'Ningguang', rarity: 4, element: 'Geo', weapon: 'Catalyst' },
  { key: 'Noelle', name: 'Noelle', rarity: 4, element: 'Geo', weapon: 'Claymore' },
  { key: 'Ororon', name: 'Ororon', rarity: 4, element: 'Electro', weapon: 'Bow' },
  { key: 'Razor', name: 'Razor', rarity: 4, element: 'Electro', weapon: 'Claymore' },
  { key: 'Rosaria', name: 'Rosaria', rarity: 4, element: 'Cryo', weapon: 'Polearm' },
  { key: 'Sayu', name: 'Sayu', rarity: 4, element: 'Anemo', weapon: 'Claymore' },
  { key: 'Sethos', name: 'Sethos', rarity: 4, element: 'Electro', weapon: 'Bow' },
  { key: 'Sucrose', name: 'Sucrose', rarity: 4, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Thoma', name: 'Thoma', rarity: 4, element: 'Pyro', weapon: 'Polearm' },
  { key: 'Xiangling', name: 'Xiangling', rarity: 4, element: 'Pyro', weapon: 'Polearm' },
  { key: 'Xingqiu', name: 'Xingqiu', rarity: 4, element: 'Hydro', weapon: 'Sword' },
  { key: 'Xinyan', name: 'Xinyan', rarity: 4, element: 'Pyro', weapon: 'Claymore' },
  { key: 'Yanfei', name: 'Yanfei', rarity: 4, element: 'Pyro', weapon: 'Catalyst' },
  { key: 'Yaoyao', name: 'Yaoyao', rarity: 4, element: 'Dendro', weapon: 'Polearm' },
  { key: 'YunJin', name: 'Yun Jin', rarity: 4, element: 'Geo', weapon: 'Polearm' },
  { key: 'Aino', name: 'Aino', rarity: 4, element: 'Hydro', weapon: 'Claymore' },
  { key: 'Dahlia', name: 'Dahlia', rarity: 4, element: 'Hydro', weapon: 'Sword' },
  { key: 'Iansan', name: 'Iansan', rarity: 4, element: 'Electro', weapon: 'Polearm' },
  { key: 'Ifa', name: 'Ifa', rarity: 4, element: 'Anemo', weapon: 'Catalyst' },
  { key: 'Jahoda', name: 'Jahoda', rarity: 4, element: 'Anemo', weapon: 'Bow' },
  { key: 'Illuga', name: 'Illuga', rarity: 4, element: 'Geo', weapon: 'Polearm' },
  { key: 'Prune', name: 'Prune', rarity: 4, element: 'Anemo', weapon: 'Catalyst' },
];

// Create lookup maps for fast access
export const CHARACTER_BY_KEY = new Map(ALL_CHARACTERS.map((c) => [c.key, c]));
export const CHARACTER_BY_NAME = new Map(ALL_CHARACTERS.map((c) => [c.name.toLowerCase(), c]));

/**
 * Search characters by name or key (case-insensitive partial match)
 */
export function searchCharacters(query: string): CharacterInfo[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return ALL_CHARACTERS.filter(
    (c) =>
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.key.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get character info by key. Accepts legacy/display-name variants (see normalizeCharacterKey).
 */
export function getCharacterByKey(key: string): CharacterInfo | undefined {
  return CHARACTER_BY_KEY.get(key) ?? CHARACTER_BY_KEY.get(normalizeCharacterKey(key));
}

// ---------------------------------------------------------------------------
// Canonical key normalisation
//
// Three conventions used to coexist: GOOD keys ("KamisatoAyaka"), display names
// ("Kamisato Ayaka", emitted by the Enka mapper) and short list keys ("Ayaka").
// Imports merged by exact key, so one character could exist three times. Every
// write path now goes through normalizeCharacterKey, and a startup data fix
// rewrites rows created before this existed.
// ---------------------------------------------------------------------------

function collapseKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** PascalCase a display name the way GOOD does ("Hu Tao" → "HuTao", "Traveler (Anemo)" → "TravelerAnemo"). */
export function toPascalCharacterKey(value: string): string {
  return value
    .replace(/[''\u2019]s\b/g, 's')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const EXTRA_CHARACTER_ALIASES: Record<string, string> = {
  // Legacy short keys used by older versions of this app
  ayaka: 'KamisatoAyaka',
  ayato: 'KamisatoAyato',
  itto: 'AratakiItto',
  aratakiitto: 'AratakiItto',
  kokomi: 'SangonomiyaKokomi',
  heizou: 'ShikanoinHeizou',
  mizuki: 'YumemizukiMizuki',
  sara: 'KujouSara',
  shinobu: 'KukiShinobu',
  kuki: 'KukiShinobu',
  // Common community short forms
  kazuha: 'KaedeharaKazuha',
  raiden: 'RaidenShogun',
  shogun: 'RaidenShogun',
  ei: 'RaidenShogun',
  yae: 'YaeMiko',
  miko: 'YaeMiko',
  childe: 'Tartaglia',
  scaramouche: 'Wanderer',
  olorun: 'Ororon',
  // Traveler variants without an element
  traveler: 'TravelerAnemo',
  aether: 'TravelerAnemo',
  lumine: 'TravelerAnemo',
};

const CANONICAL_KEY_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const character of ALL_CHARACTERS) {
    index.set(collapseKey(character.key), character.key);
    index.set(collapseKey(character.name), character.key);
  }
  for (const [alias, key] of Object.entries(EXTRA_CHARACTER_ALIASES)) {
    if (!index.has(alias)) index.set(alias, key);
  }
  return index;
})();

/**
 * Returns the canonical GOOD key for any known character spelling: canonical key,
 * display name, legacy short key, or common alias, in any casing/spacing.
 * Unknown characters are returned in GOOD (PascalCase) form so a brand-new character
 * still imports consistently from every source. Placeholder keys ("Unknown_10000130")
 * pass through untouched.
 */
export function normalizeCharacterKey(input: string): string {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return trimmed;
  if (CHARACTER_BY_KEY.has(trimmed)) return trimmed;
  if (/^Unknown_/i.test(trimmed)) return trimmed;
  const canonical = CANONICAL_KEY_INDEX.get(collapseKey(trimmed));
  if (canonical) return canonical;
  return toPascalCharacterKey(trimmed);
}

/** True when the key (after normalisation) is a character this app knows about. */
export function isKnownCharacterKey(input: string): boolean {
  return CHARACTER_BY_KEY.has(normalizeCharacterKey(input));
}
