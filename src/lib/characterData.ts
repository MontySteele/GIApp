import { ENKA_CHARACTERS } from '@/lib/data/enkaData.generated';
import { toPascalCase } from '@/lib/utils/pascalCase';

// Character avatarId to side-icon name on Enka's CDN, from Enka's data store
// (regenerate with scripts/generate-enka-data.mjs). The Manekin/Manekina have
// no base entry there, only per-element skill depots.
const CHARACTER_ICON_NAMES: Record<number, string> = {
  ...Object.fromEntries(Object.entries(ENKA_CHARACTERS).map(([id, character]) => [id, character.icon])),
  10000117: 'MannequinBoy',
  10000118: 'MannequinGirl',
};

// Reverse mapping: Character key (GOOD format) to avatarId
// Keys are normalized to lowercase for case-insensitive matching
const CHARACTER_KEY_TO_ID: Record<string, number> = {
  // Mondstadt
  'albedo': 10000038,
  'amber': 10000021,
  'barbara': 10000014,
  'bennett': 10000032,
  'diluc': 10000016,
  'diona': 10000039,
  'eula': 10000051,
  'fischl': 10000031,
  'jean': 10000003,
  'kaeya': 10000015,
  'klee': 10000029,
  'lisa': 10000006,
  'mika': 10000080,
  'mona': 10000041,
  'noelle': 10000034,
  'razor': 10000020,
  'rosaria': 10000045,
  'sucrose': 10000043,
  'venti': 10000022,
  'xinyan': 10000044,
  // Liyue
  'beidou': 10000024,
  'chongyun': 10000036,
  'ganyu': 10000037,
  'hutao': 10000046,
  'hu tao': 10000046,
  'keqing': 10000042,
  'ningguang': 10000027,
  'qiqi': 10000035,
  'shenhe': 10000063,
  'xiangling': 10000023,
  'xiao': 10000026,
  'xingqiu': 10000025,
  'yanfei': 10000048,
  'yelan': 10000060,
  'yunjin': 10000064,
  'yun jin': 10000064,
  'zhongli': 10000030,
  'gaming': 10000092,
  'xianyun': 10000093,
  'yaoyao': 10000077,
  'baizhu': 10000082,
  // Inazuma
  'aratakiitto': 10000057,
  'itto': 10000057,
  'kamisatoayaka': 10000002,
  'ayaka': 10000002,
  'kamisatoayato': 10000066,
  'ayato': 10000066,
  'gorou': 10000055,
  'kaedeharakazuha': 10000047,
  'kazuha': 10000047,
  'kirara': 10000061,
  'kujousara': 10000056,
  'sara': 10000056,
  'kukishinobu': 10000065,
  'shinobu': 10000065,
  'raidenshogun': 10000052,
  'raiden': 10000052,
  'sangonomiyakokomi': 10000054,
  'kokomi': 10000054,
  'sayu': 10000053,
  'shikanoinheizou': 10000059,
  'heizou': 10000059,
  'thoma': 10000050,
  'yaemiko': 10000058,
  'yae': 10000058,
  'yoimiya': 10000049,
  // Sumeru
  'alhaitham': 10000078,
  'candace': 10000072,
  'collei': 10000067,
  'cyno': 10000071,
  'dehya': 10000079,
  'dori': 10000068,
  'faruzan': 10000076,
  'kaveh': 10000081,
  'layla': 10000074,
  'nahida': 10000073,
  'nilou': 10000070,
  'sethos': 10000097,
  'tighnari': 10000069,
  'wanderer': 10000075,
  'scaramouche': 10000075,
  // Fontaine
  'arlecchino': 10000096,
  'charlotte': 10000088,
  'chevreuse': 10000090,
  'chiori': 10000094,
  'clorinde': 10000098,
  'emilie': 10000099,
  'freminet': 10000085,
  'furina': 10000089,
  'lynette': 10000083,
  'lyney': 10000084,
  'navia': 10000091,
  'neuvillette': 10000087,
  'sigewinne': 10000095,
  'wriothesley': 10000086,
  // Natlan
  'chasca': 10000104,
  'citlali': 10000107,
  'iansan': 10000110,
  'kachina': 10000100,
  'kinich': 10000101,
  'lanyan': 10000108,
  'lan yan': 10000108,
  'mavuika': 10000106,
  'mualani': 10000102,
  'ororon': 10000105,
  'varesa': 10000111,
  'xilonen': 10000103,
  // Other / Traveler / Collab
  'aloy': 10000062,
  'traveler': 10000005,
  'aether': 10000005,
  'lumine': 10000007,
  'tartaglia': 10000033,
  'childe': 10000033,
  'yumemizukimizuki': 10000109,
  'mizuki': 10000109,
  'olorun': 10000105, // alternate name for Ororon
  // Upcoming (confirmed in Enka data)
  'escoffier': 10000112,
  'ifa': 10000113,
  'skirk': 10000114,
  'dahlia': 10000115,
  'ineffa': 10000116,
  'lauma': 10000119,
  'flins': 10000120,
  'aino': 10000121,
  'nefer': 10000122,
  'durin': 10000123,
  'manekin': 10000117,
  'manekina': 10000118,
  'jahoda': 10000124,
  'columbina': 10000125,
  'zibai': 10000126,
  'illuga': 10000127,
  'varka': 10000128,
  'lohen': 10000129,
  'linnea': 10000130,
  'nicole': 10000131,
  'prune': 10000132,
  'sandrone': 10000133,
  'vodyanitsa': 10000140,
  'vesna': 10000143,
  'alyosha': 10000148,
  'odette': 10000150,
};

