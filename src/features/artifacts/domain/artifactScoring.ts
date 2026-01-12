/**
 * Artifact Scoring Algorithm
 *
 * Calculates quality scores for artifacts based on:
 * - Crit Value (CV): critRate × 2 + critDMG
 * - Roll Value (RV): how close substats are to max rolls
 * - Main stat appropriateness
 */

import type { InventoryArtifact, Artifact } from '@/types';
import {
  MAX_SUBSTAT_ROLLS,
  normalizeStatKey,
  BAD_MAIN_STATS_FOR_DPS,
  OBSOLETE_SETS,
  VALUABLE_SETS,
  type SlotKey,
} from './artifactConstants';

export interface ArtifactScore {
  /** Overall score 0-100 */
  score: number;
  /** Letter grade S/A/B/C/D/F */
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  /** Crit Value (CR×2 + CD) */
  critValue: number;
  /** Roll efficiency (actual/max potential) */
  rollEfficiency: number;
  /** Whether this artifact is recommended for strongbox */
  isStrongboxTrash: boolean;
  /** Reason for trash recommendation */
  trashReason?: string;
}

/**
 * Calculate Crit Value (CV) for an artifact
 * CV = Crit Rate × 2 + Crit Damage
 */
export function calculateCritValue(substats: Array<{ key: string; value: number }>): number {
  let cv = 0;
  for (const sub of substats) {
    const normalizedKey = normalizeStatKey(sub.key);
    if (normalizedKey === 'critRate_') {
      cv += sub.value * 2;
    } else if (normalizedKey === 'critDMG_') {
      cv += sub.value;
    }
  }
  return Math.round(cv * 10) / 10;
}

/**
 * Calculate roll efficiency for an artifact
 * Returns a value 0-1 representing how close substats are to max rolls
 */
export function calculateRollEfficiency(substats: Array<{ key: string; value: number }>): number {
  if (substats.length === 0) return 0;

  let totalActual = 0;
  let totalMax = 0;

  for (const sub of substats) {
    const normalizedKey = normalizeStatKey(sub.key);
    const maxRoll = MAX_SUBSTAT_ROLLS[normalizedKey];

    if (maxRoll) {
      // Estimate number of rolls based on value
      // A +20 artifact can have 4 initial substats + 5 rolls = up to 9 total upgrades per substat
      // But typically distributed across 4 substats
      const estimatedRolls = Math.round(sub.value / (maxRoll * 0.85)); // 0.85 = average roll
      const maxPossibleValue = maxRoll * Math.max(1, estimatedRolls);
      totalActual += sub.value;
      totalMax += maxPossibleValue;
    }
  }

  return totalMax > 0 ? totalActual / totalMax : 0;
}

/**
 * Check if an artifact has a "bad" main stat for DPS
 */
function hasBadMainStat(slotKey: string, mainStatKey: string): boolean {
  const slot = slotKey as SlotKey;
  const badStats = BAD_MAIN_STATS_FOR_DPS[slot];
  if (!badStats) return false;

  const normalizedMain = normalizeStatKey(mainStatKey);
  return badStats.includes(normalizedMain);
}

/**
 * Score thresholds for grades
 * Based on typical artifact quality distribution
 */
const GRADE_THRESHOLDS = {
  S: 85, // Top tier, almost perfect
  A: 70, // Great artifact
  B: 55, // Good, usable
  C: 40, // Mediocre
  D: 25, // Poor
  // F: below 25
};

/**
 * Get letter grade from score
 */
export function getGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= GRADE_THRESHOLDS.S) return 'S';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Score an inventory artifact
 */
export function scoreInventoryArtifact(artifact: InventoryArtifact): ArtifactScore {
  const cv = calculateCritValue(artifact.substats);
  const rollEff = calculateRollEfficiency(artifact.substats);

  // Base score from crit value (0-50 points)
  // 40+ CV is excellent, 30+ is good, 20+ is okay
  const cvScore = Math.min(50, (cv / 50) * 50);

  // Roll efficiency score (0-30 points)
  const rollScore = rollEff * 30;

  // Bonus/penalty for main stat (0-20 points)
  let mainStatScore = 10; // Neutral
  if (artifact.slotKey === 'flower' || artifact.slotKey === 'plume') {
    mainStatScore = 15; // Fixed main stats, no penalty
  } else if (hasBadMainStat(artifact.slotKey, artifact.mainStatKey)) {
    mainStatScore = 0; // Bad main stat
  } else {
    mainStatScore = 20; // Good main stat
  }

  // Set bonus (-5 to +5)
  let setBonus = 0;
  if (OBSOLETE_SETS.includes(artifact.setKey)) {
    setBonus = -5;
  } else if (VALUABLE_SETS.includes(artifact.setKey)) {
    setBonus = 5;
  }

  // Rarity penalty
  const rarityPenalty = artifact.rarity < 5 ? (5 - artifact.rarity) * 10 : 0;

  const totalScore = Math.max(0, Math.min(100,
    cvScore + rollScore + mainStatScore + setBonus - rarityPenalty
  ));

  // Determine if strongbox trash
  const { isTrash, reason } = determineStrongboxTrash(artifact, cv, totalScore);

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    critValue: cv,
    rollEfficiency: Math.round(rollEff * 100) / 100,
    isStrongboxTrash: isTrash,
    trashReason: reason,
  };
}

