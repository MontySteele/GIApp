import { db } from '@/db/schema';
import { fetchWithRetry, getUserFriendlyError } from '@/lib/utils/fetchWithRetry';
import { toGoodCharacterKey, toGoodWeaponKey } from '@/lib/characterData';
import type { Character, SlotKey } from '@/types';
import { ENKA_CHARACTERS, ENKA_SKILL_ORDER, ENKA_TRAVELER_ELEMENTS, ENKA_WEAPON_NAMES } from '@/lib/data/enkaData.generated';

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

// Enka's store has no base entries for the Manekin/Manekina, only per-element depots
const EXTRA_CHARACTER_NAMES: Record<number, string> = {
  10000117: 'Manekin',
  10000118: 'Manekina',
};

const TRAVELER_AVATAR_IDS = new Set([10000005, 10000007]);

/**
 * Resolve an Enka avatar to the GOOD-style key the other importers store,
 * so an Enka import updates the same roster entry as a GOOD or HoYoLAB import.
 */
export function resolveEnkaCharacterKey(avatarId: number, skillDepotId?: number): string {
  if (TRAVELER_AVATAR_IDS.has(avatarId)) {
    const element = skillDepotId !== undefined ? ENKA_TRAVELER_ELEMENTS[skillDepotId] : undefined;
    return element ? `Traveler${element}` : 'Traveler';
  }
  const name = ENKA_CHARACTERS[avatarId]?.name ?? EXTRA_CHARACTER_NAMES[avatarId];
  return name ? toGoodCharacterKey(name) : `Unknown_${avatarId}`;
}

/**
 * skillLevelMap is keyed by skill ID and can include extra skills (Ayaka's
 * dash, for example), so read talents in the character's published order.
 */
export function mapEnkaTalents(avatar: Pick<EnkaAvatar, 'avatarId' | 'skillDepotId' | 'skillLevelMap'>): Character['talent'] {
  const levels = avatar.skillLevelMap ?? {};
  const order =
    ENKA_SKILL_ORDER[`${avatar.avatarId}-${avatar.skillDepotId}`] ?? ENKA_SKILL_ORDER[String(avatar.avatarId)];
  const [auto, skill, burst] = order
    ? order.map((skillId) => levels[skillId])
    : Object.values(levels); // Characters newer than the generated data
  return { auto: auto || 1, skill: skill || 1, burst: burst || 1 };
}

// Prop type IDs
const PROP_TYPES = {
  LEVEL: 4001,
  ASCENSION: 1002,
  EXP: 1001,
};

// Slot mapping with type-safe values
const EQUIP_TYPE_MAP: Record<string, SlotKey> = {
  EQUIP_BRACER: 'flower',
  EQUIP_NECKLACE: 'plume',
  EQUIP_SHOES: 'sands',
  EQUIP_RING: 'goblet',
  EQUIP_DRESS: 'circlet',
};

/**
 * Safely converts Enka equip type to SlotKey
 */
function toSlotKey(equipType: string | undefined): SlotKey {
  return EQUIP_TYPE_MAP[equipType || ''] || 'flower';
}

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
      const characterKey = resolveEnkaCharacterKey(avatar.avatarId, avatar.skillDepotId);

      // Extract level and ascension
      const level = parseInt(avatar.propMap[PROP_TYPES.LEVEL]?.ival || '1');
      const ascension = parseInt(avatar.propMap[PROP_TYPES.ASCENSION]?.ival || '0');

      // Extract constellation
      const constellation = avatar.talentIdList?.length || 0;

      const talent = mapEnkaTalents(avatar);

      // Extract weapon
      const weaponEquip = avatar.equipList.find((e) => e.weapon);
      if (!weaponEquip || !weaponEquip.weapon) {
        console.warn(`No weapon found for ${characterKey}, skipping`);
        continue;
      }

      const weaponName = ENKA_WEAPON_NAMES[weaponEquip.itemId];
      const affixValues = Object.values(weaponEquip.weapon.affixMap || {});
      const affixLevel = affixValues[0];
      const weapon = {
        key: weaponName ? toGoodWeaponKey(weaponName) : `Unknown Weapon (ID: ${weaponEquip.itemId})`,
        level: weaponEquip.weapon.level || 1,
        ascension: weaponEquip.weapon.promoteLevel || 0,
        refinement: typeof affixLevel === 'number' ? affixLevel + 1 : 1,
      };

      // Extract artifacts
      const artifactEquips = avatar.equipList.filter((e) => e.reliquary);
      const artifacts = artifactEquips.map((equip) => ({
        setKey: equip.flat.setNameTextMapHash || 'Unknown Set',
        slotKey: toSlotKey(equip.flat.equipType),
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
        avatarId: avatar.avatarId,
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

  // If direct fetch fails due to CORS or server error, try CORS proxy
  if (!response || (response.status >= 500)) {
    console.warn('Direct fetch failed, trying CORS proxy...');
    try {
      response = await fetchWithRetry(proxyUrl);
    } catch (error) {
      if (!primaryError) primaryError = error;
    }
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
    throw new Error(getUserFriendlyError(response));
  }

  const data = (await response.json()) as EnkaResponse;
  await cacheEnka(uid, data);
  return data;
}
