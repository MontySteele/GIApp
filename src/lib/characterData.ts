// Character avatar ID to icon name mapping (for Enka CDN)
// Maps avatarId to the internal icon name used in Enka's CDN
// Source: https://github.com/EnkaNetwork/API-docs/blob/master/store/characters.json
const CHARACTER_ICON_NAMES: Record<number, string> = {
  10000002: 'Ayaka',
  10000003: 'Qin', // Jean
  10000005: 'PlayerBoy', // Traveler (male)
  10000006: 'Lisa',
  10000007: 'PlayerGirl', // Traveler (female)
  10000014: 'Barbara',
  10000015: 'Kaeya',
  10000016: 'Diluc',
  10000020: 'Razor',
  10000021: 'Ambor', // Amber
  10000022: 'Venti',
  10000023: 'Xiangling',
  10000024: 'Beidou',
  10000025: 'Xingqiu',
  10000026: 'Xiao',
  10000027: 'Ningguang',
  10000029: 'Klee',
  10000030: 'Zhongli',
  10000031: 'Fischl',
  10000032: 'Bennett',
  10000033: 'Tartaglia',
  10000034: 'Noel', // Noelle
  10000035: 'Qiqi',
  10000036: 'Chongyun',
  10000037: 'Ganyu',
  10000038: 'Albedo',
  10000039: 'Diona',
  10000041: 'Mona',
  10000042: 'Keqing',
  10000043: 'Sucrose',
  10000044: 'Xinyan',
  10000045: 'Rosaria',
  10000046: 'Hutao', // Hu Tao
  10000047: 'Kazuha',
  10000048: 'Feiyan', // Yanfei
  10000049: 'Yoimiya',
  10000050: 'Tohma', // Thoma
  10000051: 'Eula',
  10000052: 'Shougun', // Raiden Shogun
  10000053: 'Sayu',
  10000054: 'Kokomi',
  10000055: 'Gorou',
  10000056: 'Sara',
  10000057: 'Itto',
  10000058: 'Yae',
  10000059: 'Heizou',
  10000060: 'Yelan',
  10000061: 'Momoka', // Kirara (pre-release internal name)
  10000062: 'Aloy',
  10000063: 'Shenhe',
  10000064: 'Yunjin',
  10000065: 'Shinobu',
  10000066: 'Ayato',
  10000067: 'Collei',
  10000068: 'Dori',
  10000069: 'Tighnari',
  10000070: 'Nilou',
  10000071: 'Cyno',
  10000072: 'Candace',
  10000073: 'Nahida',
  10000074: 'Layla',
  10000075: 'Wanderer',
  10000076: 'Faruzan',
  10000077: 'Yaoyao',
  10000078: 'Alhaitham',
  10000079: 'Dehya',
  10000080: 'Mika',
  10000081: 'Kaveh',
  10000082: 'Baizhu',
  10000083: 'Linette', // Lynette
  10000084: 'Liney', // Lyney
  10000085: 'Freminet',
  10000086: 'Wriothesley',
  10000087: 'Neuvillette',
  10000088: 'Charlotte',
  10000089: 'Furina',
  10000090: 'Chevreuse',
  10000091: 'Navia',
  10000092: 'Gaming',
  10000093: 'Liuyun', // Xianyun
  10000094: 'Chiori',
  10000095: 'Sigewinne',
  10000096: 'Arlecchino',
  10000097: 'Sethos',
  10000098: 'Clorinde',
  10000099: 'Emilie',
  10000100: 'Kachina',
  10000101: 'Kinich',
  10000102: 'Mualani',
  10000103: 'Xilonen',
  10000104: 'Chasca',
  10000105: 'Olorun', // Ororon
  10000106: 'Mavuika',
  10000107: 'Citlali',
  10000108: 'Lanyan', // Lan Yan
  10000109: 'Mizuki',
  10000110: 'Iansan',
  10000111: 'Varesa',
  10000112: 'Escoffier',
  10000113: 'Ifa',
  10000114: 'SkirkNew', // Skirk
  10000115: 'Dahlia',
  10000116: 'Ineffa',
  10000119: 'Lauma',
  10000120: 'Flins',
  10000121: 'Aino',
  10000122: 'Nefer',
  10000123: 'Durin',
  10000117: 'MannequinBoy', // Manekin (male)
  10000118: 'MannequinGirl', // Manekina (female)
  10000124: 'Jahoda',
  10000125: 'Columbina',
  10000126: 'Zibai',
  10000127: 'Illuga',
  10000128: 'Varka',
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

// Shared utility for PascalCase conversion
function toPascalCase(value: string): string {
  return value
    .replace(/[''\u2019]s\b/g, 's')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
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
