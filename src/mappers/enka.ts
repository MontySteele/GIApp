import { db } from '@/db/schema';
import type { Character } from '@/types';

// Enka.network API types (simplified)
export interface EnkaResponse {
  playerInfo: {
    nickname: string;
    level: number;
    signature: string;
    nameCardId: number;
    finishAchievementNum: number;
    towerFloorIndex: number;
    towerLevelIndex: number;
    showAvatarInfoList: EnkaShowcase[];
  };
  avatarInfoList?: EnkaAvatar[];
  ttl: number;
  uid: string;
}

const ENKA_CACHE_PREFIX = 'enka:';
const DEFAULT_CACHE_TTL_SECONDS = 300;
const RETRY_DELAYS_MS = [0, 500, 1000];
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

function buildCacheKey(uid: string) {
  return `${ENKA_CACHE_PREFIX}${uid}`;
}

function getExpiration(ttlSeconds?: number) {
  const ttl = (ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS) * 1000;
  return new Date(Date.now() + ttl).toISOString();
}

async function getCachedEnka(uid: string): Promise<EnkaResponse | null> {
  const cacheKey = buildCacheKey(uid);
  const cached = await db.externalCache.where('cacheKey').equals(cacheKey).first();
  if (!cached) return null;

  const isExpired = new Date(cached.expiresAt).getTime() <= Date.now();
  if (isExpired) {
    await db.externalCache.delete(cached.id);
    return null;
  }

  return cached.data as EnkaResponse;
}

async function cacheEnka(uid: string, data: EnkaResponse) {
  const cacheKey = buildCacheKey(uid);
  const existing = await db.externalCache.where('cacheKey').equals(cacheKey).first();
  const now = new Date().toISOString();
  const expiresAt = getExpiration(data.ttl);

  await db.externalCache.put({
    id: existing?.id ?? crypto.randomUUID(),
    cacheKey,
    data,
    fetchedAt: now,
    expiresAt,
  });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number) {
  return RETRYABLE_STATUSES.includes(status);
}

async function fetchWithRetry(url: string) {
  let lastError: unknown;
  let response: Response | null = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }

    try {
      response = await fetch(url);
    } catch (error) {
      lastError = error;
      continue;
    }

    if (response.ok || !shouldRetry(response.status)) {
      return response;
    }
  }

  if (response) {
    return response;
  }

  throw lastError ?? new Error('Network request failed');
}

export interface EnkaShowcase {
  avatarId: number;
  level: number;
}

export interface EnkaAvatar {
  avatarId: number;
  propMap: {
    [key: string]: {
      type: number;
      ival: string;
      val?: string;
    };
  };
  talentIdList?: number[];
  fightPropMap: {
    [key: string]: number;
  };
  skillDepotId: number;
  inherentProudSkillList: number[];
  skillLevelMap: {
    [key: string]: number;
  };
  equipList: EnkaEquip[];
  fetterInfo: {
    expLevel: number;
  };
}

export interface EnkaEquip {
  itemId: number;
  reliquary?: {
    level: number;
    mainPropId: number;
    appendPropIdList: number[];
  };
  flat: {
    nameTextMapHash: string;
    setNameTextMapHash?: string;
    rankLevel: number;
    reliquaryMainstat?: {
      mainPropId: string;
      statValue: number;
    };
    reliquarySubstats?: Array<{
      appendPropId: string;
      statValue: number;
    }>;
    itemType: string;
    icon: string;
    equipType?: string;
    weaponStats?: Array<{
      appendPropId: string;
      statValue: number;
    }>;
  };
  weapon?: {
    level: number;
    promoteLevel: number;
    affixMap: {
      [key: string]: number;
    };
  };
}

// Character ID to Key mapping (simplified - would need full mapping in production)
const CHARACTER_ID_MAP: { [key: number]: string } = {
  10000002: 'Kamisato Ayaka',
  10000003: 'Jean',
  10000005: 'Traveler',
  10000006: 'Lisa',
  10000007: 'Traveler',
  10000014: 'Barbara',
  10000015: 'Kaeya',
  10000016: 'Diluc',
  10000020: 'Razor',
  10000021: 'Amber',
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
  10000034: 'Noelle',
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
  10000046: 'Hu Tao',
  10000047: 'Kaedehara Kazuha',
  10000048: 'Yanfei',
  10000049: 'Yoimiya',
  10000050: 'Thoma',
  10000051: 'Eula',
  10000052: 'Raiden Shogun',
  10000053: 'Sayu',
  10000054: 'Sangonomiya Kokomi',
  10000055: 'Gorou',
  10000056: 'Kujou Sara',
  10000057: 'Arataki Itto',
  10000058: 'Yae Miko',
  10000059: 'Shikanoin Heizou',
  10000060: 'Yelan',
  10000061: 'Kirara',
  10000062: 'Aloy',
  10000063: 'Shenhe',
  10000064: 'Yun Jin',
  10000065: 'Kuki Shinobu',
  10000066: 'Kamisato Ayato',
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
  10000093: 'Xianyun',
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
  10000105: 'Olorun',
  10000106: 'Mavuika',
  10000107: 'Citlali',
  10000108: 'Lan Yan',
  10000109: 'Yumemizuki Mizuki',
  10000110: 'Iansan',
  10000111: 'Varesa',
  10000112: 'Escoffier',
  10000113: 'Ifa',
  10000114: 'Skirk',
  10000115: 'Dahlia',
  10000116: 'Ineffa',
  10000119: 'Lauma',
  10000120: 'Flins',
  10000121: 'Aino',
  10000122: 'Nefer',
  10000123: 'Durin',
  10000124: 'Jahoda',
};

