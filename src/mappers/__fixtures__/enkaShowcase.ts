import type { EnkaAvatar, EnkaEquip, EnkaResponse } from '../enka';

/**
 * Realistic multi-character Enka showcase fixture.
 *
 * `skillLevelMap` keys are written in Enka's real skill-ID order. Note that
 * JS re-orders integer-like keys ascending on enumeration, so a positional
 * read returns the wrong talents for Ayaka (10024/10018/10019) and for the
 * Dendro Traveler (100557/10117/10118). Furina's IDs happen to be ascending.
 */

function weapon(itemId: number, refinementIndex = 0): EnkaEquip {
  return {
    itemId,
    flat: {
      nameTextMapHash: String(itemId),
      rankLevel: 5,
      itemType: 'ITEM_WEAPON',
      icon: 'UI_EquipIcon',
      weaponStats: [{ appendPropId: 'FIGHT_PROP_BASE_ATTACK', statValue: 608 }],
    },
    weapon: { level: 90, promoteLevel: 6, affixMap: { [`1${itemId}`]: refinementIndex } },
  };
}

function flower(setNameTextMapHash: string): EnkaEquip {
  return {
    itemId: 81024,
    reliquary: { level: 20, mainPropId: 14001, appendPropIdList: [] },
    flat: {
      nameTextMapHash: '2345678901',
      setNameTextMapHash,
      rankLevel: 5,
      itemType: 'ITEM_RELIQUARY',
      icon: 'UI_RelicIcon',
      equipType: 'EQUIP_BRACER',
      reliquaryMainstat: { mainPropId: 'FIGHT_PROP_HP', statValue: 4780 },
      reliquarySubstats: [
        { appendPropId: 'FIGHT_PROP_CRITICAL', statValue: 3.9 },
        { appendPropId: 'FIGHT_PROP_CRITICAL_HURT', statValue: 14.8 },
      ],
    },
  };
}

/** Kamisato Ayaka — skill IDs are NOT ascending: normal 10024, skill 10018, burst 10019. */
export const AYAKA_AVATAR: EnkaAvatar = {
  avatarId: 10000002,
  propMap: {
    '4001': { type: 4001, ival: '90' },
    '1002': { type: 1002, ival: '6' },
  },
  talentIdList: [21],
  fightPropMap: {},
  skillDepotId: 201,
  inherentProudSkillList: [222101, 222301],
  skillLevelMap: {
    '10024': 10, // normal attack
    '10018': 8, // elemental skill
    '10019': 9, // elemental burst
  },
  equipList: [weapon(11509), flower('BlizzardStrayer')], // Mistsplitter Reforged
  fetterInfo: { expLevel: 10 },
};

/** Furina — ascending skill IDs (10891/10892/10895), so positional happens to work. */
export const FURINA_AVATAR: EnkaAvatar = {
  avatarId: 10000089,
  propMap: {
    '4001': { type: 4001, ival: '90' },
    '1002': { type: 1002, ival: '6' },
  },
  talentIdList: [891, 892],
  fightPropMap: {},
  skillDepotId: 8901,
  inherentProudSkillList: [892101, 892201],
  skillLevelMap: {
    '10891': 9,
    '10892': 10,
    '10895': 10,
  },
  equipList: [weapon(11513), flower('GoldenTroupe')], // Splendor of Tranquil Waters
  fetterInfo: { expLevel: 10 },
};

/** Lumine, Dendro depot 708 — normal 100557 sorts AFTER skill/burst (10117/10118). */
export const TRAVELER_DENDRO_AVATAR: EnkaAvatar = {
  avatarId: 10000007,
  propMap: {
    '4001': { type: 4001, ival: '80' },
    '1002': { type: 1002, ival: '5' },
  },
  talentIdList: [71, 72, 73, 74, 75, 76],
  fightPropMap: {},
  skillDepotId: 708,
  inherentProudSkillList: [],
  skillLevelMap: {
    '100557': 6, // normal attack
    '10117': 8, // elemental skill
    '10118': 9, // elemental burst
  },
  equipList: [weapon(11505), flower('DeepwoodMemories')], // Primordial Jade Cutter
  fetterInfo: { expLevel: 10 },
};

/** Columbina — 6.2 character, not in Enka's published skill-order store; exercises the fallback. */
export const COLUMBINA_AVATAR: EnkaAvatar = {
  avatarId: 10000125,
  propMap: {
    '4001': { type: 4001, ival: '90' },
    '1002': { type: 1002, ival: '6' },
  },
  talentIdList: [],
  fightPropMap: {},
  skillDepotId: 12501,
  inherentProudSkillList: [],
  skillLevelMap: {
    '11251': 7,
    '11252': 8,
    '11255': 9,
  },
  equipList: [weapon(14502), flower('GoldenTroupe')], // Lost Prayer to the Sacred Winds
  fetterInfo: { expLevel: 10 },
};

export const ENKA_SHOWCASE_FIXTURE: EnkaResponse = {
  playerInfo: {
    nickname: 'FixturePlayer',
    level: 60,
    signature: 'Multi-character fixture',
    nameCardId: 210001,
    finishAchievementNum: 1200,
    towerFloorIndex: 12,
    towerLevelIndex: 3,
    showAvatarInfoList: [
      { avatarId: 10000002, level: 90 },
      { avatarId: 10000089, level: 90 },
      { avatarId: 10000007, level: 80 },
      { avatarId: 10000125, level: 90 },
    ],
  },
  avatarInfoList: [AYAKA_AVATAR, FURINA_AVATAR, TRAVELER_DENDRO_AVATAR, COLUMBINA_AVATAR],
  ttl: 60,
  uid: '700000001',
};
