import type { BannerType } from '@/types';
import { GACHA_RULES } from '@/lib/constants';

export interface WishHistoryItem {
  id: string;
  name: string;
  rarity: 3 | 4 | 5;
  itemType: 'character' | 'weapon';
  time: string;
  banner: BannerType;
  isFeatured?: boolean;
}

export interface PityState {
  fiveStarPity: number;
  fourStarPity: number;
  guaranteed: boolean;
  fatePoints: number;
  radiantStreak: number;
  radianceActive: boolean;
}

export interface BannerStats {
  totalPulls: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  fiveStarRate: number;
  fourStarRate: number;
  averageFiveStarPity: number;
  averageFourStarPity: number;
  fiftyFiftyWon: number;
  fiftyFiftyLost: number;
  fiftyFiftyWinRate: number;
}

export interface FiveStarPull extends WishHistoryItem {
  pityCount: number;
  wasGuaranteed: boolean;
  triggeredRadiance: boolean;
}

export interface WishAnalysis {
  stats: BannerStats;
  pityState: PityState;
  fiveStarPulls: FiveStarPull[];
  fourStarPulls: WishHistoryItem[];
}

interface ReplayResult {
  bannerHistory: WishHistoryItem[];
  fiveStarPulls: FiveStarPull[];
  fourStarPulls: WishHistoryItem[];
  fiveStarPityValues: number[];
  fourStarPityValues: number[];
  pityState: PityState;
  fiftyFiftyWon: number;
  fiftyFiftyLost: number;
}

function sortHistoryForReplay(history: WishHistoryItem[], bannerType: BannerType): WishHistoryItem[] {
  return history
    .map((wish, index) => ({ wish, index }))
    .filter(({ wish }) => wish.banner === bannerType)
    .sort((a, b) => {
      const timeDiff = new Date(a.wish.time).getTime() - new Date(b.wish.time).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.index - b.index;
    })
    .map(({ wish }) => wish);
}

function replayWishHistory(history: WishHistoryItem[], bannerType: BannerType): ReplayResult {
  const rules = GACHA_RULES[bannerType];
  const bannerHistory = sortHistoryForReplay(history, bannerType);

  const fiveStarPulls: FiveStarPull[] = [];
  const fourStarPulls: WishHistoryItem[] = [];
  const fiveStarPityValues: number[] = [];
  const fourStarPityValues: number[] = [];

  let fiveStarPity = 0;
  let fourStarPity = 0;
  let guaranteed = false;
  let fatePoints = 0;
  let radiantStreak = 0;
  let fiftyFiftyWon = 0;
  let fiftyFiftyLost = 0;

  for (const wish of bannerHistory) {
    fiveStarPity++;
    fourStarPity++;

    if (wish.rarity === 4) {
      fourStarPulls.push(wish);
      fourStarPityValues.push(fourStarPity);
      fourStarPity = 0;
    }

    if (wish.rarity === 5) {
      const wasGuaranteed = guaranteed;
      const isFeatured = wish.isFeatured;
      const resolvedFeatured = isFeatured ?? wasGuaranteed ?? true;
      const triggeredRadiance =
        rules.hasCapturingRadiance && radiantStreak >= (rules.radianceThreshold || 2);

      fiveStarPulls.push({
        ...wish,
        pityCount: fiveStarPity,
        wasGuaranteed,
        triggeredRadiance,
      });
      fiveStarPityValues.push(fiveStarPity);

      if (bannerType === 'character' || bannerType === 'chronicled') {
        if (resolvedFeatured) {
          guaranteed = false;
          radiantStreak = 0;
        } else {
          guaranteed = true;
          if (rules.hasCapturingRadiance) {
            radiantStreak += 1;
          }
        }

        if (isFeatured === true) {
          fiftyFiftyWon += 1;
        } else if (isFeatured === false) {
          fiftyFiftyLost += 1;
        }
      }

      if (bannerType === 'weapon' && rules.hasFatePoints) {
        if (isFeatured !== false) {
          fatePoints = 0;
        } else {
          const nextFatePoints = fatePoints + 1;
          fatePoints = rules.maxFatePoints
            ? Math.min(rules.maxFatePoints, nextFatePoints)
            : nextFatePoints;
        }
      }

      // Reset pity counters after a 5-star
      fiveStarPity = 0;
      fourStarPity = 0;
    }
  }

  return {
    bannerHistory,
    fiveStarPulls,
    fourStarPulls,
    fiveStarPityValues,
    fourStarPityValues,
    pityState: {
      fiveStarPity,
      fourStarPity,
      guaranteed,
      fatePoints,
      radiantStreak,
      radianceActive: rules.hasCapturingRadiance
        ? radiantStreak >= (rules.radianceThreshold || 2)
        : false,
    },
    fiftyFiftyWon,
    fiftyFiftyLost,
  };
}

