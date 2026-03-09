/**
 * Artifact Quality Filter
 *
 * Build-aware artifact filtering based on community data.
 * Determines if an artifact's set + slot + main stat combo is used
 * by ANY meta build. If no build wants it, it's safe to strongbox.
 *
 * For flowers/plumes (fixed main stats), evaluates substats against
 * the aggregated substat priorities of all builds using that set,
 * plus universal offset value (high CV, ER, EM).
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
 * Per-set desired substats, aggregated from all character builds using each set.
 *
 * Weights represent aggregate importance:
 *   5 = critical (nearly all builds using this set want it)
 *   3 = important (many builds want it)
 *   1 = nice to have (some builds want it)
 *
 * These are used to evaluate flower/plume quality since those slots have
 * fixed main stats and only differ by substats.
 */
const SET_DESIRED_SUBSTATS: Record<string, Record<string, number>> = {
  // Universal DPS / offset sets
  ADayCarvedFromRisingWinds: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3, eleMas: 1 },
  EchoesOfAnOffering: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3, eleMas: 1 },
  GladiatorsFinale: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3, eleMas: 1 },
  ShimenawasReminiscence: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3, eleMas: 1 },
  FragmentOfHarmonicWhimsy: { critRate_: 5, critDMG_: 5, atk_: 3, eleMas: 3 },
  NighttimeWhispersInTheEchoingWoods: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3, eleMas: 1 },
  VermillionHereafter: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },
  UnfinishedReverie: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },

  // Elemental DPS sets
  CrimsonWitchOfFlames: { critRate_: 5, critDMG_: 5, eleMas: 3, atk_: 3, hp_: 1, enerRech_: 1 },
  BlizzardStrayer: { critDMG_: 5, atk_: 5, enerRech_: 3, critRate_: 1 }, // 4pc gives CR
  ThunderingFury: { critRate_: 5, critDMG_: 5, eleMas: 3, atk_: 3, enerRech_: 1 },
  Thundersoother: { critRate_: 5, critDMG_: 5, atk_: 3, eleMas: 1, enerRech_: 1 },
  HeartOfDepth: { critRate_: 5, critDMG_: 5, atk_: 3, hp_: 1, enerRech_: 1, eleMas: 1 },
  DesertPavilionChronicle: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },
  NymphsDream: { critRate_: 5, critDMG_: 5, atk_: 3, hp_: 1, enerRech_: 1 },
  PaleFlame: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },
  BloodstainedChivalry: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },
  Lavawalker: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },
  LongNightsOath: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 3 },
  ObsidianCodex: { critRate_: 5, critDMG_: 5, atk_: 3, eleMas: 1, enerRech_: 1 },
  FinaleOfTheDeepGalleries: { critRate_: 5, critDMG_: 5, atk_: 3, enerRech_: 1 },

  // HP-scaling DPS sets
  MarechausseeHunter: { critRate_: 5, critDMG_: 5, hp_: 3, atk_: 1, enerRech_: 3, eleMas: 1 },

  // Burst / Sub-DPS sets
  EmblemOfSeveredFate: { enerRech_: 5, critRate_: 5, critDMG_: 5, atk_: 3, eleMas: 1, hp_: 1 },
  NoblesseOblige: { enerRech_: 5, critRate_: 5, critDMG_: 5, atk_: 3, hp_: 3, eleMas: 1 },

  // EM / Reaction sets
  GildedDreams: { eleMas: 5, critRate_: 3, critDMG_: 3, atk_: 3, enerRech_: 3 },
  FlowerOfParadiseLost: { eleMas: 5, enerRech_: 3, hp_: 1, critRate_: 1, critDMG_: 1 },
  WanderersTroupe: { critRate_: 5, critDMG_: 5, eleMas: 3, atk_: 3, enerRech_: 1 },
  AubadeOfMorningstarAndMoon: { critRate_: 5, critDMG_: 5, enerRech_: 3, atk_: 3, eleMas: 3 },
  NightOfTheSkysUnveiling: { critRate_: 5, critDMG_: 5, eleMas: 3, atk_: 3, enerRech_: 1 },

  // Support / HP sets
  TenacityOfTheMillelith: { hp_: 5, enerRech_: 5, critRate_: 1 },
  VourukashasGlow: { hp_: 5, enerRech_: 3, critRate_: 1, critDMG_: 1 },
  MaidenBeloved: { hp_: 5, enerRech_: 5 },
  OceanHuedClam: { hp_: 5, enerRech_: 5, atk_: 1 },
  SongOfDaysPast: { hp_: 5, enerRech_: 5, atk_: 1, critRate_: 1 },
  SilkenMoonsSerenade: { enerRech_: 5, eleMas: 3, critRate_: 3, critDMG_: 1, atk_: 1 },
  ScrollOfTheHeroOfCinderCity: { enerRech_: 5, hp_: 3, critRate_: 3, critDMG_: 1, atk_: 1 },

  // Dendro support
  DeepwoodMemories: { enerRech_: 5, hp_: 3, eleMas: 3, critRate_: 3, critDMG_: 1 },

  // Anemo support
  ViridescentVenerer: { eleMas: 5, enerRech_: 5, critRate_: 1, critDMG_: 1 },

  // DEF scaling
  HuskOfOpulentDreams: { def_: 5, critRate_: 5, critDMG_: 5, enerRech_: 1 },
  ArchaicPetra: { def_: 3, critRate_: 5, critDMG_: 5, enerRech_: 1, hp_: 1 },
  RetracingBolide: { critRate_: 5, critDMG_: 5, def_: 1, hp_: 1 },

  // Off-field DPS
  GoldenTroupe: { critRate_: 5, critDMG_: 5, hp_: 3, atk_: 3, enerRech_: 3 },

  // Instructor / 4-star sets
  Instructor: { enerRech_: 5, eleMas: 3, hp_: 3, critRate_: 1 },
  Exile: { enerRech_: 5, critRate_: 3, critDMG_: 1 },
};

