/**
 * Theatre leveling planning mode.
 *
 * When a difficulty is short, the player can pick owned characters to level up
 * to that difficulty's floor. Material math is delegated to the existing
 * ascension planner rather than re-derived here.
 */

import {
  calculateAscensionSummary,
  getAscensionPhase,
  type AscensionGoal,
  type AscensionSummary,
} from '@/lib/planning/ascensionCalculator';
import {
  DAILY_RESIN_REGEN,
  estimateFarmingDays,
} from '@/features/planner/domain/resinCalculator';
import type { Character } from '@/types';
import type { DifficultyReadiness } from './readiness';

export interface LevelingCandidate {
  key: string;
  level: number;
  /** minLevel - level */
  levelsNeeded: number;
}

export interface LevelingPlan {
  selectedKeys: string[];
  totalResin: number;
  totalMora: number;
  totalExp: number;
  daysNeeded: number;
  coversShortfall: boolean;
}

/**
 * Owned characters that would become eligible if leveled to the difficulty's
 * floor — exactly the nearMiss set, cheapest first.
 */
export function selectLevelingCandidates(
  readiness: DifficultyReadiness
): LevelingCandidate[] {
  return [...readiness.nearMiss]
    .sort((a, b) => a.levelsNeeded - b.levelsNeeded || a.key.localeCompare(b.key))
    .map((entry) => ({
      key: entry.key,
      level: entry.level,
      levelsNeeded: entry.levelsNeeded,
    }));
}

/** The candidates pre-selected by default: just enough to close the gap. */
export function defaultSelection(
  candidates: LevelingCandidate[],
  shortfall: number
): string[] {
  return candidates.slice(0, Math.max(0, shortfall)).map((candidate) => candidate.key);
}

/**
 * Builds an ascension goal that raises a character to the difficulty's level
 * floor and leaves talents untouched (so talent materials come out at zero).
 */
export function buildLevelingGoal(character: Character, minLevel: number): AscensionGoal {
  const talents = {
    auto: character.talent?.auto ?? 1,
    skill: character.talent?.skill ?? 1,
    burst: character.talent?.burst ?? 1,
  };

  return {
    characterKey: character.key,
    currentLevel: character.level,
    targetLevel: minLevel,
    currentAscension: character.ascension,
    targetAscension: getAscensionPhase(minLevel),
    currentTalents: { ...talents },
    targetTalents: { ...talents },
  };
}

export function aggregateLevelingPlan(
  summaries: AscensionSummary[],
  shortfall: number,
  dailyResin: number = DAILY_RESIN_REGEN
): LevelingPlan {
  const selectedKeys = summaries.map((summary) => summary.characterKey);

  let totalResin = 0;
  let totalMora = 0;
  let totalExp = 0;

  for (const summary of summaries) {
    totalResin += summary.estimatedResin ?? 0;
    totalMora += summary.totalMora ?? 0;
    totalExp += summary.totalExp ?? 0;
  }

  return {
    selectedKeys,
    totalResin,
    totalMora,
    totalExp,
    daysNeeded: estimateFarmingDays(totalResin, dailyResin),
    coversShortfall: selectedKeys.length >= shortfall,
  };
}

export interface ComputeLevelingPlanInput {
  characters: Character[];
  selectedKeys: string[];
  minLevel: number;
  shortfall: number;
  dailyResin?: number;
  skipApiFetch?: boolean;
}

/**
 * Orchestrates the per-character ascension summaries and aggregates them.
 * Assumes an empty inventory: the estimate is the full cost from scratch.
 */
export async function computeLevelingPlan({
  characters,
  selectedKeys,
  minLevel,
  shortfall,
  dailyResin = DAILY_RESIN_REGEN,
  skipApiFetch,
}: ComputeLevelingPlanInput): Promise<LevelingPlan> {
  const normalize = (key: string) => key.toLowerCase().replace(/\s+/g, '');
  const byKey = new Map(characters.map((character) => [normalize(character.key), character]));

  const selected = selectedKeys
    .map((key) => byKey.get(normalize(key)))
    .filter((character): character is Character => character !== undefined);

  const summaries = await Promise.all(
    selected.map((character) =>
      calculateAscensionSummary(buildLevelingGoal(character, minLevel), {}, { skipApiFetch })
    )
  );

  return aggregateLevelingPlan(summaries, shortfall, dailyResin);
}
