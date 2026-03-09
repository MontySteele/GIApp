/**
 * Artifact Quality Filter
 *
 * Build-aware artifact filtering based on community data.
 * Determines if an artifact's set + slot + main stat combo is used
 * by ANY meta build. If no build wants it, it's safe to strongbox.
 *
 * Data source: Community build spreadsheet (March 2026, Varka patch)
 * Numbers represent how many character builds use that set+slot+mainStat combo.
 */

import type { InventoryArtifact } from '@/types';
import { normalizeStatKey } from './artifactConstants';

/**
 * Demand matrix: setKey -> slotKey -> mainStatKey -> build count
 * Only sands/goblet/circlet are tracked (flower and plume have fixed main stats).
 * A count of 0 (or missing) means no build uses that combination.
 */
type DemandMatrix = Record<string, {
  sands?: Record<string, number>;
  goblet?: Record<string, number>;
  circlet?: Record<string, number>;
}>;

/**
 * Community build demand data.
 * Each number = how many character builds use that set + slot + main stat combination.
 *
 * Set keys match the GOOD format used throughout the app.
 */
const ARTIFACT_DEMAND: DemandMatrix = {
  ADayCarvedFromRisingWinds: {
    sands: { atk_: 44, eleMas: 13, enerRech_: 18 },
    goblet: { atk_: 10, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 6, cryo_dmg_: 10, dendro_dmg_: 1, electro_dmg_: 9, anemo_dmg_: 4, geo_dmg_: 3, eleMas: 1 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 38, critDMG_: 41, heal_: 1 },
  },
  ArchaicPetra: {
    sands: { hp_: 1, atk_: 3, def_: 5, enerRech_: 2 },
    goblet: { hp_: 1, def_: 4, geo_dmg_: 7 },
    circlet: { hp_: 1, def_: 2, critRate_: 9, critDMG_: 7, heal_: 1 },
  },
  AubadeOfMorningstarAndMoon: {
    sands: { hp_: 4, atk_: 16, def_: 1, eleMas: 24, enerRech_: 12 },
    goblet: { hp_: 2, atk_: 2, def_: 1, eleMas: 8, hydro_dmg_: 2, pyro_dmg_: 4, cryo_dmg_: 3, dendro_dmg_: 3, electro_dmg_: 6, anemo_dmg_: 1 },
    circlet: { hp_: 2, eleMas: 9, critRate_: 23, critDMG_: 23 },
  },
  BlizzardStrayer: {
    sands: { hp_: 1, atk_: 14, eleMas: 3, enerRech_: 5 },
    goblet: { hp_: 1, atk_: 1, hydro_dmg_: 3, cryo_dmg_: 12 },
    circlet: { hp_: 1, atk_: 1, critRate_: 10, critDMG_: 15 },
  },
  BloodstainedChivalry: {
    sands: { atk_: 2 },
    goblet: { physical_dmg_: 2 },
    circlet: { critRate_: 2, critDMG_: 2 },
  },
  CrimsonWitchOfFlames: {
    sands: { hp_: 1, atk_: 7, eleMas: 7, enerRech_: 3 },
    goblet: { pyro_dmg_: 8 },
    circlet: { critRate_: 7, critDMG_: 8 },
  },
  DeepwoodMemories: {
    sands: { hp_: 6, atk_: 8, eleMas: 9, enerRech_: 10 },
    goblet: { hp_: 6, atk_: 1, eleMas: 6, pyro_dmg_: 1, dendro_dmg_: 7 },
    circlet: { hp_: 5, atk_: 1, eleMas: 6, critRate_: 12, critDMG_: 8, heal_: 4 },
  },
  DesertPavilionChronicle: {
    sands: { atk_: 7, def_: 1, eleMas: 2, enerRech_: 1 },
    goblet: { atk_: 3, pyro_dmg_: 2, cryo_dmg_: 1, electro_dmg_: 1, anemo_dmg_: 3, geo_dmg_: 1 },
    circlet: { critRate_: 9, critDMG_: 9 },
  },
  EchoesOfAnOffering: {
    sands: { atk_: 42, eleMas: 13, enerRech_: 18 },
    goblet: { atk_: 7, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 5, cryo_dmg_: 10, dendro_dmg_: 1, electro_dmg_: 8, anemo_dmg_: 5, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 36, critDMG_: 39, heal_: 1 },
  },
  EmblemOfSeveredFate: {
    sands: { hp_: 7, atk_: 32, def_: 1, eleMas: 14, enerRech_: 34 },
    goblet: { hp_: 7, atk_: 8, def_: 2, eleMas: 2, physical_dmg_: 2, hydro_dmg_: 7, pyro_dmg_: 3, cryo_dmg_: 6, dendro_dmg_: 2, electro_dmg_: 9, anemo_dmg_: 3, geo_dmg_: 4 },
    circlet: { hp_: 5, atk_: 3, def_: 2, eleMas: 3, critRate_: 39, critDMG_: 37, heal_: 4 },
  },
  Exile: {
    sands: { hp_: 1, atk_: 2, enerRech_: 3 },
    goblet: { hp_: 1, atk_: 1, def_: 1, pyro_dmg_: 1, geo_dmg_: 1 },
    circlet: { def_: 1, critRate_: 4, critDMG_: 3 },
  },
  FinaleOfTheDeepGalleries: {
    sands: { atk_: 1 },
    goblet: { atk_: 1, cryo_dmg_: 1 },
    circlet: { critRate_: 1, critDMG_: 1 },
  },
  FlowerOfParadiseLost: {
    sands: { hp_: 4, atk_: 15, def_: 1, eleMas: 25, enerRech_: 13 },
    goblet: { hp_: 2, atk_: 1, def_: 1, eleMas: 9, hydro_dmg_: 2, pyro_dmg_: 4, cryo_dmg_: 3, dendro_dmg_: 3, electro_dmg_: 6, anemo_dmg_: 1 },
    circlet: { hp_: 2, eleMas: 10, critRate_: 23, critDMG_: 22 },
  },
  FragmentOfHarmonicWhimsy: {
    sands: { atk_: 40, eleMas: 15, enerRech_: 18 },
    goblet: { atk_: 7, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 5, cryo_dmg_: 10, dendro_dmg_: 1, electro_dmg_: 9, anemo_dmg_: 2, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 34, critDMG_: 37, heal_: 1 },
  },
  GildedDreams: {
    sands: { hp_: 4, atk_: 22, def_: 1, eleMas: 31, enerRech_: 14 },
    goblet: { hp_: 2, atk_: 2, def_: 1, eleMas: 9, hydro_dmg_: 2, pyro_dmg_: 7, cryo_dmg_: 5, dendro_dmg_: 3, electro_dmg_: 7, anemo_dmg_: 1 },
    circlet: { hp_: 2, eleMas: 10, critRate_: 29, critDMG_: 29 },
  },
  GladiatorsFinale: {
    sands: { atk_: 42, def_: 1, eleMas: 15, enerRech_: 18 },
    goblet: { atk_: 8, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 5, cryo_dmg_: 11, dendro_dmg_: 1, electro_dmg_: 9, anemo_dmg_: 2, geo_dmg_: 4 },
    circlet: { atk_: 5, eleMas: 1, critRate_: 36, critDMG_: 39, heal_: 1 },
  },
  GoldenTroupe: {
    sands: { hp_: 1, atk_: 12, def_: 2, eleMas: 3, enerRech_: 4 },
    goblet: { hp_: 1, atk_: 1, def_: 1, eleMas: 1, physical_dmg_: 1, hydro_dmg_: 1, cryo_dmg_: 2, dendro_dmg_: 3, electro_dmg_: 4, anemo_dmg_: 1, geo_dmg_: 4 },
    circlet: { eleMas: 1, critRate_: 16, critDMG_: 16 },
  },
  HeartOfDepth: {
    sands: { hp_: 2, atk_: 1, eleMas: 1 },
    goblet: { hp_: 1, hydro_dmg_: 3 },
    circlet: { hp_: 2, eleMas: 1, critRate_: 3, critDMG_: 3 },
  },
  HuskOfOpulentDreams: {
    sands: { atk_: 2, def_: 6, enerRech_: 1 },
    goblet: { def_: 3, geo_dmg_: 5 },
    circlet: { atk_: 1, def_: 1, critRate_: 7, critDMG_: 6 },
  },
  Instructor: {
    sands: { hp_: 12, atk_: 20, def_: 1, eleMas: 27, enerRech_: 24 },
    goblet: { hp_: 10, atk_: 2, def_: 2, eleMas: 11, hydro_dmg_: 3, pyro_dmg_: 7, cryo_dmg_: 3, dendro_dmg_: 4, electro_dmg_: 7, anemo_dmg_: 1, geo_dmg_: 1 },
    circlet: { hp_: 8, def_: 2, eleMas: 12, critRate_: 33, critDMG_: 27, heal_: 5 },
  },
  Lavawalker: {
    sands: { atk_: 2 },
    goblet: { pyro_dmg_: 2 },
    circlet: { critRate_: 1, critDMG_: 2 },
  },
  LongNightsOath: {
    sands: { atk_: 3, eleMas: 1 },
    goblet: { atk_: 1, pyro_dmg_: 1, electro_dmg_: 1, anemo_dmg_: 1 },
    circlet: { critRate_: 3, critDMG_: 3 },
  },
  MaidenBeloved: {
    sands: { hp_: 4, enerRech_: 4 },
    goblet: { hp_: 4 },
    circlet: { hp_: 3, critRate_: 1, heal_: 4 },
  },
  MarechausseeHunter: {
    sands: { hp_: 5, atk_: 13, def_: 1, eleMas: 6, enerRech_: 3 },
    goblet: { hp_: 3, atk_: 2, hydro_dmg_: 4, pyro_dmg_: 4, cryo_dmg_: 4, dendro_dmg_: 2, electro_dmg_: 1, anemo_dmg_: 1, geo_dmg_: 1 },
    circlet: { hp_: 4, atk_: 1, eleMas: 1, critRate_: 15, critDMG_: 18 },
  },
  NightOfTheSkysUnveiling: {
    sands: { hp_: 1, atk_: 1, def_: 1, eleMas: 2, enerRech_: 2 },
    goblet: { hp_: 1, atk_: 1, def_: 1, eleMas: 2 },
    circlet: { eleMas: 1, critRate_: 4, critDMG_: 4 },
  },
  NighttimeWhispersInTheEchoingWoods: {
    sands: { atk_: 38, eleMas: 13, enerRech_: 18 },
    goblet: { atk_: 7, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 4, cryo_dmg_: 10, dendro_dmg_: 1, electro_dmg_: 8, anemo_dmg_: 2, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 32, critDMG_: 35, heal_: 1 },
  },
  NoblesseOblige: {
    sands: { hp_: 10, atk_: 37, def_: 3, eleMas: 15, enerRech_: 43 },
    goblet: { hp_: 10, atk_: 11, def_: 4, eleMas: 6, hydro_dmg_: 7, pyro_dmg_: 6, cryo_dmg_: 8, dendro_dmg_: 2, electro_dmg_: 7, anemo_dmg_: 4, geo_dmg_: 4 },
    circlet: { hp_: 9, atk_: 5, def_: 4, eleMas: 7, critRate_: 42, critDMG_: 37, heal_: 9 },
  },
  NymphsDream: {
    sands: { hp_: 1, atk_: 3, enerRech_: 2 },
    goblet: { hp_: 1, hydro_dmg_: 4 },
    circlet: { hp_: 1, critRate_: 4, critDMG_: 4 },
  },
  ObsidianCodex: {
    sands: { hp_: 1, atk_: 5, eleMas: 2 },
    goblet: { atk_: 1, hydro_dmg_: 1, pyro_dmg_: 1, dendro_dmg_: 1, electro_dmg_: 1, anemo_dmg_: 1 },
    circlet: { hp_: 1, eleMas: 1, critRate_: 6, critDMG_: 6 },
  },
  OceanHuedClam: {
    sands: { hp_: 7, atk_: 5, eleMas: 1, enerRech_: 11 },
    goblet: { hp_: 7, atk_: 6, eleMas: 1 },
    circlet: { hp_: 5, atk_: 4, eleMas: 1, critRate_: 4, critDMG_: 1, heal_: 10 },
  },
  PaleFlame: {
    sands: { atk_: 3, enerRech_: 1 },
    goblet: { physical_dmg_: 3 },
    circlet: { critRate_: 3, critDMG_: 3 },
  },
  RetracingBolide: {
    sands: { hp_: 1, atk_: 1, def_: 2 },
    goblet: { hp_: 1, hydro_dmg_: 1, geo_dmg_: 2 },
    circlet: { hp_: 1, atk_: 1, critRate_: 3, critDMG_: 3 },
  },
  ScrollOfTheHeroOfCinderCity: {
    sands: { hp_: 8, atk_: 14, def_: 2, eleMas: 3, enerRech_: 21 },
    goblet: { hp_: 8, atk_: 5, def_: 2, eleMas: 1, hydro_dmg_: 3, pyro_dmg_: 3, electro_dmg_: 3, anemo_dmg_: 2, geo_dmg_: 1 },
    circlet: { hp_: 7, atk_: 5, def_: 2, eleMas: 2, critRate_: 17, critDMG_: 12, heal_: 6 },
  },
  ShimenawasReminiscence: {
    sands: { hp_: 1, atk_: 43, eleMas: 16, enerRech_: 18 },
    goblet: { atk_: 8, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 6, cryo_dmg_: 11, dendro_dmg_: 1, electro_dmg_: 8, anemo_dmg_: 4, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 38, critDMG_: 41, heal_: 1 },
  },
  SilkenMoonsSerenade: {
    sands: { hp_: 1, atk_: 3, eleMas: 2, enerRech_: 5 },
    goblet: { hp_: 1, atk_: 3, def_: 1, eleMas: 2, geo_dmg_: 1 },
    circlet: { atk_: 1, def_: 1, eleMas: 2, critRate_: 5, critDMG_: 3, heal_: 1 },
  },
  SongOfDaysPast: {
    sands: { hp_: 3, atk_: 4, eleMas: 1, enerRech_: 7 },
    goblet: { hp_: 3, atk_: 5, eleMas: 1 },
    circlet: { hp_: 3, atk_: 4, eleMas: 1, critRate_: 2, heal_: 5 },
  },
  TenacityOfTheMillelith: {
    sands: { hp_: 19, atk_: 7, def_: 1, eleMas: 3, enerRech_: 21 },
    goblet: { hp_: 18, atk_: 5, def_: 1, eleMas: 2, hydro_dmg_: 7, pyro_dmg_: 1, cryo_dmg_: 1, dendro_dmg_: 1, electro_dmg_: 1 },
    circlet: { hp_: 16, atk_: 2, def_: 1, eleMas: 3, critRate_: 21, critDMG_: 13, heal_: 6 },
  },
  ThunderingFury: {
    sands: { atk_: 12, eleMas: 10, enerRech_: 7 },
    goblet: { atk_: 1, eleMas: 3, electro_dmg_: 14 },
    circlet: { eleMas: 3, critRate_: 14, critDMG_: 14 },
  },
  Thundersoother: {
    sands: { atk_: 5, eleMas: 3, enerRech_: 2 },
    goblet: { electro_dmg_: 5 },
    circlet: { critRate_: 5, critDMG_: 5 },
  },
  UnfinishedReverie: {
    sands: { atk_: 40, eleMas: 13, enerRech_: 18 },
    goblet: { atk_: 7, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 4, cryo_dmg_: 10, dendro_dmg_: 3, electro_dmg_: 8, anemo_dmg_: 2, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 34, critDMG_: 37, heal_: 1 },
  },
  VermillionHereafter: {
    sands: { atk_: 38, eleMas: 13, enerRech_: 18 },
    goblet: { atk_: 7, eleMas: 1, physical_dmg_: 2, hydro_dmg_: 4, pyro_dmg_: 4, cryo_dmg_: 10, dendro_dmg_: 1, electro_dmg_: 8, anemo_dmg_: 2, geo_dmg_: 3 },
    circlet: { atk_: 4, eleMas: 1, critRate_: 32, critDMG_: 35, heal_: 1 },
  },
  ViridescentVenerer: {
    sands: { atk_: 11, eleMas: 6, enerRech_: 11 },
    goblet: { atk_: 8, eleMas: 6, anemo_dmg_: 6 },
    circlet: { atk_: 4, eleMas: 6, critRate_: 10, critDMG_: 8, heal_: 3 },
  },
  VourukashasGlow: {
    sands: { hp_: 15, eleMas: 1, enerRech_: 10 },
    goblet: { hp_: 14, hydro_dmg_: 6, cryo_dmg_: 1 },
    circlet: { hp_: 13, eleMas: 1, critRate_: 11, critDMG_: 8, heal_: 2 },
  },
  WanderersTroupe: {
    sands: { hp_: 5, atk_: 16, def_: 1, eleMas: 25, enerRech_: 12 },
    goblet: { hp_: 3, atk_: 1, def_: 1, eleMas: 8, hydro_dmg_: 3, pyro_dmg_: 5, cryo_dmg_: 3, dendro_dmg_: 3, electro_dmg_: 6, anemo_dmg_: 1 },
    circlet: { hp_: 3, eleMas: 9, critRate_: 24, critDMG_: 24 },
  },
};

