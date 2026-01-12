/**
 * Artifact Constants
 *
 * Contains stat values, set information, and scoring weights
 */

// Maximum substat roll values for 5-star artifacts
export const MAX_SUBSTAT_ROLLS: Record<string, number> = {
  'hp': 298.75,
  'hp_': 5.83,
  'atk': 19.45,
  'atk_': 5.83,
  'def': 23.15,
  'def_': 7.29,
  'eleMas': 23.31,
  'enerRech_': 6.48,
  'critRate_': 3.89,
  'critDMG_': 7.77,
};

// Substat key normalization (handle different formats)
export function normalizeStatKey(key: string): string {
  const normalized = key.toLowerCase().replace(/[^a-z_]/g, '');
  const mapping: Record<string, string> = {
    'hp': 'hp',
    'hpflat': 'hp',
    'hp_': 'hp_',
    'hppercent': 'hp_',
    'atk': 'atk',
    'atkflat': 'atk',
    'atk_': 'atk_',
    'atkpercent': 'atk_',
    'def': 'def',
    'defflat': 'def',
    'def_': 'def_',
    'defpercent': 'def_',
    'elementalmastery': 'eleMas',
    'elemas': 'eleMas',
    'em': 'eleMas',
    'energyrecharge': 'enerRech_',
    'enerRech_': 'enerRech_',
    'er': 'enerRech_',
    'er_': 'enerRech_',
    'critrate': 'critRate_',
    'critrate_': 'critRate_',
    'cr': 'critRate_',
    'cr_': 'critRate_',
    'critdmg': 'critDMG_',
    'critdmg_': 'critDMG_',
    'critdamage': 'critDMG_',
    'cd': 'critDMG_',
    'cd_': 'critDMG_',
  };
  return mapping[normalized] || key;
}

// Valuable substats for DPS characters (used for scoring)
export const DPS_SUBSTATS = ['critRate_', 'critDMG_', 'atk_', 'eleMas', 'enerRech_'];

// Valuable substats for support characters
export const SUPPORT_SUBSTATS = ['enerRech_', 'hp_', 'def_', 'eleMas', 'critRate_', 'critDMG_'];

// Main stats that are generally considered "bad" for damage dealers
export const BAD_MAIN_STATS_FOR_DPS: Record<string, string[]> = {
  'sands': ['def_', 'hp_'], // DEF% and HP% sands are usually bad
  'goblet': ['def_', 'hp_', 'atk_'], // Elemental/Physical DMG preferred
  'circlet': ['def_', 'hp_', 'atk_'], // Crit preferred
};

// Sets that are generally considered obsolete/weak
export const OBSOLETE_SETS = [
  'PrayersForDestiny',
  'PrayersForIllumination',
  'PrayersForWisdom',
  'PrayersToSpringtime',
  'ResolutionOfSojourner',
  'TinyMiracle',
  'Berserker',
  'Instructor',
  'TheExile',
  'DefendersWill',
  'BraveHeart',
  'MartialArtist',
  'Gambler',
  'Scholar',
  'TravelingDoctor',
  'LuckyDog',
  'Adventurer',
];

// Meta/valuable artifact sets
export const VALUABLE_SETS = [
  // Universal
  'GladiatorsFinale',
  'WanderersTroupe',
  'EmblemOfSeveredFate',
  'ShimenawasReminiscence',
  'NoblesseOblige',
  'ViridescentVenerer',
  'Thundersoother',
  'Lavawalker',
  // Elemental
  'CrimsonWitchOfFlames',
  'ThunderingFury',
  'BlizzardStrayer',
  'HeartOfDepth',
  'ArchaicPetra',
  'RetracingBolide',
  'TenacityOfTheMillelith',
  'PaleFlame',
  'OceanHuedClam',
  'HuskOfOpulentDreams',
  'VermillionHereafter',
  'EchoesOfAnOffering',
  'DeepwoodMemories',
  'GildedDreams',
  'DesertPavilionChronicle',
  'FlowerOfParadiseLost',
  'NymphsDream',
  'VourukashasGlow',
  'MarechausseeHunter',
  'GoldenTroupe',
  'SongOfDaysPast',
  'NighttimeWhispersInTheEchoingWoods',
  'FragmentOfHarmonicWhimsy',
  'UnfinishedReverie',
  'ScrollOfTheHeroOfCinderCity',
  'ObsidianCodex',
];

// Slot keys
export type SlotKey = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

export const SLOT_NAMES: Record<SlotKey, string> = {
  flower: 'Flower of Life',
  plume: 'Plume of Death',
  sands: 'Sands of Eon',
  goblet: 'Goblet of Eonothem',
  circlet: 'Circlet of Logos',
};
