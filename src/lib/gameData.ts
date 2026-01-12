// Artifact Set Name Mappings
// Maps setKey IDs to readable names
// Includes both game IDs and Enka.Network text map hashes
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  // Game IDs (from game files)
  // Mondstadt
  '14001': 'Gladiator\'s Finale',
  '14002': 'Wanderer\'s Troupe',
  '15001': 'Noblesse Oblige',
  '15002': 'Bloodstained Chivalry',
  '15003': 'Maiden Beloved',
  '15005': 'Viridescent Venerer',
  '15006': 'Crimson Witch of Flames',
  '15007': 'Lavawalker',
  '15008': 'Thundering Fury',
  '15009': 'Thundersoother',
  '15010': 'Blizzard Strayer',
  '15011': 'Heart of Depth',
  '15012': 'Archaic Petra',
  '15013': 'Retracing Bolide',

  // Liyue
  '15014': 'Pale Flame',
  '15015': 'Tenacity of the Millelith',
  '15016': 'Shimenawa\'s Reminiscence',
  '15017': 'Emblem of Severed Fate',

  // Inazuma
  '15018': 'Husk of Opulent Dreams',
  '15019': 'Ocean-Hued Clam',
  '15020': 'Vermillion Hereafter',
  '15021': 'Echoes of an Offering',

  // Sumeru
  '15022': 'Deepwood Memories',
  '15023': 'Gilded Dreams',
  '15024': 'Desert Pavilion Chronicle',
  '15025': 'Flower of Paradise Lost',

  // Fontaine
  '15026': 'Nymph\'s Dream',
  '15027': 'Vourukasha\'s Glow',
  '15028': 'Marechaussee Hunter',
  '15029': 'Golden Troupe',
  '15030': 'Song of Days Past',
  '15031': 'Nighttime Whispers in the Echoing Woods',

  // Natlan
  '15032': 'Fragment of Harmonic Whimsy',
  '15033': 'Unfinished Reverie',
  '15034': 'Scroll of the Hero of Cinder City',
  '15035': 'Obsidian Codex',

  // Enka.Network Text Map Hashes (from setNameTextMapHash)
  // These are the actual hash IDs used by Enka
  '2051947378': 'Gladiator\'s Finale',
  '1024188507': 'Wanderer\'s Troupe',
  '3024287978': 'Noblesse Oblige',
  '3336292330': 'Bloodstained Chivalry',
  '4145306051': 'Maiden Beloved',
  '3041123219': 'Viridescent Venerer',
  '464239252': 'Crimson Witch of Flames',
  '1074991850': 'Lavawalker',
  '2381195739': 'Thundering Fury',
  '1813191794': 'Thundersoother',
  '1978456313': 'Blizzard Strayer',
  '2550611210': 'Heart of Depth',
  '3113112362': 'Archaic Petra',
  '2365306298': 'Retracing Bolide',
  '4054530851': 'Pale Flame',
  '2883883603': 'Tenacity of the Millelith',
  '4144069251': 'Shimenawa\'s Reminiscence',
  '2512309395': 'Emblem of Severed Fate',
  '1558036915': 'Husk of Opulent Dreams',
  '1024664819': 'Ocean-Hued Clam',
  '2538235059': 'Vermillion Hereafter',
  '4020789283': 'Echoes of an Offering',
  '1937844530': 'Deepwood Memories',
  '52218259': 'Gilded Dreams',
  '572447378': 'Desert Pavilion Chronicle',
  '1087031355': 'Flower of Paradise Lost',
  '2206398859': 'Nymph\'s Dream',
  '3073024899': 'Vourukasha\'s Glow',
  '2422508786': 'Marechaussee Hunter',
  '2276480763': 'Golden Troupe',
  '1515064307': 'Song of Days Past',
  '4161025135': 'Nighttime Whispers in the Echoing Woods',
  '4233298586': 'Fragment of Harmonic Whimsy',
  '1978422363': 'Unfinished Reverie',
  '3199794867': 'Scroll of the Hero of Cinder City',
  '2309458426': 'Obsidian Codex',
  '83115355': 'Maiden Beloved',
  '156294403': 'Heart of Depth',
  '279470883': 'Nighttime Whispers in the Echoing Woods',
  '352459163': 'Unfinished Reverie',
  '862591315': 'Pale Flame',
  '933076627': 'Blizzard Strayer',
  '1249831867': 'Marechaussee Hunter',
  '1337666507': 'Tenacity of the Millelith',
  '1438974835': 'Retracing Bolide',
  '1492570003': 'Fragment of Harmonic Whimsy',
  '1524173875': 'Crimson Witch of Flames',
  '1541919827': 'Bloodstained Chivalry',
  '1562601179': 'Viridescent Venerer',
  '1632377563': 'Lavawalker',
  '1675079283': 'Deepwood Memories',
  '1751039235': 'Noblesse Oblige',
  '1756609915': 'Ocean-Hued Clam',
  '1774579403': 'Obsidian Codex',
  '1873342283': 'Thundersoother',
  '2040573235': 'Archaic Petra',
  '2538235187': 'Desert Pavilion Chronicle',
  '2546254811': 'Husk of Opulent Dreams',
  '2803305851': 'Song of Days Past',
  '2949388203': 'Scroll of the Hero of Cinder City',
  '3094139291': 'Flower of Paradise Lost',
  '3410220315': 'Golden Troupe',
  '3626268211': 'Echoes of an Offering',
  '147298547': 'Wanderer\'s Troupe',
  '1212345779': 'Gladiator\'s Finale',

  // Also support direct string names (for test data and GOOD format)
  'Gladiator\'s Finale': 'Gladiator\'s Finale',
  'Wanderer\'s Troupe': 'Wanderer\'s Troupe',
  'Noblesse Oblige': 'Noblesse Oblige',
  'Bloodstained Chivalry': 'Bloodstained Chivalry',
  'Maiden Beloved': 'Maiden Beloved',
  'Viridescent Venerer': 'Viridescent Venerer',
  'Crimson Witch of Flames': 'Crimson Witch of Flames',
  'Lavawalker': 'Lavawalker',
  'Thundering Fury': 'Thundering Fury',
  'Thundersoother': 'Thundersoother',
  'Blizzard Strayer': 'Blizzard Strayer',
  'Heart of Depth': 'Heart of Depth',
  'Archaic Petra': 'Archaic Petra',
  'Retracing Bolide': 'Retracing Bolide',
  'Pale Flame': 'Pale Flame',
  'Tenacity of the Millelith': 'Tenacity of the Millelith',
  'Shimenawa\'s Reminiscence': 'Shimenawa\'s Reminiscence',
  'Emblem of Severed Fate': 'Emblem of Severed Fate',
  'Husk of Opulent Dreams': 'Husk of Opulent Dreams',
  'Ocean-Hued Clam': 'Ocean-Hued Clam',
  'Vermillion Hereafter': 'Vermillion Hereafter',
  'Echoes of an Offering': 'Echoes of an Offering',
  'Deepwood Memories': 'Deepwood Memories',
  'Gilded Dreams': 'Gilded Dreams',
  'Desert Pavilion Chronicle': 'Desert Pavilion Chronicle',
  'Flower of Paradise Lost': 'Flower of Paradise Lost',
  'Nymph\'s Dream': 'Nymph\'s Dream',
  'Vourukasha\'s Glow': 'Vourukasha\'s Glow',
  'Marechaussee Hunter': 'Marechaussee Hunter',
  'Golden Troupe': 'Golden Troupe',
  'Song of Days Past': 'Song of Days Past',
  'Nighttime Whispers in the Echoing Woods': 'Nighttime Whispers in the Echoing Woods',
  'Fragment of Harmonic Whimsy': 'Fragment of Harmonic Whimsy',
  'Unfinished Reverie': 'Unfinished Reverie',
  'Scroll of the Hero of Cinder City': 'Scroll of the Hero of Cinder City',
  'Obsidian Codex': 'Obsidian Codex',
};