/**
 * Normalize a set key from various formats to our GOOD-style key.
 * Handles spaces, apostrophes, and other variations.
 */
function normalizeSetKey(setKey: string): string {
  // Already in PascalCase GOOD format
  if (ARTIFACT_DEMAND[setKey]) return setKey;

  // Try removing spaces/special chars and matching
  const stripped = setKey.replace(/[^a-zA-Z]/g, '');
  for (const key of Object.keys(ARTIFACT_DEMAND)) {
    if (key.toLowerCase() === stripped.toLowerCase()) {
      return key;
    }
  }

  return setKey;
}

/**
 * Normalize a main stat key from artifact data to the keys used in the demand matrix.
 */
function normalizeMainStatForDemand(mainStatKey: string): string {
  const normalized = normalizeStatKey(mainStatKey);

  // Map the normalized stat keys to demand matrix keys
  const mapping: Record<string, string> = {
    'hp_': 'hp_',
    'atk_': 'atk_',
    'def_': 'def_',
    'eleMas': 'eleMas',
    'enerRech_': 'enerRech_',
    'critRate_': 'critRate_',
    'critDMG_': 'critDMG_',
    'heal_': 'heal_',
  };

  // Handle elemental/physical damage bonus keys
  if (normalized.includes('physical') || mainStatKey.includes('physical')) return 'physical_dmg_';
  if (normalized.includes('pyro') || mainStatKey.includes('pyro')) return 'pyro_dmg_';
  if (normalized.includes('hydro') || mainStatKey.includes('hydro')) return 'hydro_dmg_';
  if (normalized.includes('cryo') || mainStatKey.includes('cryo')) return 'cryo_dmg_';
  if (normalized.includes('electro') || mainStatKey.includes('electro')) return 'electro_dmg_';
  if (normalized.includes('anemo') || mainStatKey.includes('anemo')) return 'anemo_dmg_';
  if (normalized.includes('geo') || mainStatKey.includes('geo')) return 'geo_dmg_';
  if (normalized.includes('dendro') || mainStatKey.includes('dendro')) return 'dendro_dmg_';

  return mapping[normalized] || normalized;
}

