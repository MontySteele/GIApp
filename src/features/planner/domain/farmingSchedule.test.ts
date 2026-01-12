import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractBookSeries,
  getNextFarmingDay,
  daysUntil,
  analyzeFarmingSchedule,
  getFarmingSummary,
  type DayName,
} from './farmingSchedule';
import type { MaterialRequirement } from './ascensionCalculator';

describe('farmingSchedule', () => {
  describe('extractBookSeries', () => {
    it('extracts series from "Guide to Freedom" format', () => {
      expect(extractBookSeries('Guide to Freedom')).toBe('Freedom');
      expect(extractBookSeries('Teachings of Freedom')).toBe('Freedom');
      expect(extractBookSeries('Philosophies of Freedom')).toBe('Freedom');
    });

    it('extracts series from "Philosophies of Diligence" format', () => {
      expect(extractBookSeries('Philosophies of Diligence')).toBe('Diligence');
      expect(extractBookSeries('Guide to Diligence')).toBe('Diligence');
    });

    it('extracts series with partial match', () => {
      expect(extractBookSeries('Freedom Talent Book')).toBe('Freedom');
      expect(extractBookSeries('Gold Book (Purple)')).toBe('Gold');
    });

    it('handles case insensitivity', () => {
      expect(extractBookSeries('guide to FREEDOM')).toBe('Freedom');
      expect(extractBookSeries('PHILOSOPHIES OF GOLD')).toBe('Gold');
    });

    it('returns null for non-talent-book materials', () => {
      expect(extractBookSeries('Mora')).toBeNull();
      expect(extractBookSeries("Hero's Wit")).toBeNull();
      expect(extractBookSeries('Slime Condensate')).toBeNull();
    });

    it('handles all region talent books', () => {
      // Mondstadt
      expect(extractBookSeries('Guide to Freedom')).toBe('Freedom');
      expect(extractBookSeries('Guide to Resistance')).toBe('Resistance');
      expect(extractBookSeries('Guide to Ballad')).toBe('Ballad');

      // Liyue
      expect(extractBookSeries('Guide to Prosperity')).toBe('Prosperity');
      expect(extractBookSeries('Guide to Diligence')).toBe('Diligence');
      expect(extractBookSeries('Guide to Gold')).toBe('Gold');

      // Inazuma
      expect(extractBookSeries('Guide to Transience')).toBe('Transience');
      expect(extractBookSeries('Guide to Elegance')).toBe('Elegance');
      expect(extractBookSeries('Guide to Light')).toBe('Light');

      // Sumeru
      expect(extractBookSeries('Guide to Admonition')).toBe('Admonition');
      expect(extractBookSeries('Guide to Ingenuity')).toBe('Ingenuity');
      expect(extractBookSeries('Guide to Praxis')).toBe('Praxis');

      // Fontaine
      expect(extractBookSeries('Guide to Equity')).toBe('Equity');
      expect(extractBookSeries('Guide to Justice')).toBe('Justice');
      expect(extractBookSeries('Guide to Order')).toBe('Order');

      // Natlan
      expect(extractBookSeries('Guide to Contention')).toBe('Contention');
      expect(extractBookSeries('Guide to Kindling')).toBe('Kindling');
      expect(extractBookSeries('Guide to Conflict')).toBe('Conflict');
    });
  });

  describe('getNextFarmingDay', () => {
    it('returns Sunday if today is Sunday (all available)', () => {
      expect(getNextFarmingDay('Freedom', 'Sunday')).toBe('Sunday');
      expect(getNextFarmingDay('Gold', 'Sunday')).toBe('Sunday');
    });

    it('returns today if material is available', () => {
      // Freedom: Mon, Thu, Sun
      expect(getNextFarmingDay('Freedom', 'Monday')).toBe('Monday');
      expect(getNextFarmingDay('Freedom', 'Thursday')).toBe('Thursday');

      // Resistance: Tue, Fri, Sun
      expect(getNextFarmingDay('Resistance', 'Tuesday')).toBe('Tuesday');
      expect(getNextFarmingDay('Resistance', 'Friday')).toBe('Friday');

      // Ballad: Wed, Sat, Sun
      expect(getNextFarmingDay('Ballad', 'Wednesday')).toBe('Wednesday');
      expect(getNextFarmingDay('Ballad', 'Saturday')).toBe('Saturday');
    });

    it('returns next available day if not available today', () => {
      // Freedom: Mon, Thu, Sun
      expect(getNextFarmingDay('Freedom', 'Tuesday')).toBe('Thursday');
      expect(getNextFarmingDay('Freedom', 'Wednesday')).toBe('Thursday');
      expect(getNextFarmingDay('Freedom', 'Friday')).toBe('Sunday');
      expect(getNextFarmingDay('Freedom', 'Saturday')).toBe('Sunday');

      // Resistance: Tue, Fri, Sun
      expect(getNextFarmingDay('Resistance', 'Monday')).toBe('Tuesday');
      expect(getNextFarmingDay('Resistance', 'Wednesday')).toBe('Friday');
      expect(getNextFarmingDay('Resistance', 'Saturday')).toBe('Sunday');
    });

    it('returns null for unknown series', () => {
      expect(getNextFarmingDay('Unknown', 'Monday')).toBeNull();
    });
  });

  describe('daysUntil', () => {
    it('returns 0 for same day', () => {
      expect(daysUntil('Monday', 'Monday')).toBe(0);
      expect(daysUntil('Sunday', 'Sunday')).toBe(0);
    });

    it('calculates days forward in the week', () => {
      expect(daysUntil('Wednesday', 'Monday')).toBe(2);
      expect(daysUntil('Friday', 'Monday')).toBe(4);
      expect(daysUntil('Saturday', 'Monday')).toBe(5);
    });

    it('wraps around the week', () => {
      expect(daysUntil('Monday', 'Friday')).toBe(3);
      expect(daysUntil('Monday', 'Saturday')).toBe(2);
      expect(daysUntil('Tuesday', 'Saturday')).toBe(3);
    });
  });

  describe('analyzeFarmingSchedule', () => {
    // Mock Date to control "today"
    const mockDate = (dayIndex: number) => {
      // dayIndex: 0 = Sunday, 1 = Monday, etc.
      const mockNow = new Date(2024, 0, 7 + dayIndex); // Jan 7, 2024 is Sunday
      vi.setSystemTime(mockNow);
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty farmToday when no materials have deficit', () => {
      mockDate(1); // Monday

      const materials: MaterialRequirement[] = [
        {
          key: 'freedom',
          name: 'Guide to Freedom',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 10,
          deficit: 0,
        },
      ];

      const result = analyzeFarmingSchedule(materials);
      expect(result.farmToday).toHaveLength(0);
      expect(result.totalDeficit).toBe(0);
    });

    it('identifies materials available today on Monday', () => {
      mockDate(1); // Monday

      const materials: MaterialRequirement[] = [
        {
          key: 'freedom',
          name: 'Guide to Freedom',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 5,
          deficit: 5,
        },
        {
          key: 'resistance',
          name: 'Guide to Resistance',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 3,
          deficit: 7,
        },
      ];

      const result = analyzeFarmingSchedule(materials);

      // Freedom is available on Monday
      expect(result.farmToday).toHaveLength(1);
      expect(result.farmToday[0]?.series).toBe('Freedom');

      // Resistance is NOT available on Monday (Tue, Fri, Sun)
      expect(result.waitFor.Tuesday).toHaveLength(1);
      expect(result.waitFor.Tuesday[0]?.series).toBe('Resistance');
    });

    it('all materials available on Sunday', () => {
      mockDate(0); // Sunday

      const materials: MaterialRequirement[] = [
        {
          key: 'freedom',
          name: 'Guide to Freedom',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 5,
          deficit: 5,
        },
        {
          key: 'resistance',
          name: 'Guide to Resistance',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 3,
          deficit: 7,
        },
        {
          key: 'gold',
          name: 'Guide to Gold',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 2,
          deficit: 8,
        },
      ];

      const result = analyzeFarmingSchedule(materials);

      // All should be available on Sunday
      expect(result.farmToday).toHaveLength(3);
      expect(result.dayName).toBe('Sunday');
    });

    it('assigns priority based on deficit and tier', () => {
      mockDate(1); // Monday

      const materials: MaterialRequirement[] = [
        {
          key: 'freedom-high',
          name: 'Philosophies of Freedom',
          category: 'talent',
          tier: 3,
          required: 20,
          owned: 5,
          deficit: 15, // High deficit + tier 3 = high priority
        },
        {
          key: 'freedom-low',
          name: 'Teachings of Freedom',
          category: 'talent',
          tier: 1,
          required: 5,
          owned: 3,
          deficit: 2, // Low deficit + tier 1 = low priority
        },
      ];

      const result = analyzeFarmingSchedule(materials);

      expect(result.farmToday).toHaveLength(2);
      // High priority should come first
      expect(result.farmToday[0]?.priority).toBe('high');
      expect(result.farmToday[1]?.priority).toBe('low');
    });

    it('calculates correct days until available', () => {
      mockDate(3); // Wednesday

      const materials: MaterialRequirement[] = [
        {
          key: 'freedom',
          name: 'Guide to Freedom',
          category: 'talent',
          tier: 2,
          required: 10,
          owned: 5,
          deficit: 5,
        },
      ];

      const result = analyzeFarmingSchedule(materials);

      // Freedom available Thu (1 day away from Wed)
      expect(result.waitFor.Thursday[0]?.daysUntilAvailable).toBe(1);
    });
  });

  describe('getFarmingSummary', () => {
    it('returns appropriate message when no materials to farm today', () => {
      const schedule = {
        farmToday: [],
        waitFor: {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
        },
        dayName: 'Monday' as DayName,
        totalDeficit: 0,
      };

      expect(getFarmingSummary(schedule)).toBe('No talent materials available to farm today.');
    });

    it('returns series-focused message for regular days', () => {
      const schedule = {
        farmToday: [
          {
            material: { key: 'test', name: 'Test', category: 'talent' as const, required: 10, owned: 5, deficit: 5 },
            series: 'Freedom',
            region: 'Mondstadt',
            availableToday: true,
            nextAvailableDay: 'Monday' as DayName,
            daysUntilAvailable: 0,
            priority: 'high' as const,
          },
        ],
        waitFor: {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
        },
        dayName: 'Monday' as DayName,
        totalDeficit: 5,
      };

      const summary = getFarmingSummary(schedule);
      expect(summary).toContain('Freedom');
      expect(summary).toContain('Mondstadt');
    });

    it('mentions all domains available on Sunday', () => {
      const schedule = {
        farmToday: [
          {
            material: { key: 'test', name: 'Test', category: 'talent' as const, required: 10, owned: 5, deficit: 5 },
            series: 'Freedom',
            region: 'Mondstadt',
            availableToday: true,
            nextAvailableDay: 'Sunday' as DayName,
            daysUntilAvailable: 0,
            priority: 'high' as const,
          },
        ],
        waitFor: {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
        },
        dayName: 'Sunday' as DayName,
        totalDeficit: 5,
      };

      const summary = getFarmingSummary(schedule);
      expect(summary).toContain('All domains available');
    });
  });
});