// Weapon ID to name mapping
const WEAPON_ID_MAP: { [key: number]: string } = {
  // 5-Star Swords
  11501: 'Mistsplitter Reforged',
  11502: 'Freedom-Sworn',
  11503: 'Song of Broken Pines',
  11504: 'Primordial Jade Cutter',
  11505: 'Haran Geppaku Futsu',
  11509: 'Key of Khaj-Nisut',
  11510: 'Light of Foliar Incision',
  11511: 'Splendor of Tranquil Waters',
  11512: 'Absolution',
  11513: 'Uraku Misugiri',
  11514: 'Uraku Misugiri',
  11515: 'Absolution',
  11516: 'Peak Patrol Song',
  11517: 'Azurelight',
  11518: 'Athame Artis',
  12501: 'Aquila Favonia',
  12502: 'Skyward Blade',
  12505: 'Primordial Jade Greatsword',
  // 4-Star Swords
  11401: 'Favonius Sword',
  11402: 'The Flute',
  11403: 'Sacrificial Sword',
  11404: 'Royal Longsword',
  11405: 'Lion\'s Roar',
  11406: 'Prototype Rancour',
  11407: 'Iron Sting',
  11408: 'Blackcliff Longsword',
  11409: 'The Black Sword',
  11410: 'The Alley Flash',
  11412: 'Sword of Descension',
  11413: 'Festering Desire',
  11414: 'Amenoma Kageuchi',
  11415: 'Cinnabar Spindle',
  11416: 'Kagotsurube Isshin',
  11417: 'Sapwood Blade',
  11418: 'Xiphos\' Moonlight',
  11422: 'Toukabou Shigure',
  11424: 'Wolf-Fang',
  11425: 'Finale of the Deep',
  11426: 'Fleuve Cendre Ferryman',
  11427: 'The Dockhand\'s Assistant',
  11428: 'Sword of Narzissenkreuz',
  11429: 'Sturdy Bone',
  // 5-Star Claymores
  12501: 'Wolf\'s Gravestone',
  12502: 'Skyward Pride',
  12503: 'The Unforged',
  12504: 'Song of Broken Pines',
  12505: 'Primordial Jade Greatsword',
  12510: 'Redhorn Stonethresher',
  12511: 'Beacon of the Reed Sea',
  12512: 'Verdict',
  12513: 'Fang of the Mountain King',
  12514: 'A Thousand Blazing Suns',
  // 4-Star Claymores
  12401: 'Favonius Greatsword',
  12402: 'The Bell',
  12403: 'Sacrificial Greatsword',
  12404: 'Royal Greatsword',
  12405: 'Rainslasher',
  12406: 'Prototype Archaic',
  12407: 'Whiteblind',
  12408: 'Blackcliff Slasher',
  12409: 'Serpent Spine',
  12410: 'Lithic Blade',
  12411: 'Snow-Tombed Starsilver',
  12412: 'Luxurious Sea-Lord',
  12414: 'Katsuragikiri Nagamasa',
  12415: 'Makhaira Aquamarine',
  12416: 'Akuoumaru',
  12417: 'Forest Regalia',
  12418: 'Mailed Flower',
  12424: 'Talking Stick',
  12425: 'Tidal Shadow',
  12426: 'Ultimate Overlord\'s Mega Magic Sword',
  12427: 'Portable Power Saw',
  // 5-Star Polearms
  13501: 'Staff of Homa',
  13502: 'Skyward Spine',
  13504: 'Vortex Vanquisher',
  13505: 'Primordial Jade Winged-Spear',
  13506: 'Calamity Queller',
  13507: 'Engulfing Lightning',
  13509: 'Staff of the Scarlet Sands',
  13511: 'Lumidouce Elegy',
  13512: 'Crimson Moon\'s Semblance',
  13513: 'Lumidouce Elegy',
  13514: 'Symphonist of Scents',
  13515: 'Fractured Halo',
  13516: 'Bloodsoaked Ruins',
  // 4-Star Polearms
  13401: 'Favonius Lance',
  13402: 'Dragon\'s Bane',
  13403: 'Prototype Starglitter',
  13404: 'Crescent Pike',
  13405: 'Blackcliff Pole',
  13406: 'Deathmatch',
  13407: 'Lithic Spear',
  13408: 'Royal Spear',
  13409: '"The Catch"',
  13414: 'Kitain Cross Spear',
  13415: 'Wavebreaker\'s Fin',
  13416: 'Moonpiercer',
  13417: 'Missive Windspear',
  13419: 'Ballad of the Fjords',
  13424: 'Rightful Reward',
  13425: 'Prospector\'s Drill',
  13426: 'Dialogues of the Desert Sages',
  13427: 'Prospector\'s Drill',
  // 5-Star Catalysts
  14501: 'Skyward Atlas',
  14502: 'Lost Prayer to the Sacred Winds',
  14504: 'Memory of Dust',
  14505: 'Everlasting Moonglow',
  14506: 'Kagura\'s Verity',
  14509: 'A Thousand Floating Dreams',
  14511: 'Tulaytullah\'s Remembrance',
  14512: 'Cashflow Supervision',
  14513: 'Tome of the Eternal Flow',
  14514: 'Crane\'s Echoing Call',
  14515: 'Surf\'s Up',
  14516: 'Surf\'s Up',
  14517: 'Starcaller\'s Watch',
  14518: 'Sunny Morning Sleep-In',
  14519: 'Vivid Notions',
  14520: 'Nightweaver\'s Looking Glass',
  14521: 'Reliquary of Truth',
  // 4-Star Catalysts
  14401: 'Favonius Codex',
  14402: 'The Widsith',
  14403: 'Sacrificial Fragments',
  14404: 'Royal Grimoire',
  14405: 'Solar Pearl',
  14406: 'Prototype Amber',
  14407: 'Mappa Mare',
  14408: 'Blackcliff Agate',
  14409: 'Eye of Perception',
  14410: 'Wine and Song',
  14412: 'Frostbearer',
  14413: 'Dodoco Tales',
  14414: 'Hakushin Ring',
  14415: 'Oathsworn Eye',
  14416: 'Wandering Evenstar',
  14417: 'Fruit of Fulfillment',
  14424: 'Flowing Purity',
  14425: 'Ballad of the Boundless Blue',
  14426: 'Sacrificial Jade',
  14427: 'Ash-Graven Drinking Horn',
  // 5-Star Bows
  15501: 'Skyward Harp',
  15502: 'Amos\' Bow',
  15503: 'Elegy for the End',
  15507: 'Polar Star',
  15508: 'Aqua Simulacra',
  15509: 'Thundering Pulse',
  15511: 'Hunter\'s Path',
  15512: 'The First Great Magic',
  15513: 'Silvershower Heartstrings',
  15514: 'Astral Vulture\'s Crimson Plumage',
  15515: 'The Daybreak Chronicles',
  // 4-Star Bows
  15401: 'Favonius Warbow',
  15402: 'The Stringless',
  15403: 'Sacrificial Bow',
  15404: 'Royal Bow',
  15405: 'Rust',
  15406: 'Prototype Crescent',
  15407: 'Compound Bow',
  15408: 'Blackcliff Warbow',
  15409: 'The Viridescent Hunt',
  15410: 'Alley Hunter',
  15411: 'Fading Twilight',
  15412: 'Mitternachts Waltz',
  15413: 'Windblume Ode',
  15414: 'Hamayumi',
  15415: 'Predator',
  15416: 'Mouun\'s Moon',
  15417: 'King\'s Squire',
  15418: 'End of the Line',
  15419: 'Ibis Piercer',
  15424: 'Scion of the Blazing Sun',
  15425: 'Song of Stillness',
  15426: 'Cloudforged',
  15427: 'Range Gauge',
  // 3-Star weapons
  11301: 'Cool Steel',
  11302: 'Harbinger of Dawn',
  11303: 'Traveler\'s Handy Sword',
  11304: 'Dark Iron Sword',
  11305: 'Fillet Blade',
  11306: 'Skyrider Sword',
  12301: 'Ferrous Shadow',
  12302: 'Bloodtainted Greatsword',
  12303: 'White Iron Greatsword',
  12304: 'Quartz',
  12305: 'Debate Club',
  12306: 'Skyrider Greatsword',
  13301: 'Halberd',
  13302: 'White Tassel',
  13303: 'Black Tassel',
  14301: 'Magic Guide',
  14302: 'Thrilling Tales of Dragon Slayers',
  14303: 'Otherworldly Story',
  14304: 'Emerald Orb',
  14305: 'Twin Nephrite',
  15301: 'Raven Bow',
  15302: 'Sharpshooter\'s Oath',
  15303: 'Recurve Bow',
  15304: 'Slingshot',
  15305: 'Messenger',
  15306: 'Ebony Bow',
};