// Stat Key to Display Name Mapping
// Maps FIGHT_PROP_* keys and other stat keys to readable names
export const STAT_NAMES: Record<string, string> = {
  // HP
  'FIGHT_PROP_HP': 'HP',
  'FIGHT_PROP_HP_PERCENT': 'HP%',
  'hp': 'HP',
  'hp_': 'HP%',

  // ATK
  'FIGHT_PROP_ATTACK': 'ATK',
  'FIGHT_PROP_ATTACK_PERCENT': 'ATK%',
  'atk': 'ATK',
  'atk_': 'ATK%',

  // DEF
  'FIGHT_PROP_DEFENSE': 'DEF',
  'FIGHT_PROP_DEFENSE_PERCENT': 'DEF%',
  'def': 'DEF',
  'def_': 'DEF%',

  // Elemental Mastery
  'FIGHT_PROP_ELEMENT_MASTERY': 'Elemental Mastery',
  'eleMas': 'Elemental Mastery',
  'em': 'Elemental Mastery',

  // Energy Recharge
  'FIGHT_PROP_CHARGE_EFFICIENCY': 'Energy Recharge',
  'enerRech_': 'Energy Recharge',
  'er': 'Energy Recharge',

  // Crit Rate
  'FIGHT_PROP_CRITICAL': 'CRIT Rate',
  'FIGHT_PROP_CRITICAL_HURT': 'CRIT DMG',
  'critRate_': 'CRIT Rate',
  'critDMG_': 'CRIT DMG',
  'cr': 'CRIT Rate',
  'cd': 'CRIT DMG',

  // Damage Bonuses
  'FIGHT_PROP_PHYSICAL_ADD_HURT': 'Physical DMG Bonus',
  'FIGHT_PROP_FIRE_ADD_HURT': 'Pyro DMG Bonus',
  'FIGHT_PROP_WATER_ADD_HURT': 'Hydro DMG Bonus',
  'FIGHT_PROP_GRASS_ADD_HURT': 'Dendro DMG Bonus',
  'FIGHT_PROP_ELEC_ADD_HURT': 'Electro DMG Bonus',
  'FIGHT_PROP_WIND_ADD_HURT': 'Anemo DMG Bonus',
  'FIGHT_PROP_ICE_ADD_HURT': 'Cryo DMG Bonus',
  'FIGHT_PROP_ROCK_ADD_HURT': 'Geo DMG Bonus',

  'physical_dmg_': 'Physical DMG Bonus',
  'pyro_dmg_': 'Pyro DMG Bonus',
  'hydro_dmg_': 'Hydro DMG Bonus',
  'dendro_dmg_': 'Dendro DMG Bonus',
  'electro_dmg_': 'Electro DMG Bonus',
  'anemo_dmg_': 'Anemo DMG Bonus',
  'cryo_dmg_': 'Cryo DMG Bonus',
  'geo_dmg_': 'Geo DMG Bonus',

  // Healing Bonus
  'FIGHT_PROP_HEAL_ADD': 'Healing Bonus',
  'heal_': 'Healing Bonus',
};

