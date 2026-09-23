/**
 * Imaginarium Theatre readiness.
 *
 * Pure domain logic: given a season and the player's owned characters, work
 * out which difficulties can be fielded and, when they can't, which owned
 * characters are only short on levels.
 */

import { getCharacterMetadata } from '@/features/roster/data/characterMetadata';
import type { Character } from '@/types';
import type { TheaterElement, TheaterSeason } from '../data/theaterSeasons';

export type TheaterDifficulty = 'easy' | 'normal' | 'hard' | 'visionary' | 'lunar';

export interface DifficultyRule {
  difficulty: TheaterDifficulty;
  minRoster: number;
  minLevel: number;
  requiresClear?: TheaterDifficulty;
}

export const DIFFICULTY_RULES: DifficultyRule[] = [
  { difficulty: 'easy', minRoster: 8, minLevel: 60 },
  { difficulty: 'normal', minRoster: 12, minLevel: 60 },
  { difficulty: 'hard', minRoster: 16, minLevel: 70 },
  { difficulty: 'visionary', minRoster: 22, minLevel: 70, requiresClear: 'hard' },
  { difficulty: 'lunar', minRoster: 28, minLevel: 70, requiresClear: 'visionary' },
];

export const DIFFICULTY_LABELS: Record<TheaterDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  visionary: 'Visionary',
  lunar: 'Lunar',
};

export type EligibilityReason =
  | 'element'
  | 'openingOwned'
  | 'openingTrial'
  | 'specialGuest';

export interface EligibleCharacter {
  key: string;
  reason: EligibilityReason;
  /** null for unowned trial openers */
  level: number | null;
}

export interface NearMissCharacter {
  key: string;
  level: number;
  levelsNeeded: number;
}

export interface DifficultyReadiness {
  difficulty: TheaterDifficulty;
  required: number;
  eligibleCount: number;
  ready: boolean;
  shortfall: number;
  eligible: EligibleCharacter[];
  /** Owned, element/guest-qualified, but below the difficulty's level floor */
  nearMiss: NearMissCharacter[];
  /** The prerequisite difficulty is itself not ready */
  blockedByUnlock: boolean;
}

export interface SeasonReadiness {
  seasonId: string;
  difficulties: DifficultyReadiness[];
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '');
}

/**
 * Indexes owned characters by normalized key. When the roster somehow holds
 * duplicates of the same character, the highest level wins.
 */
function indexOwned(ownedCharacters: Character[]): Map<string, Character> {
  const byKey = new Map<string, Character>();

  for (const character of ownedCharacters) {
    if (!character?.key) continue;
    const normalized = normalizeKey(character.key);
    const existing = byKey.get(normalized);
    if (!existing || character.level > existing.level) {
      byKey.set(normalized, character);
    }
  }

  return byKey;
}

/** De-duplicates season key lists while preserving order. */
function uniqueKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(key);
  }

  return result;
}

function computeDifficultyReadiness(
  season: TheaterSeason,
  rule: DifficultyRule,
  ownedByKey: Map<string, Character>
): DifficultyReadiness {
  const eligible: EligibleCharacter[] = [];
  const nearMiss: NearMissCharacter[] = [];
  const counted = new Set<string>();

  const openers = uniqueKeys(season.openingCharacters);
  const guests = uniqueKeys(season.specialGuests);
  const featured = new Set<TheaterElement>(season.elements);

  // Openers always count: a free Lv. 90 trial stands in for an unowned or
  // underleveled copy, so they never appear in nearMiss either.
  for (const key of openers) {
    const normalized = normalizeKey(key);
    counted.add(normalized);
    const owned = ownedByKey.get(normalized);
    eligible.push(
      owned
        ? { key, reason: 'openingOwned', level: owned.level }
        : { key, reason: 'openingTrial', level: null }
    );
  }

  // Owned Special Guests bypass the element restriction but not the level floor.
  for (const key of guests) {
    const normalized = normalizeKey(key);
    if (counted.has(normalized)) continue;

    const owned = ownedByKey.get(normalized);
    if (!owned) continue;

    counted.add(normalized);
    if (owned.level >= rule.minLevel) {
      eligible.push({ key, reason: 'specialGuest', level: owned.level });
    } else {
      nearMiss.push({
        key,
        level: owned.level,
        levelsNeeded: rule.minLevel - owned.level,
      });
    }
  }

  // Remaining owned characters qualify through the season's featured elements.
  for (const character of ownedByKey.values()) {
    const normalized = normalizeKey(character.key);
    if (counted.has(normalized)) continue;

    const metadata = getCharacterMetadata(character.key);
    if (!metadata) continue;
    if (!featured.has(metadata.element as TheaterElement)) continue;

    counted.add(normalized);
    if (character.level >= rule.minLevel) {
      eligible.push({ key: character.key, reason: 'element', level: character.level });
    } else {
      nearMiss.push({
        key: character.key,
        level: character.level,
        levelsNeeded: rule.minLevel - character.level,
      });
    }
  }

  nearMiss.sort((a, b) => a.levelsNeeded - b.levelsNeeded || a.key.localeCompare(b.key));

  const eligibleCount = eligible.length;

  return {
    difficulty: rule.difficulty,
    required: rule.minRoster,
    eligibleCount,
    ready: eligibleCount >= rule.minRoster,
    shortfall: Math.max(0, rule.minRoster - eligibleCount),
    eligible,
    nearMiss,
    blockedByUnlock: false,
  };
}

export function computeSeasonReadiness(
  season: TheaterSeason,
  ownedCharacters: Character[]
): SeasonReadiness {
  const ownedByKey = indexOwned(ownedCharacters ?? []);
  const byDifficulty = new Map<TheaterDifficulty, DifficultyReadiness>();

  const difficulties = DIFFICULTY_RULES.map((rule) => {
    const readiness = computeDifficultyReadiness(season, rule, ownedByKey);

    if (rule.requiresClear) {
      const prerequisite = byDifficulty.get(rule.requiresClear);
      // Chains naturally: lunar is blocked when visionary is unready, and
      // visionary is unready whenever hard is short.
      readiness.blockedByUnlock = !prerequisite?.ready || prerequisite.blockedByUnlock;
    }

    byDifficulty.set(rule.difficulty, readiness);
    return readiness;
  });

  return { seasonId: season.id, difficulties };
}

export function getDifficultyRule(difficulty: TheaterDifficulty): DifficultyRule | undefined {
  return DIFFICULTY_RULES.find((rule) => rule.difficulty === difficulty);
}

export function countByReason(readiness: DifficultyReadiness): Record<EligibilityReason, number> {
  const counts: Record<EligibilityReason, number> = {
    element: 0,
    openingOwned: 0,
    openingTrial: 0,
    specialGuest: 0,
  };

  for (const entry of readiness.eligible) {
    counts[entry.reason] += 1;
  }

  return counts;
}