/**
 * Thresholds for flower/plume offset piece evaluation.
 * A piece is a valuable offset if it exceeds these thresholds.
 */
const OFFSET_THRESHOLDS = {
  /** CV at or above this is universally valuable as an offset */
  highCV: 35,
  /** Minimum CV to consider keeping (combined with other stats) */
  minCV: 20,
  /** ER% at or above this makes a piece valuable for support offsets */
  highER: 15,
  /** EM at or above this makes a piece valuable for reaction offsets */
  highEM: 60,
  /** Minimum number of desired substats to keep a flower/plume for its set */
  minDesiredSubstats: 2,
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
  /** For flowers/plumes: how many desired substats this piece has */
  desiredSubstatCount?: number;
  /** For flowers/plumes: whether this is a valuable universal offset piece */
  isGoodOffset?: boolean;
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

  // Flowers and plumes: evaluate substats against set's desired substats + offset value
  if (artifact.slotKey === 'flower' || artifact.slotKey === 'plume') {
    return evaluateFlowerPlume(artifact, setKey, setData);
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
 * Evaluate a flower or plume artifact.
 *
 * Since main stats are fixed, quality depends on:
 * 1. Set value: does any build use this set?
 * 2. Substat match: do substats align with what builds using this set want?
 * 3. Universal offset value: high CV, ER, or EM makes any piece valuable
 *
 * A flower/plume is "useless" if:
 * - It has fewer than 2 desired substats for its set, AND
 * - It's not a good universal offset piece
 */
function evaluateFlowerPlume(
  artifact: InventoryArtifact,
  setKey: string,
  setData: DemandMatrix[string],
): QualityFilterResult {
  // Calculate total set demand
  const totalDemand = (['sands', 'goblet', 'circlet'] as const).reduce((sum, slot) => {
    const slotData = setData[slot];
    if (!slotData) return sum;
    return sum + Object.values(slotData).reduce((s, v) => s + v, 0);
  }, 0);

  // Calculate CV and collect substat values
  let cv = 0;
  let totalER = 0;
  let totalEM = 0;
  for (const sub of artifact.substats) {
    const normalized = normalizeStatKey(sub.key);
    if (normalized === 'critRate_') cv += sub.value * 2;
    else if (normalized === 'critDMG_') cv += sub.value;
    else if (normalized === 'enerRech_') totalER += sub.value;
    else if (normalized === 'eleMas') totalEM += sub.value;
  }
  cv = Math.round(cv * 10) / 10;

  // Check universal offset value
  const isHighCV = cv >= OFFSET_THRESHOLDS.highCV;
  const isDecentCV = cv >= OFFSET_THRESHOLDS.minCV;
  const isHighER = totalER >= OFFSET_THRESHOLDS.highER;
  const isHighEM = totalEM >= OFFSET_THRESHOLDS.highEM;
  const isGoodOffset = isHighCV || (isDecentCV && (isHighER || isHighEM));

  // If it's a universally great offset piece, keep it regardless of set
  if (isHighCV) {
    return {
      isUseless: false,
      buildDemand: totalDemand,
      reason: `High CV offset (${cv}CV)`,
      isGoodOffset: true,
    };
  }

  // No substats yet (unleveled) - keep if set has demand
  if (artifact.substats.length === 0) {
    return {
      isUseless: totalDemand === 0,
      buildDemand: totalDemand,
      reason: totalDemand > 0 ? `${totalDemand} builds use this set` : 'Set not used in any known build',
      desiredSubstatCount: 0,
    };
  }

  // Count how many substats match the set's desired substats
  const desiredSubs = SET_DESIRED_SUBSTATS[setKey];

  if (!desiredSubs) {
    // Set has demand data but no substat priorities defined
    // Fall back to checking offset value only
    if (isGoodOffset) {
      return {
        isUseless: false,
        buildDemand: totalDemand,
        reason: `Good offset (${cv}CV${isHighER ? ` + ${totalER.toFixed(1)}%ER` : ''}${isHighEM ? ` + ${Math.round(totalEM)}EM` : ''})`,
        isGoodOffset: true,
      };
    }
    return {
      isUseless: false, // Be conservative if we don't have substat data
      buildDemand: totalDemand,
      reason: `${totalDemand} builds use this set`,
    };
  }

  let desiredCount = 0;
  let totalWeight = 0;
  const matchedSubs: string[] = [];
  const missedSubs: string[] = [];

  for (const sub of artifact.substats) {
    const normalized = normalizeStatKey(sub.key);
    const weight = desiredSubs[normalized];
    if (weight && weight > 0) {
      desiredCount++;
      totalWeight += weight;
      matchedSubs.push(formatStatKeyShort(normalized));
    } else {
      missedSubs.push(formatStatKeyShort(normalized));
    }
  }

  // Good for its set: has enough desired substats
  if (desiredCount >= OFFSET_THRESHOLDS.minDesiredSubstats) {
    const qualityNote = totalWeight >= 15
      ? 'Excellent substats'
      : totalWeight >= 10
        ? 'Good substats'
        : 'Usable substats';
    return {
      isUseless: false,
      buildDemand: totalDemand,
      reason: `${qualityNote} for set (${matchedSubs.join(', ')})`,
      desiredSubstatCount: desiredCount,
      isGoodOffset: isGoodOffset,
    };
  }

  // Fewer than 2 desired substats - check offset value
  if (isGoodOffset) {
    return {
      isUseless: false,
      buildDemand: totalDemand,
      reason: `Good offset (${cv}CV${isHighER ? ` + ${totalER.toFixed(1)}%ER` : ''}${isHighEM ? ` + ${Math.round(totalEM)}EM` : ''})`,
      desiredSubstatCount: desiredCount,
      isGoodOffset: true,
    };
  }

  // Not good for set AND not a good offset
  const topDesired = Object.entries(desiredSubs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([stat]) => formatStatKeyShort(stat));

  return {
    isUseless: true,
    buildDemand: totalDemand,
    reason: `Low-value substats (${missedSubs.join(', ')}). Builds want: ${topDesired.join(', ')}`,
    desiredSubstatCount: desiredCount,
    isGoodOffset: false,
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