/**
 * Calculate current pity state from wish history
 */
export function calculatePityState(
  history: WishHistoryItem[],
  bannerType: BannerType
): PityState {
  return replayWishHistory(history, bannerType).pityState;
}

/**
 * Calculate statistics from wish history
 */
export function calculateStatistics(
  history: WishHistoryItem[],
  bannerType: BannerType
): BannerStats {
  const replay = replayWishHistory(history, bannerType);

  const totalPulls = replay.bannerHistory.length;
  const fiveStars = replay.fiveStarPulls.length;
  const fourStars = replay.fourStarPulls.length;
  const threeStars = totalPulls - fiveStars - fourStars;

  const fiveStarRate = totalPulls > 0 ? (fiveStars / totalPulls) * 100 : 0;
  const fourStarRate = totalPulls > 0 ? (fourStars / totalPulls) * 100 : 0;

  const averageFiveStarPity =
    replay.fiveStarPityValues.length > 0
      ? replay.fiveStarPityValues.reduce((sum, pity) => sum + pity, 0) /
        replay.fiveStarPityValues.length
      : 0;

  const averageFourStarPity =
    replay.fourStarPityValues.length > 0
      ? replay.fourStarPityValues.reduce((sum, pity) => sum + pity, 0) /
        replay.fourStarPityValues.length
      : 0;

  const totalFiftyFifty = replay.fiftyFiftyWon + replay.fiftyFiftyLost;
  const fiftyFiftyWinRate =
    totalFiftyFifty > 0 ? (replay.fiftyFiftyWon / totalFiftyFifty) * 100 : 0;

  return {
    totalPulls,
    fiveStars,
    fourStars,
    threeStars,
    fiveStarRate,
    fourStarRate,
    averageFiveStarPity,
    averageFourStarPity,
    fiftyFiftyWon: replay.fiftyFiftyWon,
    fiftyFiftyLost: replay.fiftyFiftyLost,
    fiftyFiftyWinRate,
  };
}

/**
 * Find all 5-star pulls with their pity counts
 */
export function findFiveStarPulls(
  history: WishHistoryItem[],
  bannerType: BannerType
): FiveStarPull[] {
  return replayWishHistory(history, bannerType).fiveStarPulls;
}

/**
 * Find all 4-star pulls
 */
export function findFourStarPulls(
  history: WishHistoryItem[],
  bannerType: BannerType
): WishHistoryItem[] {
  return replayWishHistory(history, bannerType).fourStarPulls.sort((a, b) =>
    new Date(b.time).getTime() - new Date(a.time).getTime()
  );
}

/**
 * Analyze complete wish history for a banner
 */
export function analyzeWishHistory(
  history: WishHistoryItem[],
  bannerType: BannerType
): WishAnalysis {
  const replay = replayWishHistory(history, bannerType);

  return {
    stats: calculateStatistics(history, bannerType),
    pityState: replay.pityState,
    fiveStarPulls: replay.fiveStarPulls,
    fourStarPulls: replay.fourStarPulls,
  };
}