/**
 * Gets the avatarId for a character from its key
 * @param characterKey - The character key (GOOD format, e.g., "HuTao", "KamisatoAyaka")
 * @returns The avatarId or undefined if not found
 */
export function getAvatarIdFromKey(characterKey: string): number | undefined {
  // Normalize: remove spaces and convert to lowercase
  const normalized = characterKey.toLowerCase().replace(/\s+/g, '');
  return CHARACTER_KEY_TO_ID[normalized];
}

/**
 * Gets the Enka CDN portrait URL for a character
 * @param avatarId - The Enka avatar ID
 * @returns The portrait URL or undefined if not found
 */
export function getCharacterPortraitUrl(avatarId: number | undefined): string | undefined {
  if (!avatarId) return undefined;

  const iconName = CHARACTER_ICON_NAMES[avatarId];
  if (!iconName) return undefined;

  // Use Enka's CDN for side icons (smaller, suitable for cards)
  return `https://enka.network/ui/UI_AvatarIcon_Side_${iconName}.png`;
}

/**
 * Gets the Enka CDN portrait URL for a character by key (GOOD format)
 * Falls back to key-based lookup when avatarId is not available
 * @param characterKey - The character key in GOOD format (e.g. "Furina", "HuTao")
 * @returns The portrait URL or undefined if not found
 */
export function getCharacterPortraitUrlByKey(characterKey: string): string | undefined {
  const avatarId = getAvatarIdFromKey(characterKey);
  return getCharacterPortraitUrl(avatarId);
}

/**
 * Gets the Enka CDN gacha splash art URL for a character
 * @param avatarId - The Enka avatar ID
 * @returns The gacha art URL or undefined if not found
 */
export function getCharacterGachaArtUrl(avatarId: number | undefined): string | undefined {
  if (!avatarId) return undefined;

  const iconName = CHARACTER_ICON_NAMES[avatarId];
  if (!iconName) return undefined;

  // Use Enka's CDN for gacha art (full splash)
  return `https://enka.network/ui/UI_Gacha_AvatarImg_${iconName}.png`;
}


/**
 * Formats a character key to a GOOD/GO-compatible key
 */
export function toGoodCharacterKey(characterKey: string): string {
  if (!characterKey) {
    return characterKey;
  }

  if (/[^A-Za-z0-9]/.test(characterKey)) {
    return toPascalCase(characterKey);
  }

  return characterKey;
}

/**
 * Formats a weapon key to a GOOD/GO-compatible key
 */
export function toGoodWeaponKey(weaponKey: string): string {
  if (!weaponKey) {
    return weaponKey;
  }

  if (/[^A-Za-z0-9]/.test(weaponKey)) {
    return toPascalCase(weaponKey);
  }

  return weaponKey;
}

/**
 * Converts a GOOD-format character key to a human-readable display name.
 * Uses PascalCase splitting (e.g. "KamisatoAyaka" → "Kamisato Ayaka").
 * Already-spaced names pass through unchanged.
 */
export function getDisplayName(key: string): string {
  if (!key) return key;

  // If the key already contains spaces, return as-is
  if (key.includes(' ')) return key;

  // Split PascalCase: insert space before each uppercase letter that follows a lowercase letter
  return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}
