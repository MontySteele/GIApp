import { describe, it, expect, vi } from 'vitest';
import {
  analyzeResinEfficiency,
  getEfficiencySummary,
} from './resinEfficiency';
import type { GroupedMaterials } from './multiCharacterCalculator';
import type { MaterialRequirement } from './ascensionCalculator';

describe('resinEfficiency', () => {
  const createMaterial = (
    overrides: Partial<MaterialRequirement> = {}
  ): MaterialRequirement => ({
    key: 'test',
    name: 'Test Material',
    category: 'talent',
    required: 10,
    owned: 0,
    deficit: 10,
    ...overrides,
  });

  const createEmptyGroupedMaterials = (): GroupedMaterials => ({
    mora: [],
    exp: [],
    boss: [],
    gem: [],
    localSpecialty: [],
    common: [],
    talent: [],
    weapon: [],
    artifact: [],
    weekly: [],
    crown: [],
  });

  describe('analyzeResinEfficiency', () => {
    it('returns empty activities when no deficits', () => {
      const grouped = createEmptyGroupedMaterials();

      const result = analyzeResinEfficiency(grouped);

      expect(result.activities).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
      expect(result.totalResinNeeded).toBe(0);
    });

    it('identifies talent domain farming need', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({
          key: 'freedom',
          name: 'Guide to Freedom',
          deficit: 10,
          tier: 2,
          category: 'talent',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      const talentActivity = result.activities.find((a) => a.type === 'talent');
      expect(talentActivity).toBeDefined();
      expect(talentActivity?.name).toBe('Talent Domain');
      expect(talentActivity?.resinCost).toBe(20);
    });

    it('identifies world boss farming need', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.boss = [
        createMaterial({
          key: 'boss-mat',
          name: 'Boss Material',
          deficit: 10,
          category: 'boss',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      const bossActivity = result.activities.find((a) => a.type === 'boss');
      expect(bossActivity).toBeDefined();
      expect(bossActivity?.name).toBe('World Boss');
      expect(bossActivity?.resinCost).toBe(40);
    });

    it('identifies weekly boss farming need', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.weekly = [
        createMaterial({
          key: 'weekly-mat',
          name: 'Weekly Material',
          deficit: 3,
          category: 'weekly',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      const weeklyActivity = result.activities.find((a) => a.type === 'weekly');
      expect(weeklyActivity).toBeDefined();
      expect(weeklyActivity?.name).toBe('Weekly Boss');
    });

    it('calculates total resin needed', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({
          key: 'freedom',
          name: 'Guide to Freedom',
          deficit: 20,
          tier: 2,
          category: 'talent',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      expect(result.totalResinNeeded).toBeGreaterThan(0);
      expect(result.totalDaysNeeded).toBeGreaterThan(0);
    });

    it('generates recommendations prioritizing weekly bosses', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({
          key: 'freedom',
          name: 'Guide to Freedom',
          deficit: 20,
          tier: 2,
          category: 'talent',
        }),
      ];
      grouped.weekly = [
        createMaterial({
          key: 'weekly-mat',
          name: 'Weekly Material',
          deficit: 3,
          category: 'weekly',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      // Weekly should be in recommendations (time-gated priority)
      const weeklyRec = result.recommendations.find(
        (r) => r.activity.type === 'weekly'
      );
      expect(weeklyRec).toBeDefined();
    });

    it('sets optimalActivity to highest efficiency', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({
          key: 'freedom',
          name: 'Guide to Freedom',
          deficit: 50,
          tier: 2,
          category: 'talent',
        }),
      ];
      grouped.boss = [
        createMaterial({
          key: 'boss-mat',
          name: 'Boss Material',
          deficit: 10,
          category: 'boss',
        }),
      ];

      const result = analyzeResinEfficiency(grouped);

      expect(result.optimalActivity).toBeDefined();
      // Activities should be sorted by efficiency
      expect(result.activities[0]).toBe(result.optimalActivity);
    });
  });

  describe('getEfficiencySummary', () => {
    it('returns positive message when no activities', () => {
      const summary = analyzeResinEfficiency(createEmptyGroupedMaterials());
      const text = getEfficiencySummary(summary);

      expect(text).toContain('No farming needed');
    });

    it('returns recommendation for optimal activity', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({
          key: 'freedom',
          name: 'Guide to Freedom',
          deficit: 30,
          tier: 2,
          category: 'talent',
        }),
      ];

      const summary = analyzeResinEfficiency(grouped);
      const text = getEfficiencySummary(summary);

      expect(text).toContain('Best use of resin');
      expect(text).toContain('resin');
      expect(text).toContain('days');
    });
  });
});

describe('analyzeResinEfficiency server region', () => {
  it("uses the region's game day to decide whether talent domains are open today", () => {
    vi.useFakeTimers();
    // Sunday 23:00Z: still Sunday on NA (18:00), already Monday on Asia (07:00)
    vi.setSystemTime(new Date('2026-01-11T23:00:00Z'));
    try {
      const grouped: GroupedMaterials = {
        mora: [], exp: [], boss: [], gem: [], localSpecialty: [], common: [], weapon: [], artifact: [], weekly: [], crown: [],
        talent: [
          { key: 'freedom', name: 'Guide to Freedom', category: 'talent' as const, tier: 2, required: 10, owned: 0, deficit: 10 },
        ],
      };
      const talentReason = (region: 'na' | 'asia') =>
        analyzeResinEfficiency(grouped, region).recommendations.find((r) => r.activity.type === 'talent')?.reason;
      expect(talentReason('na')).toBe('Sunday - all books available!');
      expect(talentReason('asia')).toBe('Time-gated by schedule');
    } finally {
      vi.useRealTimers();
    }
  });
});
