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
}

export interface WishAnalysis {
  stats: BannerStats;
  pityState: PityState;
  fiveStarPulls: FiveStarPull[];
  fourStarPulls: WishHistoryItem[];
}

/**
 * Calculate current pity state from wish history
 */
export function calculatePityState(
  history: WishHistoryItem[],
  bannerType: BannerType
): PityState {
  // Filter to specific banner and sort by time (newest first)
  // Use array index as tiebreaker for stable sort when timestamps are equal
  const bannerHistory = history
    .map((wish, index) => ({ ...wish, originalIndex: index }))
    .filter((wish) => wish.banner === bannerType)
    .sort((a, b) => {
      const timeDiff = new Date(b.time).getTime() - new Date(a.time).getTime();
      if (timeDiff !== 0) return timeDiff;
      // If times are equal, higher index (later in array) is more recent
      return b.originalIndex - a.originalIndex;
    });

  let fiveStarPity = 0;
  let fourStarPity = 0;
  let guaranteed = false;

  // Find most recent 5-star to determine guaranteed status
  const mostRecent5Star = bannerHistory.find((wish) => wish.rarity === 5);
  if (mostRecent5Star && (bannerType === 'character' || bannerType === 'chronicled')) {
    if (mostRecent5Star.isFeatured === false) {
      guaranteed = true;
    } else if (mostRecent5Star.isFeatured === true) {
      guaranteed = false;
    }
  }

  // Count pity from most recent (iterating from newest to oldest)
  for (const wish of bannerHistory) {
    if (wish.rarity === 5) {
      // Stop counting, this is where pity resets
      break;
    }
    fiveStarPity++;
  }

  // Count 4-star pity separately
  for (const wish of bannerHistory) {
    if (wish.rarity >= 4) {
      // Stop counting, hit a 4-star or 5-star
      break;
    }
    fourStarPity++;
  }

  return {
    fiveStarPity,
    fourStarPity,
    guaranteed,
  };
}

/**
 * Calculate statistics from wish history
 */
export function calculateStatistics(
  history: WishHistoryItem[],
  bannerType: BannerType
): BannerStats {
  // Filter to specific banner
  const bannerHistory = history.filter((wish) => wish.banner === bannerType);

  const totalPulls = bannerHistory.length;
  const fiveStars = bannerHistory.filter((w) => w.rarity === 5).length;
  const fourStars = bannerHistory.filter((w) => w.rarity === 4).length;
  const threeStars = bannerHistory.filter((w) => w.rarity === 3).length;

  const fiveStarRate = totalPulls > 0 ? (fiveStars / totalPulls) * 100 : 0;
  const fourStarRate = totalPulls > 0 ? (fourStars / totalPulls) * 100 : 0;

  // Calculate average pity for 5-stars
  const fiveStarPulls = findFiveStarPulls(bannerHistory, bannerType);
  const averageFiveStarPity =
    fiveStarPulls.length > 0
      ? fiveStarPulls.reduce((sum, pull) => sum + pull.pityCount, 0) / fiveStarPulls.length
      : 0;

  // Calculate average pity for 4-stars
  const fourStarPulls = findFourStarPulls(bannerHistory, bannerType);
  const fourStarPityValues = calculateFourStarPityCounts(bannerHistory);
  const averageFourStarPity =
    fourStarPityValues.length > 0
      ? fourStarPityValues.reduce((sum, pity) => sum + pity, 0) / fourStarPityValues.length
      : 0;

  // Calculate 50/50 win rate (only for character/chronicled banner)
  let fiftyFiftyWon = 0;
  let fiftyFiftyLost = 0;

  if (bannerType === 'character' || bannerType === 'chronicled') {
    for (const pull of fiveStarPulls) {
      if (pull.isFeatured === true) {
        fiftyFiftyWon++;
      } else if (pull.isFeatured === false) {
        fiftyFiftyLost++;
      }
    }
  }

  const totalFiftyFifty = fiftyFiftyWon + fiftyFiftyLost;
  const fiftyFiftyWinRate =
    totalFiftyFifty > 0 ? (fiftyFiftyWon / totalFiftyFifty) * 100 : 0;

  return {
    totalPulls,
    fiveStars,
    fourStars,
    threeStars,
    fiveStarRate,
    fourStarRate,
    averageFiveStarPity,
    averageFourStarPity,
    fiftyFiftyWon,
    fiftyFiftyLost,
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
  const bannerHistory = history
    .filter((wish) => wish.banner === bannerType)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const fiveStarPulls: FiveStarPull[] = [];
  let pityCount = 0;

  for (const wish of bannerHistory) {
    pityCount++;

    if (wish.rarity === 5) {
      fiveStarPulls.push({
        ...wish,
        pityCount,
      });
      pityCount = 0; // Reset after 5-star
    }
  }

  return fiveStarPulls;
}

/**
 * Find all 4-star pulls
 */
export function findFourStarPulls(
  history: WishHistoryItem[],
  bannerType: BannerType
): WishHistoryItem[] {
  return history
    .filter((wish) => wish.banner === bannerType && wish.rarity === 4)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

/**
 * Helper to calculate 4-star pity counts
 */
function calculateFourStarPityCounts(history: WishHistoryItem[]): number[] {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const pityCounts: number[] = [];
  let pityCount = 0;

  for (const wish of sortedHistory) {
    pityCount++;

    if (wish.rarity >= 4) {
      // Both 4* and 5* reset 4-star pity
      if (wish.rarity === 4) {
        pityCounts.push(pityCount);
      }
      pityCount = 0;
    }
  }

  return pityCounts;
}

/**
 * Analyze complete wish history for a banner
 */
export function analyzeWishHistory(
  history: WishHistoryItem[],
  bannerType: BannerType
): WishAnalysis {
  return {
    stats: calculateStatistics(history, bannerType),
    pityState: calculatePityState(history, bannerType),
    fiveStarPulls: findFiveStarPulls(history, bannerType),
    fourStarPulls: findFourStarPulls(history, bannerType),
  };
}
