/**
 * HoYoLAB Battle Chronicle Mapper
 *
 * Fetches the full character roster (levels, constellations, talents, weapons,
 * and equipped artifacts with substats) from the HoYoLAB Battle Chronicle API
 * and converts it to the internal Character format.
 *
 * Unlike Enka (showcase-only) this covers every character on the account, and
 * unlike Irminsul it needs no game client — data comes from HoYoverse servers,
 * so it works for console players. Only equipped gear is available; unequipped
 * inventory still requires a scanner import.
 *
 * The network call runs through the Tauri backend (`fetch_hoyolab_characters`)
 * because browsers cannot attach the HoYoLAB login cookie to a cross-site fetch.
 */

import type { Artifact, Character, SlotKey, Substat } from '@/types';
import {
  toGoodArtifactSetKey,
  toGoodCharacterKey,
  toGoodWeaponKey,
} from '@/lib/gameData';

// ============================================
// HoYoLAB API response types (subset we consume)
// ============================================

export interface HoyolabPropInfo {
  property_type?: number;
  name?: string;
  filter_name?: string;
}

export interface HoyolabArtifactProperty {
  property_type: number;
  value: string;
  times?: number;
}

export interface HoyolabRelicSet {
  id?: number;
  name?: string;
}

export interface HoyolabRelic {
  id?: number;
  name?: string;
  pos: number;
  rarity: number;
  level: number;
  set?: HoyolabRelicSet;
  main_property?: HoyolabArtifactProperty;
  sub_property_list?: HoyolabArtifactProperty[];
}

export interface HoyolabWeapon {
  id?: number;
  name?: string;
  rarity?: number;
  level?: number;
  /** Refinement rank, 1-5 */
  affix_level?: number;
  /** Ascension phase, 0-6 */
  promote_level?: number;
}

export interface HoyolabSkill {
  skill_id?: number;
  /** 1 = normal attack, 2 = elemental skill, 3 = elemental burst */
  skill_type?: number;
  level?: number;
  max_level?: number;
  name?: string;
}

export interface HoyolabCharacterBase {
  id?: number;
  name?: string;
  level?: number;
  rarity?: number;
  element?: string;
  actived_constellation_num?: number;
  weapon?: HoyolabWeapon;
}

/**
 * One entry of `data.list` from character/detail. Depending on API version the
 * character fields are either flattened onto the entry or nested under `base`.
 */
export interface HoyolabDetailEntry extends HoyolabCharacterBase {
  base?: HoyolabCharacterBase;
  weapon?: HoyolabWeapon;
  relics?: HoyolabRelic[];
  skills?: HoyolabSkill[];
  constellations?: Array<{ is_actived?: boolean }>;
}

export interface HoyolabFetchResult {
  list: HoyolabDetailEntry[];
  property_map?: Record<string, HoyolabPropInfo>;
}

// ============================================
// Server / cookie helpers
// ============================================

/** Genshin UID leading digit → HoYoLAB server region. 'cn' marks miyoushe accounts. */
export function deriveServerFromUid(uid: string): string | null {
  if (!/^\d{9,10}$/.test(uid)) return null;
  if (uid.length === 10 && uid.startsWith('18')) return 'os_asia';

  switch (uid[0]) {
    case '6':
      return 'os_usa';
    case '7':
      return 'os_euro';
    case '8':
      return 'os_asia';
    case '9':
      return 'os_cht';
    case '1':
    case '2':
    case '3':
    case '5':
      return 'cn';
    default:
      return null;
  }
}