// Slot Key to Display Name Mapping
export const SLOT_NAMES: Record<string, string> = {
  'flower': 'Flower of Life',
  'plume': 'Plume of Death',
  'sands': 'Sands of Eon',
  'goblet': 'Goblet of Eonothem',
  'circlet': 'Circlet of Logos',
};

// GOOD/GO stat key mappings
const STAT_GOOD_KEYS: Record<string, string> = {
  // HP
  'FIGHT_PROP_HP': 'hp',
  'FIGHT_PROP_HP_PERCENT': 'hp_',
  'hp': 'hp',
  'hp_': 'hp_',

  // ATK
  'FIGHT_PROP_ATTACK': 'atk',
  'FIGHT_PROP_ATTACK_PERCENT': 'atk_',
  'atk': 'atk',
  'atk_': 'atk_',

  // DEF
  'FIGHT_PROP_DEFENSE': 'def',
  'FIGHT_PROP_DEFENSE_PERCENT': 'def_',
  'def': 'def',
  'def_': 'def_',

  // Elemental Mastery
  'FIGHT_PROP_ELEMENT_MASTERY': 'eleMas',
  'eleMas': 'eleMas',
  'em': 'eleMas',

  // Energy Recharge
  'FIGHT_PROP_CHARGE_EFFICIENCY': 'enerRech_',
  'enerRech_': 'enerRech_',
  'er': 'enerRech_',

  // Crit
  'FIGHT_PROP_CRITICAL': 'critRate_',
  'FIGHT_PROP_CRITICAL_HURT': 'critDMG_',
  'critRate_': 'critRate_',
  'critDMG_': 'critDMG_',
  'critRate': 'critRate_',
  'critDMG': 'critDMG_',
  'cr': 'critRate_',
  'cd': 'critDMG_',

  // Damage Bonuses
  'FIGHT_PROP_PHYSICAL_ADD_HURT': 'physical_dmg_',
  'FIGHT_PROP_FIRE_ADD_HURT': 'pyro_dmg_',
  'FIGHT_PROP_WATER_ADD_HURT': 'hydro_dmg_',
  'FIGHT_PROP_GRASS_ADD_HURT': 'dendro_dmg_',
  'FIGHT_PROP_ELEC_ADD_HURT': 'electro_dmg_',
  'FIGHT_PROP_WIND_ADD_HURT': 'anemo_dmg_',
  'FIGHT_PROP_ICE_ADD_HURT': 'cryo_dmg_',
  'FIGHT_PROP_ROCK_ADD_HURT': 'geo_dmg_',

  'physical_dmg_': 'physical_dmg_',
  'pyro_dmg_': 'pyro_dmg_',
  'hydro_dmg_': 'hydro_dmg_',
  'dendro_dmg_': 'dendro_dmg_',
  'electro_dmg_': 'electro_dmg_',
  'anemo_dmg_': 'anemo_dmg_',
  'cryo_dmg_': 'cryo_dmg_',
  'geo_dmg_': 'geo_dmg_',

  // Healing Bonus
  'FIGHT_PROP_HEAL_ADD': 'heal_',
  'heal_': 'heal_',
};

