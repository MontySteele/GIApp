import { describe, it, expect } from 'vitest';
import {
  analyzeWishHistory,
  calculatePityState,
  calculateStatistics,
  findFiveStarPulls,
  findFourStarPulls,
  type WishHistoryItem,
  type BannerStats,
  type PityState,
} from './wishAnalyzer';

const basePityState: PityState = {
  fiveStarPity: 0,
  fourStarPity: 0,
  guaranteed: false,
  fatePoints: 0,
  radiantStreak: 0,
  radianceActive: false,
};

describe('Wish Analyzer', () => {
  describe('calculatePityState', () => {
    it('should calculate pity state from empty history', () => {
      const history: WishHistoryItem[] = [];
      const pityState = calculatePityState(history, 'character');

      expect(pityState).toEqual(basePityState);
    });

    it('should calculate pity after pulling some 3-stars', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Debate Club', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Harbinger', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.fiveStarPity).toBe(3);
      expect(pityState.fourStarPity).toBe(3);
      expect(pityState.guaranteed).toBe(false);
      expect(pityState.fatePoints).toBe(0);
      expect(pityState.radiantStreak).toBe(0);
    });

    it('should reset 4-star pity after getting a 4-star', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Debate Club', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.fiveStarPity).toBe(3);
      expect(pityState.fourStarPity).toBe(2);
      expect(pityState.radiantStreak).toBe(0);
    });

    it('should reset 5-star pity after getting a 5-star', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: true },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.fiveStarPity).toBe(1);
      expect(pityState.fourStarPity).toBe(1);
      expect(pityState.radiantStreak).toBe(0);
    });

    it('should set guaranteed flag when losing 50/50', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Diluc', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: false },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.guaranteed).toBe(true);
      expect(pityState.radiantStreak).toBe(1);
      expect(pityState.radianceActive).toBe(false);
    });

    it('should clear guaranteed flag when winning featured', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: true },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-02', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.guaranteed).toBe(false);
      expect(pityState.radiantStreak).toBe(0);
    });

    it('should only count pulls from the specified banner', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'weapon' },
        { id: '3', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const pityState = calculatePityState(history, 'character');

      expect(pityState.fiveStarPity).toBe(2);
    });

    it('should track capturing radiance after three consecutive losses', () => {
      // With threshold=3, need 3 consecutive losses to activate radiance
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Keqing', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: false },
        { id: '2', name: 'Mona', rarity: 5, itemType: 'character', time: '2024-01-02', banner: 'character', isFeatured: false },
        { id: '3', name: 'Diluc', rarity: 5, itemType: 'character', time: '2024-01-03', banner: 'character', isFeatured: false },
        { id: '4', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-04', banner: 'character' },
      ];

      const pityState = calculatePityState(history, 'character');

      expect(pityState.radiantStreak).toBe(3);
      expect(pityState.radianceActive).toBe(true);
      expect(pityState.guaranteed).toBe(true); // Still guaranteed after consecutive losses
    });

    it('should track fate points on weapon banner', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Skyward Harp', rarity: 5, itemType: 'weapon', time: '2024-01-01', banner: 'weapon', isFeatured: false },
        { id: '2', name: 'Lost Prayer', rarity: 5, itemType: 'weapon', time: '2024-01-02', banner: 'weapon', isFeatured: false },
        { id: '3', name: 'Aqua Simulacra', rarity: 5, itemType: 'weapon', time: '2024-01-03', banner: 'weapon', isFeatured: true },
      ];

      const pityState = calculatePityState(history, 'weapon');

      expect(pityState.fatePoints).toBe(0);
      expect(pityState.fiveStarPity).toBe(0);
      expect(pityState.fourStarPity).toBe(0);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics from empty history', () => {
      const history: WishHistoryItem[] = [];
      const stats = calculateStatistics(history, 'character');

      expect(stats.totalPulls).toBe(0);
      expect(stats.fiveStars).toBe(0);
      expect(stats.fourStars).toBe(0);
      expect(stats.threeStars).toBe(0);
      expect(stats.fiveStarRate).toBe(0);
      expect(stats.fourStarRate).toBe(0);
    });

    it('should count pulls by rarity', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '4', name: 'Debate Club', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const stats = calculateStatistics(history, 'character');

      expect(stats.totalPulls).toBe(4);
      expect(stats.fiveStars).toBe(1);
      expect(stats.fourStars).toBe(1);
      expect(stats.threeStars).toBe(2);
    });

    it('should calculate accurate rates', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '4', name: 'Debate Club', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const stats = calculateStatistics(history, 'character');

      expect(stats.fiveStarRate).toBe(25); // 1/4 = 25%
      expect(stats.fourStarRate).toBe(25); // 1/4 = 25%
    });

    it('should calculate average pity for 5-stars', () => {
      const history: WishHistoryItem[] = [
        // First 5-star at pull 80
        ...Array(80).fill(null).map((_, i) => ({
          id: `3-${i}`,
          name: 'Cool Steel',
          rarity: 3,
          itemType: 'weapon' as const,
          time: '2024-01-01',
          banner: 'character' as const,
        })),
        { id: '5-1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        // Second 5-star at pull 60
        ...Array(60).fill(null).map((_, i) => ({
          id: `3-2-${i}`,
          name: 'Cool Steel',
          rarity: 3,
          itemType: 'weapon' as const,
          time: '2024-01-01',
          banner: 'character' as const,
        })),
        { id: '5-2', name: 'Neuvillette', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      const stats = calculateStatistics(history, 'character');

      expect(stats.averageFiveStarPity).toBe(71); // (81 + 61) / 2 = 71 (pity includes the 5-star itself)
    });

    it('should calculate 50/50 win rate', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: true },
        { id: '2', name: 'Diluc', rarity: 5, itemType: 'character', time: '2024-01-02', banner: 'character', isFeatured: false },
        { id: '3', name: 'Neuvillette', rarity: 5, itemType: 'character', time: '2024-01-03', banner: 'character', isFeatured: true },
        { id: '4', name: 'Mona', rarity: 5, itemType: 'character', time: '2024-01-04', banner: 'character', isFeatured: false },
      ];
      const stats = calculateStatistics(history, 'character');

      expect(stats.fiftyFiftyWon).toBe(2);
      expect(stats.fiftyFiftyLost).toBe(2);
      expect(stats.fiftyFiftyWinRate).toBe(50);
    });

    it('should only count pulls from the specified banner', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Aqua Simulacra', rarity: 5, itemType: 'weapon', time: '2024-01-01', banner: 'weapon' },
      ];
      const stats = calculateStatistics(history, 'character');

      expect(stats.totalPulls).toBe(1);
      expect(stats.fiveStars).toBe(1);
    });
  });

  describe('findFiveStarPulls', () => {
    it('should find all 5-star pulls', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Neuvillette', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      const fiveStars = findFiveStarPulls(history, 'character');

      expect(fiveStars).toHaveLength(2);
      expect(fiveStars[0].name).toBe('Furina');
      expect(fiveStars[1].name).toBe('Neuvillette');
    });

    it('should include pity count for each 5-star', () => {
      const history: WishHistoryItem[] = [
        ...Array(80).fill(null).map((_, i) => ({
          id: `3-${i}`,
          name: 'Cool Steel',
          rarity: 3,
          itemType: 'weapon' as const,
          time: '2024-01-01',
          banner: 'character' as const,
        })),
        { id: '5-1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      const fiveStars = findFiveStarPulls(history, 'character');

      expect(fiveStars[0].pityCount).toBe(81); // 80 + the 5-star pull itself
    });
  });

  describe('findFourStarPulls', () => {
    it('should find all 4-star pulls', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Bennett', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      const fourStars = findFourStarPulls(history, 'character');

      expect(fourStars).toHaveLength(2);
      expect(fourStars[0].name).toBe('Fischl');
      expect(fourStars[1].name).toBe('Bennett');
    });
  });

  describe('analyzeWishHistory', () => {
    it('should return complete analysis', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: true },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '3', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      const analysis = analyzeWishHistory(history, 'character');

      expect(analysis.stats.totalPulls).toBe(3);
      expect(analysis.pityState.fiveStarPity).toBeGreaterThan(0);
      expect(analysis.fiveStarPulls).toHaveLength(1);
    });
  });
});
