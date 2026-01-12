// Character avatar ID to icon name mapping (for Enka CDN)
// Maps avatarId to the internal icon name used in Enka's CDN
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
  10000061: 'Momoka', // Kirara
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
  10000083: 'Kirara',
  10000084: 'Lyney',
  10000085: 'Lynette',
  10000086: 'Freminet',
  10000087: 'Wriothesley',
  10000088: 'Charlotte',
  10000089: 'Furina',
  10000090: 'Chevreuse',
  10000091: 'Navia',
  10000092: 'Gaming',
  10000093: 'Liuyun', // Xianyun
  10000094: 'Chiori',
  10000095: 'Arlecchino',
  10000096: 'Sethos',
  10000097: 'Clorinde',
  10000098: 'Sigewinne',
  10000099: 'Emilie',
  10000100: 'Kachina',
  10000101: 'Kinich',
  10000102: 'Mualani',
  10000103: 'Xilonen',
  10000104: 'Chasca',
  10000105: 'Ororon',
  10000106: 'Mavuika',
  10000107: 'Citlali',
  10000108: 'Lanyan', // Lan Yan
  10000109: 'Mizuki',
};

// Reverse mapping: Character key (GOOD format) to avatarId
// Keys are normalized to lowercase for case-insensitive matching
const CHARACTER_KEY_TO_ID: Record<string, number> = {
  'kamisatoayaka': 10000002,
  'ayaka': 10000002,
  'jean': 10000003,
  'traveler': 10000005,
  'aether': 10000005,
  'lumine': 10000007,
  'lisa': 10000006,
  'barbara': 10000014,
  'kaeya': 10000015,
  'diluc': 10000016,
  'razor': 10000020,
  'amber': 10000021,
  'venti': 10000022,
  'xiangling': 10000023,
  'beidou': 10000024,
  'xingqiu': 10000025,
  'xiao': 10000026,
  'ningguang': 10000027,
  'klee': 10000029,
  'zhongli': 10000030,
  'fischl': 10000031,
  'bennett': 10000032,
  'tartaglia': 10000033,
  'childe': 10000033,
  'noelle': 10000034,
  'qiqi': 10000035,
  'chongyun': 10000036,
  'ganyu': 10000037,
  'albedo': 10000038,
  'diona': 10000039,
  'mona': 10000041,
  'keqing': 10000042,
  'sucrose': 10000043,
  'xinyan': 10000044,
  'rosaria': 10000045,
  'hutao': 10000046,
  'hu tao': 10000046,
  'kaedeharakazuha': 10000047,
  'kazuha': 10000047,
  'yanfei': 10000048,
  'yoimiya': 10000049,
  'thoma': 10000050,
  'eula': 10000051,
  'raidenshogun': 10000052,
  'raiden': 10000052,
  'sayu': 10000053,
  'sangonomiyakokomi': 10000054,
  'kokomi': 10000054,
  'gorou': 10000055,
  'kujousara': 10000056,
  'sara': 10000056,
  'aratakiitto': 10000057,
  'itto': 10000057,
  'yaemiko': 10000058,
  'yae': 10000058,
  'shikanoinheizou': 10000059,
  'heizou': 10000059,
  'yelan': 10000060,
  'kirara': 10000083,
  'aloy': 10000062,
  'shenhe': 10000063,
  'yunjin': 10000064,
  'yun jin': 10000064,
  'kukishinobu': 10000065,
  'shinobu': 10000065,
  'kamisatoayato': 10000066,
  'ayato': 10000066,
  'collei': 10000067,
  'dori': 10000068,
  'tighnari': 10000069,
  'nilou': 10000070,
  'cyno': 10000071,
  'candace': 10000072,
  'nahida': 10000073,
  'layla': 10000074,
  'wanderer': 10000075,
  'scaramouche': 10000075,
  'faruzan': 10000076,
  'yaoyao': 10000077,
  'alhaitham': 10000078,
  'dehya': 10000079,
  'mika': 10000080,
  'kaveh': 10000081,
  'baizhu': 10000082,
  'lyney': 10000084,
  'lynette': 10000085,
  'freminet': 10000086,
  'wriothesley': 10000087,
  'charlotte': 10000088,
  'furina': 10000089,
  'chevreuse': 10000090,
  'navia': 10000091,
  'gaming': 10000092,
  'xianyun': 10000093,
  'chiori': 10000094,
  'arlecchino': 10000095,
  'sethos': 10000096,
  'clorinde': 10000097,
  'sigewinne': 10000098,
  'emilie': 10000099,
  'kachina': 10000100,
  'kinich': 10000101,
  'mualani': 10000102,
  'xilonen': 10000103,
  'chasca': 10000104,
  'ororon': 10000105,
  'mavuika': 10000106,
  'citlali': 10000107,
  'lanyan': 10000108,
  'lan yan': 10000108,
  'mizuki': 10000109,
  'yumemizukimizuki': 10000109,
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
    .replace(/['']s\b/g, 's')
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