const toPascalCase = (value: string): string =>
  value
    .replace(/['’]s\b/g, 's')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * Formats an artifact set key to a readable name
 */
export function formatArtifactSetName(setKey: string): string {
  return ARTIFACT_SET_NAMES[setKey] || setKey;
}

/**
 * Formats an artifact set key to a GOOD/GO-compatible key
 */
export function toGoodArtifactSetKey(setKey: string): string {
  const displayName = ARTIFACT_SET_NAMES[setKey] || setKey;
  if (!displayName) {
    return setKey;
  }

  if (/[^A-Za-z0-9]/.test(displayName)) {
    return toPascalCase(displayName);
  }

  return displayName;
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
 * Formats a stat key to a readable name
 */
export function formatStatName(statKey: string): string {
  return STAT_NAMES[statKey] || statKey;
}

/**
 * Formats a stat key to a GOOD/GO-compatible key
 */
export function toGoodStatKey(statKey: string): string {
  return STAT_GOOD_KEYS[statKey] || statKey;
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
 * Formats a slot key to a readable name
 */
export function formatSlotName(slotKey: string): string {
  return SLOT_NAMES[slotKey] || slotKey;
}

/**
 * Formats a stat value with appropriate precision and unit
 */
export function formatStatValue(statKey: string, value: number): string {
  const name = formatStatName(statKey);

  // Percentage stats
  if (name.includes('%') || name.includes('Bonus') || name.includes('Recharge')) {
    return `${value.toFixed(1)}%`;
  }

  // Flat stats
  return Math.round(value).toString();
}

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