// Prop type IDs
const PROP_TYPES = {
  LEVEL: 4001,
  ASCENSION: 1002,
  EXP: 1001,
};

// Slot mapping
const EQUIP_TYPE_MAP: { [key: string]: string } = {
  EQUIP_BRACER: 'flower',
  EQUIP_NECKLACE: 'plume',
  EQUIP_SHOES: 'sands',
  EQUIP_RING: 'goblet',
  EQUIP_DRESS: 'circlet',
};

/**
 * Convert Enka.network response to internal Character format
 */
export function fromEnka(enkaResponse: EnkaResponse): Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (!enkaResponse.avatarInfoList || enkaResponse.avatarInfoList.length === 0) {
    throw new Error('No character data found in showcase');
  }

  const characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const avatar of enkaResponse.avatarInfoList) {
    try {
      const characterKey = CHARACTER_ID_MAP[avatar.avatarId] || `Unknown_${avatar.avatarId}`;

      // Extract level and ascension
      const level = parseInt(avatar.propMap[PROP_TYPES.LEVEL]?.ival || '1');
      const ascension = parseInt(avatar.propMap[PROP_TYPES.ASCENSION]?.ival || '0');

      // Extract constellation
      const constellation = avatar.talentIdList?.length || 0;

      // Extract talent levels
      const skillLevels = Object.values(avatar.skillLevelMap);
      const talent = {
        auto: skillLevels[0] || 1,
        skill: skillLevels[1] || 1,
        burst: skillLevels[2] || 1,
      };

      // Extract weapon
      const weaponEquip = avatar.equipList.find((e) => e.weapon);
      if (!weaponEquip || !weaponEquip.weapon) {
        console.warn(`No weapon found for ${characterKey}, skipping`);
        continue;
      }

      const weaponName = WEAPON_ID_MAP[weaponEquip.itemId] || `Unknown Weapon (ID: ${weaponEquip.itemId})`;
      const weapon = {
        key: weaponName,
        level: weaponEquip.weapon.level || 1,
        ascension: weaponEquip.weapon.promoteLevel || 0,
        refinement: Object.values(weaponEquip.weapon.affixMap || {})[0] + 1 || 1,
      };

      // Extract artifacts
      const artifactEquips = avatar.equipList.filter((e) => e.reliquary);
      const artifacts = artifactEquips.map((equip) => ({
        setKey: equip.flat.setNameTextMapHash || 'Unknown Set',
        slotKey: (EQUIP_TYPE_MAP[equip.flat.equipType || ''] || 'flower') as any,
        level: equip.reliquary?.level || 0,
        rarity: equip.flat.rankLevel || 5,
        mainStatKey: equip.flat.reliquaryMainstat?.mainPropId || 'hp',
        substats:
          equip.flat.reliquarySubstats?.map((sub) => ({
            key: sub.appendPropId || 'unknown',
            value: sub.statValue || 0,
          })) || [],
      }));

      characters.push({
        key: characterKey,
        level,
        ascension,
        constellation,
        talent,
        weapon,
        artifacts,
        notes: `Imported from Enka.network (UID: ${enkaResponse.uid})`,
        priority: 'unbuilt',
        teamIds: [],
      });
    } catch (err) {
      console.error(`Failed to parse character ${avatar.avatarId}:`, err);
      continue;
    }
  }

  return characters;
}