export interface QualityFilterResult {
  /** Whether this artifact is useless per community builds */
  isUseless: boolean;
  /** Number of builds that want this set+slot+mainStat combo */
  buildDemand: number;
  /** Human-readable reason */
  reason: string;
}

/**
 * Check if an artifact's set + slot + main stat combination is used by any build.
 *
 * For flowers and plumes (fixed main stats), we check if the SET itself appears
 * in the demand data at all (meaning someone uses it).
 *
 * For sands/goblet/circlet, we check the specific set + main stat combination.
 */
export function checkArtifactQuality(artifact: InventoryArtifact): QualityFilterResult {
  const setKey = normalizeSetKey(artifact.setKey);
  const setData = ARTIFACT_DEMAND[setKey];

  // Unknown set - not in community data
  if (!setData) {
    return {
      isUseless: true,
      buildDemand: 0,
      reason: 'Set not used in any known build',
    };
  }

  // Flowers and plumes have fixed main stats
  // If the set is in our data, SOMEONE uses it, so the flower/plume is potentially useful
  if (artifact.slotKey === 'flower' || artifact.slotKey === 'plume') {
    // Sum up total demand across all slots for this set to gauge overall popularity
    const totalDemand = ['sands', 'goblet', 'circlet'].reduce((sum, slot) => {
      const slotData = setData[slot as keyof typeof setData];
      if (!slotData) return sum;
      return sum + Object.values(slotData).reduce((s, v) => s + v, 0);
    }, 0);

    return {
      isUseless: false,
      buildDemand: totalDemand,
      reason: `${totalDemand} builds use this set`,
    };
  }

  // For sands/goblet/circlet, check the specific main stat
  const slotKey = artifact.slotKey as 'sands' | 'goblet' | 'circlet';
  const slotData = setData[slotKey];

  if (!slotData) {
    return {
      isUseless: true,
      buildDemand: 0,
      reason: `No builds use ${slotKey} from this set`,
    };
  }

  const mainStatKey = normalizeMainStatForDemand(artifact.mainStatKey);
  const demand = slotData[mainStatKey] || 0;

  if (demand === 0) {
    // Check what main stats ARE wanted for this set+slot
    const wantedStats = Object.entries(slotData)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([stat]) => formatStatKeyShort(stat));

    const wantedStr = wantedStats.length > 0
      ? `Builds want: ${wantedStats.join(', ')}`
      : 'No builds use this set';

    return {
      isUseless: true,
      buildDemand: 0,
      reason: `No builds use this main stat on this set. ${wantedStr}`,
    };
  }

  return {
    isUseless: false,
    buildDemand: demand,
    reason: `${demand} build${demand !== 1 ? 's' : ''} use this combo`,
  };
}

/**
 * Short display name for stat keys used in filter reasons.
 */
function formatStatKeyShort(key: string): string {
  const names: Record<string, string> = {
    'hp_': 'HP%',
    'atk_': 'ATK%',
    'def_': 'DEF%',
    'eleMas': 'EM',
    'enerRech_': 'ER%',
    'critRate_': 'CR%',
    'critDMG_': 'CD%',
    'heal_': 'Heal%',
    'physical_dmg_': 'Phys%',
    'pyro_dmg_': 'Pyro%',
    'hydro_dmg_': 'Hydro%',
    'cryo_dmg_': 'Cryo%',
    'electro_dmg_': 'Electro%',
    'anemo_dmg_': 'Anemo%',
    'geo_dmg_': 'Geo%',
    'dendro_dmg_': 'Dendro%',
  };
  return names[key] || key;
}

/**
 * Get all sets tracked in the demand data.
 */
export function getTrackedSets(): string[] {
  return Object.keys(ARTIFACT_DEMAND);
}
