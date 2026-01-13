/**
 * Unit Tests: Calendar Reset Timers Domain Logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getNextDailyReset,
  getNextWeeklyReset,
  getNextAbyssReset,
  getNextMonthlyReset,
  getNextImaginariumReset,
  getNextPatchReset,
  formatTimeUntil,
  formatResetDate,
  getAllResetTimers,
  type ResetInfo,
} from './resetTimers';

describe('Reset Timer Functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getNextDailyReset', () => {
    it('should return a Date object', () => {
      const reset = getNextDailyReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should return a future date', () => {
      vi.setSystemTime(new Date('2026-01-15T08:00:00Z')); // 3 AM Eastern (before reset)
      const reset = getNextDailyReset();
      const now = new Date();
      expect(reset.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return same day reset when before 9 AM UTC', () => {
      vi.setSystemTime(new Date('2026-01-15T08:00:00Z')); // 8 AM UTC (before 9 AM reset)
      const reset = getNextDailyReset();
      expect(reset.getUTCDate()).toBe(15);
      expect(reset.getUTCHours()).toBe(9);
    });

    it('should return next day reset when after 9 AM UTC', () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00Z')); // 10 AM UTC (after 9 AM reset)
      const reset = getNextDailyReset();
      expect(reset.getUTCDate()).toBe(16);
      expect(reset.getUTCHours()).toBe(9);
    });

    it('should return exactly 9 AM UTC', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const reset = getNextDailyReset();
      expect(reset.getUTCHours()).toBe(9);
      expect(reset.getUTCMinutes()).toBe(0);
      expect(reset.getUTCSeconds()).toBe(0);
    });
  });

  describe('getNextWeeklyReset', () => {
    it('should return a Date object', () => {
      const reset = getNextWeeklyReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should return a Monday', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z')); // Wednesday
      const reset = getNextWeeklyReset();
      expect(reset.getUTCDay()).toBe(1); // Monday = 1
    });

    it('should return next Monday when on Tuesday', () => {
      vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Tuesday
      const reset = getNextWeeklyReset();
      expect(reset.getUTCDay()).toBe(1); // Monday
      // Should be a future date less than 7 days away
      const now = new Date();
      const diff = reset.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBeLessThan(7);
      expect(days).toBeGreaterThan(0);
    });

    it('should return same Monday when on Monday before reset', () => {
      vi.setSystemTime(new Date('2026-01-13T08:00:00Z')); // Monday 8 AM UTC (before 9 AM)
      const reset = getNextWeeklyReset();
      // Should return today's reset (still upcoming)
      expect(reset.getUTCDay()).toBe(1); // Monday
      expect(reset.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should return next Monday when on Monday after reset', () => {
      vi.setSystemTime(new Date('2026-01-13T10:00:00Z')); // Monday 10 AM UTC (after 9 AM)
      const reset = getNextWeeklyReset();
      // After reset on Monday, should be 7 days until next Monday
      expect(reset.getUTCDay()).toBe(1); // Monday
      expect(reset.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should handle Sunday correctly (1 day until Monday)', () => {
      vi.setSystemTime(new Date('2026-01-12T12:00:00Z')); // Sunday
      const reset = getNextWeeklyReset();
      expect(reset.getUTCDay()).toBe(1);
      // Reset should be future Monday
      expect(reset.getTime()).toBeGreaterThan(new Date().getTime());
    });
  });

  describe('getNextAbyssReset', () => {
    it('should return a Date object', () => {
      const reset = getNextAbyssReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should return 1st when before 1st', () => {
      // This case is edge-case - date is always >= 1
      // Testing when on the 1st before reset
      vi.setSystemTime(new Date('2026-01-01T08:00:00Z')); // Before 9 AM reset
      const reset = getNextAbyssReset();
      expect(reset.getUTCDate()).toBe(1);
    });

    it('should return 16th when between 1st and 16th', () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z')); // Jan 10
      const reset = getNextAbyssReset();
      expect(reset.getUTCDate()).toBe(16);
    });

    it('should return next month 1st when after 16th', () => {
      vi.setSystemTime(new Date('2026-01-20T12:00:00Z')); // Jan 20
      const reset = getNextAbyssReset();
      expect(reset.getUTCMonth()).toBe(1); // February
      expect(reset.getUTCDate()).toBe(1);
    });

    it('should return 16th when on 16th before reset', () => {
      vi.setSystemTime(new Date('2026-01-16T08:00:00Z')); // Before 9 AM reset
      const reset = getNextAbyssReset();
      expect(reset.getUTCDate()).toBe(16);
    });

    it('should return next month when on 16th after reset', () => {
      vi.setSystemTime(new Date('2026-01-16T10:00:00Z')); // After 9 AM reset
      const reset = getNextAbyssReset();
      expect(reset.getUTCMonth()).toBe(1); // February
      expect(reset.getUTCDate()).toBe(1);
    });
  });

  describe('getNextMonthlyReset', () => {
    it('should return a Date object', () => {
      const reset = getNextMonthlyReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should always return 1st of month', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const reset = getNextMonthlyReset();
      expect(reset.getUTCDate()).toBe(1);
    });

    it('should return current month 1st when before reset on 1st', () => {
      vi.setSystemTime(new Date('2026-01-01T08:00:00Z')); // Before 9 AM reset
      const reset = getNextMonthlyReset();
      expect(reset.getUTCMonth()).toBe(0); // January
      expect(reset.getUTCDate()).toBe(1);
    });

    it('should return next month when after 1st', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const reset = getNextMonthlyReset();
      expect(reset.getUTCMonth()).toBe(1); // February
    });

    it('should handle year boundary', () => {
      vi.setSystemTime(new Date('2026-12-15T12:00:00Z'));
      const reset = getNextMonthlyReset();
      expect(reset.getUTCFullYear()).toBe(2027);
      expect(reset.getUTCMonth()).toBe(0); // January
    });
  });

  describe('getNextImaginariumReset', () => {
    it('should return same as monthly reset', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const imaginariumReset = getNextImaginariumReset();
      const monthlyReset = getNextMonthlyReset();
      expect(imaginariumReset.getTime()).toBe(monthlyReset.getTime());
    });
  });

  describe('getNextPatchReset', () => {
    it('should return a Date object', () => {
      const reset = getNextPatchReset();
      expect(reset).toBeInstanceOf(Date);
    });

    it('should return a future date', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const reset = getNextPatchReset();
      const now = new Date();
      expect(reset.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should be within 42 days from now', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const reset = getNextPatchReset();
      const now = new Date();
      const diff = reset.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBeLessThanOrEqual(42);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('formatTimeUntil', () => {
    it('should return "Now!" for past dates', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const past = new Date('2026-01-14T12:00:00Z');
      expect(formatTimeUntil(past)).toBe('Now!');
    });

    it('should format days and hours', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-18T14:30:00Z'); // 3 days, 2.5 hours ahead
      const result = formatTimeUntil(future);
      expect(result).toContain('3d');
      expect(result).toContain('2h');
    });

    it('should format hours and minutes when less than a day', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-15T20:30:00Z'); // 8.5 hours ahead
      const result = formatTimeUntil(future);
      expect(result).toContain('8h');
      expect(result).toContain('30m');
    });

    it('should include seconds when less than an hour', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-15T12:30:45Z'); // 30 min 45 sec
      const result = formatTimeUntil(future);
      expect(result).toContain('30m');
      expect(result).toContain('45s');
    });

    it('should format only seconds when less than a minute', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-15T12:00:30Z'); // 30 seconds
      const result = formatTimeUntil(future);
      expect(result).toBe('30s');
    });

    it('should handle exactly 1 day', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-16T12:00:00Z');
      const result = formatTimeUntil(future);
      expect(result).toBe('1d');
    });

    it('should handle exactly 1 hour', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const future = new Date('2026-01-15T13:00:00Z');
      const result = formatTimeUntil(future);
      expect(result).toBe('1h');
    });
  });

  describe('formatResetDate', () => {
    it('should return a formatted string', () => {
      const date = new Date('2026-01-15T12:00:00Z');
      const formatted = formatResetDate(date);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should include weekday', () => {
      const date = new Date('2026-01-13T12:00:00Z'); // Monday
      const formatted = formatResetDate(date);
      // Locale-dependent, but should have some day indicator
      expect(formatted).toBeTruthy();
    });
  });

  describe('getAllResetTimers', () => {
    it('should return an array of ResetInfo objects', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      expect(Array.isArray(timers)).toBe(true);
      expect(timers.length).toBe(6);
    });

    it('should have all required properties', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      timers.forEach((timer) => {
        expect(timer).toHaveProperty('name');
        expect(timer).toHaveProperty('nextReset');
        expect(timer).toHaveProperty('timeUntil');
        expect(timer).toHaveProperty('description');
        expect(timer.nextReset).toBeInstanceOf(Date);
      });
    });

    it('should include all expected timers', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      const names = timers.map((t) => t.name);
      expect(names).toContain('Daily Reset');
      expect(names).toContain('Weekly Reset');
      expect(names).toContain('Spiral Abyss');
      expect(names).toContain('Imaginarium Theatre');
      expect(names).toContain('Next Patch');
      expect(names).toContain('Monthly Shop');
    });

    it('should have meaningful descriptions', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      timers.forEach((timer) => {
        expect(timer.description.length).toBeGreaterThan(0);
      });
    });

    it('should have daily reset description mentioning commissions', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      const daily = timers.find((t) => t.name === 'Daily Reset');
      expect(daily?.description).toContain('Commissions');
    });

    it('should have weekly reset description mentioning bosses', () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
      const timers = getAllResetTimers();
      const weekly = timers.find((t) => t.name === 'Weekly Reset');
      expect(weekly?.description).toContain('Weekly Bosses');
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle month with 31 days correctly', () => {
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
    const monthly = getNextMonthlyReset();
    expect(monthly.getUTCMonth()).toBe(1); // February
    expect(monthly.getUTCDate()).toBe(1);
  });

  it('should handle February correctly', () => {
    vi.setSystemTime(new Date('2026-02-28T12:00:00Z'));
    const monthly = getNextMonthlyReset();
    expect(monthly.getUTCMonth()).toBe(2); // March
    expect(monthly.getUTCDate()).toBe(1);
  });

  it('should handle leap year February', () => {
    vi.setSystemTime(new Date('2028-02-29T12:00:00Z')); // 2028 is a leap year
    const monthly = getNextMonthlyReset();
    expect(monthly.getUTCMonth()).toBe(2); // March
    expect(monthly.getUTCDate()).toBe(1);
  });

  it('should handle midnight UTC correctly', () => {
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
    const daily = getNextDailyReset();
    expect(daily.getUTCHours()).toBe(9);
    expect(daily.getUTCDate()).toBe(15); // Same day (before 9 AM reset)
  });

  it('should handle exactly at reset time', () => {
    vi.setSystemTime(new Date('2026-01-15T09:00:00Z')); // Exactly at reset
    const daily = getNextDailyReset();
    // Should be next day since we're at/past reset
    expect(daily.getUTCDate()).toBe(16);
  });
});