/** Normalize a pasted cookie: strip newlines, collapse separators. */
export function normalizeHoyolabCookie(raw: string): string {
  return raw
    .split(/[\r\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join('; ');
}

/** Returns an error message, or null if the cookie looks usable. */
export function validateHoyolabCookie(raw: string): string | null {
  const cookie = normalizeHoyolabCookie(raw);
  const hasToken = /(?:^|;\s*)ltoken(?:_v2)?=\S+/.test(cookie);
  const hasId = /(?:^|;\s*)(?:ltuid(?:_v2)?|account_id(?:_v2)?)=\d+/.test(cookie);

  if (!hasToken || !hasId) {
    return 'Cookie must include ltuid_v2 and ltoken_v2 (or the legacy ltuid/ltoken pair) from hoyolab.com.';
  }
  return null;
}

// ============================================
// Stat mapping
// ============================================

/**
 * Fallback property_type → GOOD stat key table (standard FIGHT_PROP ids).
 * The response's own property_map takes precedence when present, since these
 * ids are not officially documented.
 */
const PROPERTY_TYPE_TO_GOOD: Record<number, string> = {
  2: 'hp',
  3: 'hp_',
  5: 'atk',
  6: 'atk_',
  8: 'def',
  9: 'def_',
  20: 'critRate_',
  22: 'critDMG_',
  23: 'enerRech_',
  26: 'heal_',
  28: 'eleMas',
  30: 'physical_dmg_',
  40: 'pyro_dmg_',
  41: 'electro_dmg_',
  42: 'hydro_dmg_',
  43: 'dendro_dmg_',
  44: 'anemo_dmg_',
  45: 'geo_dmg_',
  46: 'cryo_dmg_',
};

const ELEMENT_DMG_KEYS: Record<string, string> = {
  physical: 'physical_dmg_',
  pyro: 'pyro_dmg_',
  hydro: 'hydro_dmg_',
  dendro: 'dendro_dmg_',
  electro: 'electro_dmg_',
  anemo: 'anemo_dmg_',
  cryo: 'cryo_dmg_',
  geo: 'geo_dmg_',
};

/** Parse HoYoLAB display values like "4,780", "46.6%", "40" into numbers. */
export function parseHoyolabStatValue(value: string): number {
  const cleaned = value.replace(/[,%\s]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Resolve a HoYoLAB artifact property to a GOOD stat key.
 * Prefers the localized stat name embedded in the response (property_map),
 * falling back to the static id table. The `%` in the value disambiguates
 * flat vs. percent HP/ATK/DEF, which share a display name.
 */
export function resolveStatKey(
  prop: HoyolabArtifactProperty,
  propertyMap?: Record<string, HoyolabPropInfo>
): string | null {
  const isPercent = prop.value.includes('%');
  const info = propertyMap?.[String(prop.property_type)];
  const rawName = info?.filter_name || info?.name;

  if (rawName) {
    const name = rawName.trim().toLowerCase().replace(/%$/, '');
    const explicitPercent = rawName.includes('%') || isPercent;

    if (name === 'hp') return explicitPercent ? 'hp_' : 'hp';
    if (name === 'atk') return explicitPercent ? 'atk_' : 'atk';
    if (name === 'def') return explicitPercent ? 'def_' : 'def';
    if (name === 'elemental mastery') return 'eleMas';
    if (name === 'energy recharge') return 'enerRech_';
    if (name === 'crit rate') return 'critRate_';
    if (name === 'crit dmg') return 'critDMG_';
    if (name === 'healing bonus') return 'heal_';

    const element = name.match(/^([a-z]+) dmg bonus$/)?.[1];
    if (element && ELEMENT_DMG_KEYS[element]) {
      return ELEMENT_DMG_KEYS[element];
    }
  }

  const fallback = PROPERTY_TYPE_TO_GOOD[prop.property_type];
  if (!fallback) return null;

  // Percent/flat sanity check against the value formatting: the fallback table
  // is unofficial, so trust the value string when they disagree.
  if (fallback === 'hp' && isPercent) return 'hp_';
  if (fallback === 'hp_' && !isPercent) return 'hp';
  if (fallback === 'atk' && isPercent) return 'atk_';
  if (fallback === 'atk_' && !isPercent) return 'atk';
  if (fallback === 'def' && isPercent) return 'def_';
  if (fallback === 'def_' && !isPercent) return 'def';

  return fallback;
}

// ============================================
// Conversion
// ============================================

const POS_TO_SLOT: Record<number, SlotKey> = {
  1: 'flower',
  2: 'plume',
  3: 'sands',
  4: 'goblet',
  5: 'circlet',
};

/** Default main stat by slot, used when a main property cannot be resolved. */
const SLOT_DEFAULT_MAIN: Partial<Record<SlotKey, string>> = {
  flower: 'hp',
  plume: 'atk',
};

/** Traveler avatar ids (male / female); HoYoLAB names both "Traveler". */
const TRAVELER_AVATAR_IDS = new Set([10000005, 10000007]);

/**
 * Resolve the internal character key. The Traveler is keyed per element
 * ("TravelerAnemo") to match GOOD and the app's character list.
 */
export function resolveHoyolabCharacterKey(base: HoyolabCharacterBase): string {
  const isTraveler =
    (base.id !== undefined && TRAVELER_AVATAR_IDS.has(base.id)) ||
    base.name?.trim().toLowerCase() === 'traveler';
  if (isTraveler && base.element) {
    const element = base.element.trim().toLowerCase();
    return `Traveler${element.charAt(0).toUpperCase()}${element.slice(1)}`;
  }
  return toGoodCharacterKey(base.name ?? '');
}

/** Minimal ascension phase consistent with a character level. */
export function deriveAscensionFromLevel(level: number): number {
  if (level > 80) return 6;
  if (level > 70) return 5;
  if (level > 60) return 4;
  if (level > 50) return 3;
  if (level > 40) return 2;
  if (level > 20) return 1;
  return 0;
}

function mapRelic(
  relic: HoyolabRelic,
  propertyMap?: Record<string, HoyolabPropInfo>
): Artifact | null {
  const slotKey = POS_TO_SLOT[relic.pos];
  if (!slotKey) return null;

  let mainStatKey = relic.main_property
    ? resolveStatKey(relic.main_property, propertyMap)
    : null;
  if (!mainStatKey) {
    mainStatKey = SLOT_DEFAULT_MAIN[slotKey] ?? null;
  }
  if (!mainStatKey) {
    console.warn(`Skipping artifact with unresolvable main stat (pos ${relic.pos})`, relic);
    return null;
  }

  const substats: Substat[] = [];
  for (const sub of relic.sub_property_list ?? []) {
    const key = resolveStatKey(sub, propertyMap);
    if (!key) {
      console.warn(`Skipping unresolvable substat (property_type ${sub.property_type})`);
      continue;
    }
    substats.push({ key, value: parseHoyolabStatValue(sub.value) });
  }

  return {
    setKey: relic.set?.name ? toGoodArtifactSetKey(relic.set.name) : 'Unknown',
    slotKey,
    level: relic.level ?? 0,
    rarity: relic.rarity ?? 5,
    mainStatKey,
    substats,
  };
}

function mapTalents(skills: HoyolabSkill[] | undefined): Character['talent'] {
  const talent = { auto: 1, skill: 1, burst: 1 };
  if (!skills || skills.length === 0) return talent;

  const bySkillType = (type: number) =>
    skills.find((s) => s.skill_type === type)?.level;

  const auto = bySkillType(1);
  const skill = bySkillType(2);
  const burst = bySkillType(3);

  if (auto !== undefined || skill !== undefined || burst !== undefined) {
    return {
      auto: auto ?? 1,
      skill: skill ?? 1,
      burst: burst ?? 1,
    };
  }

  // Fallback for responses without skill_type: combat talents are the
  // leveled ones (passives stay at max_level 1), in auto/skill/burst order.
  const combat = skills.filter((s) => (s.max_level ?? 0) > 1 || (s.level ?? 0) > 1);
  return {
    auto: combat[0]?.level ?? 1,
    skill: combat[1]?.level ?? 1,
    burst: combat[2]?.level ?? 1,
  };
}

/**
 * Convert a HoYoLAB character/detail response to internal Character records.
 */
export function fromHoyolab(
  result: HoyolabFetchResult
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] {
  const characters: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const entry of result.list ?? []) {
    try {
      const base = entry.base ?? entry;
      if (!base.name) {
        console.warn('Skipping HoYoLAB character without a name', entry);
        continue;
      }

      const level = base.level ?? 1;
      const constellation =
        base.actived_constellation_num ??
        entry.constellations?.filter((c) => c.is_actived).length ??
        0;

      const weaponData = entry.weapon ?? base.weapon;
      const weaponLevel = weaponData?.level ?? 1;
      const weapon = {
        key: weaponData?.name ? toGoodWeaponKey(weaponData.name) : 'DullBlade',
        level: weaponLevel,
        ascension: weaponData?.promote_level ?? deriveAscensionFromLevel(weaponLevel),
        refinement: Math.min(5, Math.max(1, weaponData?.affix_level ?? 1)),
      };

      const artifacts = (entry.relics ?? [])
        .map((relic) => mapRelic(relic, result.property_map))
        .filter((a): a is Artifact => a !== null);

      characters.push({
        key: resolveHoyolabCharacterKey(base),
        level,
        ascension: deriveAscensionFromLevel(level),
        constellation,
        talent: mapTalents(entry.skills),
        weapon,
        artifacts,
        notes: '',
        priority: 'unbuilt',
        teamIds: [],
        avatarId: base.id,
      });
    } catch (err) {
      console.error('Failed to parse HoYoLAB character:', err);
      continue;
    }
  }

  return characters;
}

// ============================================
// Fetch
// ============================================

/**
 * Fetch the full roster from the HoYoLAB Battle Chronicle.
 * Requires the Tauri desktop build — browsers cannot send the HoYoLAB
 * cookie cross-site.
 */
export async function fetchHoyolabCharacters(
  uid: string,
  cookie: string
): Promise<HoyolabFetchResult> {
  const server = deriveServerFromUid(uid);
  if (!server) {
    throw new Error('Unrecognized UID. Enter the 9-10 digit UID shown in-game.');
  }
  if (server === 'cn') {
    throw new Error('Chinese (miyoushe) accounts are not supported — HoYoLAB sync covers global servers only.');
  }

  const cookieError = validateHoyolabCookie(cookie);
  if (cookieError) {
    throw new Error(cookieError);
  }

  if (!('__TAURI__' in window)) {
    throw new Error(
      'HoYoLAB sync requires the GIApp desktop app. Browsers cannot send the HoYoLAB login cookie from another site.'
    );
  }

  const { invoke } = await import('@tauri-apps/api/core');
  try {
    return await invoke<HoyolabFetchResult>('fetch_hoyolab_characters', {
      uid,
      server,
      cookie: normalizeHoyolabCookie(cookie),
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}
