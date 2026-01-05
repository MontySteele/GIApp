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
  10000088: 'Neuvillette',
  10000089: 'Charlotte',
  10000090: 'Furina',
  10000091: 'Chevreuse',
  10000092: 'Navia',
  10000093: 'Gaming',
  10000094: 'Xianyun',
  10000095: 'Chiori',
  10000096: 'Arlecchino',
  10000097: 'Sethos',
  10000098: 'Clorinde',
  10000099: 'Sigewinne',
  10000100: 'Emilie',
  10000101: 'Kachina',
  10000102: 'Kinich',
  10000103: 'Mualani',
  10000104: 'Xilonen',
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

      const weapon = {
        key: weaponEquip.flat.nameTextMapHash || 'Unknown Weapon',
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
  const response = await fetch(`https://enka.network/api/uid/${uid}`);

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
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.json();
}