/**
 * Score a character's equipped artifact (simplified format)
 */
export function scoreEquippedArtifact(artifact: Artifact): ArtifactScore {
  const cv = calculateCritValue(artifact.substats);
  const rollEff = calculateRollEfficiency(artifact.substats);

  const cvScore = Math.min(50, (cv / 50) * 50);
  const rollScore = rollEff * 30;

  let mainStatScore = 10;
  if (artifact.slotKey === 'flower' || artifact.slotKey === 'plume') {
    mainStatScore = 15;
  } else if (hasBadMainStat(artifact.slotKey, artifact.mainStatKey)) {
    mainStatScore = 0;
  } else {
    mainStatScore = 20;
  }

  let setBonus = 0;
  if (OBSOLETE_SETS.includes(artifact.setKey)) {
    setBonus = -5;
  } else if (VALUABLE_SETS.includes(artifact.setKey)) {
    setBonus = 5;
  }

  const rarityPenalty = artifact.rarity < 5 ? (5 - artifact.rarity) * 10 : 0;

  const totalScore = Math.max(0, Math.min(100,
    cvScore + rollScore + mainStatScore + setBonus - rarityPenalty
  ));

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    critValue: cv,
    rollEfficiency: Math.round(rollEff * 100) / 100,
    isStrongboxTrash: false,
    trashReason: undefined,
  };
}

/**
 * Determine if an artifact should be strongboxed
 */
function determineStrongboxTrash(
  artifact: InventoryArtifact,
  cv: number,
  score: number
): { isTrash: boolean; reason?: string } {
  // 3-star and 4-star artifacts at max level are fodder
  if (artifact.rarity <= 4 && artifact.level >= (artifact.rarity === 4 ? 16 : 12)) {
    return { isTrash: true, reason: `${artifact.rarity}-star at max level` };
  }

  // Obsolete set
  if (OBSOLETE_SETS.includes(artifact.setKey)) {
    return { isTrash: true, reason: 'Obsolete artifact set' };
  }

  // Very low score 5-star (unless it's a niche piece)
  if (artifact.rarity === 5 && score < 30) {
    return { isTrash: true, reason: 'Very low quality substats' };
  }

  // Low CV on DPS pieces (circlet, goblet, sands with offensive main stat)
  if (artifact.rarity === 5 && artifact.level === 20) {
    const isOffensivePiece = ['sands', 'goblet', 'circlet'].includes(artifact.slotKey);
    if (isOffensivePiece && cv < 15 && !hasBadMainStat(artifact.slotKey, artifact.mainStatKey)) {
      return { isTrash: true, reason: 'Low crit value on offensive piece' };
    }
  }

  // Bad main stat + low substats
  if (
    artifact.rarity === 5 &&
    artifact.level === 20 &&
    hasBadMainStat(artifact.slotKey, artifact.mainStatKey) &&
    cv < 25
  ) {
    return { isTrash: true, reason: 'Bad main stat with low CV' };
  }

  return { isTrash: false };
}

/**
 * Calculate average artifact score for a character's equipped artifacts
 */
export function calculateCharacterArtifactScore(artifacts: Artifact[]): {
  averageScore: number;
  averageGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalCritValue: number;
  scores: ArtifactScore[];
} {
  if (artifacts.length === 0) {
    return {
      averageScore: 0,
      averageGrade: 'F',
      totalCritValue: 0,
      scores: [],
    };
  }

  const scores = artifacts.map(scoreEquippedArtifact);
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalCV = scores.reduce((sum, s) => sum + s.critValue, 0);
  const averageScore = Math.round(totalScore / scores.length);

  return {
    averageScore,
    averageGrade: getGrade(averageScore),
    totalCritValue: Math.round(totalCV * 10) / 10,
    scores,
  };
}

/**
 * Get color class for grade
 */
export function getGradeColor(grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'): string {
  switch (grade) {
    case 'S': return 'text-yellow-400';
    case 'A': return 'text-purple-400';
    case 'B': return 'text-blue-400';
    case 'C': return 'text-green-400';
    case 'D': return 'text-slate-400';
    case 'F': return 'text-red-400';
  }
}

/**
 * Get background color class for grade badge
 */
export function getGradeBgColor(grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'): string {
  switch (grade) {
    case 'S': return 'bg-yellow-900/30 border-yellow-700';
    case 'A': return 'bg-purple-900/30 border-purple-700';
    case 'B': return 'bg-blue-900/30 border-blue-700';
    case 'C': return 'bg-green-900/30 border-green-700';
    case 'D': return 'bg-slate-800/50 border-slate-600';
    case 'F': return 'bg-red-900/30 border-red-700';
  }
}
