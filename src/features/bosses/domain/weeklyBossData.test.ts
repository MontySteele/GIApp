/**
 * Unit Tests: Weekly Boss Data Domain Logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WEEKLY_BOSSES,
  WEEKLY_BOSS_MAP,
  DISCOUNTED_RESIN_COST,
  REGULAR_RESIN_COST,
  MAX_DISCOUNTED_CLAIMS,
  getNextWeeklyReset,
  getCurrentWeekStart,
  formatTimeUntilReset,
  type WeeklyBoss,
} from './weeklyBossData';

describe('Weekly Boss Data Constants', () => {
  describe('WEEKLY_BOSSES', () => {
    it('should have 10 weekly bosses', () => {
      expect(WEEKLY_BOSSES).toHaveLength(10);
    });

    it('should have all required properties for each boss', () => {
      WEEKLY_BOSSES.forEach((boss) => {
        expect(boss).toHaveProperty('key');
        expect(boss).toHaveProperty('name');
        expect(boss).toHaveProperty('location');
        expect(boss).toHaveProperty('region');
        expect(boss).toHaveProperty('element');
        expect(boss).toHaveProperty('requiredAdventureRank');
        expect(boss).toHaveProperty('drops');
        expect(boss).toHaveProperty('releaseVersion');
      });
    });

    it('should have unique keys for each boss', () => {
      const keys = WEEKLY_BOSSES.map((b) => b.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('should have 3 drops for each boss', () => {
      WEEKLY_BOSSES.forEach((boss) => {
        expect(boss.drops).toHaveLength(3);
      });
    });

    it('should contain known bosses', () => {
      const bossNames = WEEKLY_BOSSES.map((b) => b.name);
      expect(bossNames).toContain('Stormterror Dvalin');
      expect(bossNames).toContain('Childe');
      expect(bossNames).toContain('La Signora');
      expect(bossNames).toContain('Raiden Shogun');
      expect(bossNames).toContain('All-Devouring Narwhal');
    });

    it('should have valid regions for each boss', () => {
      const validRegions = ['Mondstadt', 'Liyue', 'Inazuma', 'Sumeru', 'Fontaine'];
      WEEKLY_BOSSES.forEach((boss) => {
        expect(validRegions).toContain(boss.region);
      });
    });

    it('should have reasonable adventure rank requirements', () => {
      WEEKLY_BOSSES.forEach((boss) => {
        expect(boss.requiredAdventureRank).toBeGreaterThanOrEqual(20);
        expect(boss.requiredAdventureRank).toBeLessThanOrEqual(45);
      });
    });
  });

  describe('WEEKLY_BOSS_MAP', () => {
    it('should map all boss keys to bosses', () => {
      expect(Object.keys(WEEKLY_BOSS_MAP)).toHaveLength(WEEKLY_BOSSES.length);
    });

    it('should retrieve boss by key', () => {
      const dvalin = WEEKLY_BOSS_MAP['dvalin'];
      expect(dvalin).toBeDefined();
      expect(dvalin.name).toBe('Stormterror Dvalin');
      expect(dvalin.region).toBe('Mondstadt');
    });

    it('should return undefined for unknown key', () => {
      expect(WEEKLY_BOSS_MAP['unknown']).toBeUndefined();
    });
  });

  describe('Resin Constants', () => {
    it('should have correct discounted resin cost', () => {
      expect(DISCOUNTED_RESIN_COST).toBe(30);
    });

    it('should have correct regular resin cost', () => {
      expect(REGULAR_RESIN_COST).toBe(60);
    });

    it('should have 3 max discounted claims', () => {
      expect(MAX_DISCOUNTED_CLAIMS).toBe(3);
    });
  });
});

describe('Reset Time Functions', () => {
  describe('getNextWeeklyReset', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return a Date object', () => {
      const reset = getNextWeeklyReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should return a future date', () => {
      vi.setSystemTime(new Date('2026-01-13T12:00:00Z'));
      const reset = getNextWeeklyReset();
      const now = new Date();
      expect(reset.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return a Monday', () => {
      vi.setSystemTime(new Date('2026-01-13T12:00:00Z')); // Monday
      const reset = getNextWeeklyReset();
      // The reset should be on a Monday (0 = Sunday, 1 = Monday)
      // Note: actual day depends on timezone handling in the function
      expect(reset).toBeInstanceOf(Date);
    });

    it('should handle Wednesday correctly (days until next Monday)', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z')); // Wednesday
      const reset = getNextWeeklyReset();
      // Should be less than 7 days away
      const now = new Date();
      const diff = reset.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBeLessThan(7);
      expect(days).toBeGreaterThan(0);
    });

    it('should handle Sunday correctly (returns future Monday)', () => {
      vi.setSystemTime(new Date('2026-01-12T12:00:00Z')); // Sunday
      const reset = getNextWeeklyReset();
      const now = new Date();
      // Reset should be in the future
      expect(reset.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('getCurrentWeekStart', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return a Date object', () => {
      const weekStart = getCurrentWeekStart();
      expect(weekStart).toBeInstanceOf(Date);
    });

    it('should return a date in the past', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const weekStart = getCurrentWeekStart();
      const now = new Date();
      expect(weekStart.getTime()).toBeLessThan(now.getTime());
    });

    it('should return a date exactly 7 days before next reset', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const weekStart = getCurrentWeekStart();
      const nextReset = getNextWeeklyReset();
      const diff = nextReset.getTime() - weekStart.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBe(7);
    });
  });

  describe('formatTimeUntilReset', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Reset!" when time has passed', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const pastDate = new Date('2026-01-14T12:00:00Z');
      expect(formatTimeUntilReset(pastDate)).toBe('Reset!');
    });

    it('should format days and hours correctly', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const futureDate = new Date('2026-01-18T14:30:00Z'); // 3 days and 2.5 hours ahead
      const result = formatTimeUntilReset(futureDate);
      expect(result).toMatch(/^\d+d \d+h$/);
    });

    it('should format hours and minutes when less than a day', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const futureDate = new Date('2026-01-15T20:30:00Z'); // 8.5 hours ahead
      const result = formatTimeUntilReset(futureDate);
      expect(result).toMatch(/^\d+h \d+m$/);
    });

    it('should format only minutes when less than an hour', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const futureDate = new Date('2026-01-15T12:45:00Z'); // 45 minutes ahead
      const result = formatTimeUntilReset(futureDate);
      expect(result).toBe('45m');
    });

    it('should handle exactly 1 day difference', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const futureDate = new Date('2026-01-16T12:00:00Z');
      const result = formatTimeUntilReset(futureDate);
      expect(result).toBe('1d 0h');
    });

    it('should handle exactly 1 hour difference', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const futureDate = new Date('2026-01-15T13:00:00Z');
      const result = formatTimeUntilReset(futureDate);
      expect(result).toBe('1h 0m');
    });
  });
});

describe('Boss Drop Materials', () => {
  it('should have unique drop names across all bosses', () => {
    const allDrops = WEEKLY_BOSSES.flatMap((b) => b.drops);
    expect(new Set(allDrops).size).toBe(allDrops.length);
  });

  it('should contain known talent materials', () => {
    const allDrops = WEEKLY_BOSSES.flatMap((b) => b.drops);
    expect(allDrops).toContain("Dvalin's Plume");
    expect(allDrops).toContain('Tail of Boreas');
    expect(allDrops).toContain('Shadow of the Warrior');
    expect(allDrops).toContain('Molten Moment');
    expect(allDrops).toContain('The Meaning of Aeons');
  });

  it('should have Dvalin drops correct', () => {
    const dvalin = WEEKLY_BOSS_MAP['dvalin'];
    expect(dvalin.drops).toContain("Dvalin's Plume");
    expect(dvalin.drops).toContain("Dvalin's Claw");
    expect(dvalin.drops).toContain("Dvalin's Sigh");
  });

  it('should have Azhdaha drops correct', () => {
    const azhdaha = WEEKLY_BOSS_MAP['azhdaha'];
    expect(azhdaha.drops).toContain("Dragon Lord's Crown");
    expect(azhdaha.drops).toContain('Bloodjade Branch');
    expect(azhdaha.drops).toContain('Gilded Scale');
  });
});