/**
 * Fetch character data from Enka.network
 */
export async function fetchEnkaData(uid: string): Promise<EnkaResponse> {
  const cached = await getCachedEnka(uid);
  if (cached) {
    return cached;
  }

  const corsProxy = 'https://corsproxy.io/?';
  // Try direct fetch first (Enka supports CORS for most origins)
  const enkaUrl = `https://enka.network/api/uid/${uid}`;
  const proxyUrl = `${corsProxy}${encodeURIComponent(enkaUrl)}`;

  let response: Response | null = null;
  let primaryError: unknown;

  try {
    response = await fetchWithRetry(enkaUrl);
  } catch (error) {
    primaryError = error;
  }

  if (!response || (response.status >= 500 && shouldRetry(response.status))) {
    // If direct fetch fails due to CORS, try CORS proxy
    console.warn('Direct fetch failed, trying CORS proxy...');
    response = await fetchWithRetry(proxyUrl);
  }

  if (!response) {
    throw primaryError instanceof Error ? primaryError : new Error('Failed to fetch data');
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('UID not found. Make sure your character showcase is public in-game.');
    }
    if (response.status === 424) {
      throw new Error('Game server maintenance. Please try again later.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`Failed to fetch data: ${response.statusText || response.status}`);
  }

  const data = (await response.json()) as EnkaResponse;
  await cacheEnka(uid, data);
  return data;
}
