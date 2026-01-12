import { describe, it, expect } from 'vitest';
import {
  analyzeSimpleDeficitPriority,
  getDeficitRecommendation,
} from './deficitPriority';
import type { GroupedMaterials } from './multiCharacterCalculator';
import type { MaterialRequirement } from './ascensionCalculator';

describe('deficitPriority', () => {
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
    weekly: [],
    crown: [],
  });

  describe('analyzeSimpleDeficitPriority', () => {
    it('returns empty priorities when no deficits', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [createMaterial({ deficit: 0 })];

      const result = analyzeSimpleDeficitPriority(grouped);

      expect(result.priorities).toHaveLength(0);
      expect(result.highPriority).toHaveLength(0);
      expect(result.mediumPriority).toHaveLength(0);
      expect(result.lowPriority).toHaveLength(0);
    });

    it('identifies materials with deficits', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'freedom', name: 'Guide to Freedom', deficit: 5 }),
        createMaterial({ key: 'gold', name: 'Guide to Gold', deficit: 10 }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      expect(result.priorities).toHaveLength(2);
    });

    it('sorts by priority score (higher deficits first)', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'low', name: 'Low Deficit', deficit: 5 }),
        createMaterial({ key: 'high', name: 'High Deficit', deficit: 50 }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      expect(result.priorities[0]?.material.name).toBe('High Deficit');
      expect(result.priorities[1]?.material.name).toBe('Low Deficit');
    });

    it('weighs talent books higher than common materials', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'talent', name: 'Talent Book', deficit: 10, category: 'talent' }),
      ];
      grouped.common = [
        createMaterial({ key: 'common', name: 'Common Mat', deficit: 10, category: 'common' }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      // Talent should have higher priority due to category weight
      const talentPriority = result.priorities.find((p) => p.material.name === 'Talent Book');
      const commonPriority = result.priorities.find((p) => p.material.name === 'Common Mat');

      expect(talentPriority?.priorityScore).toBeGreaterThan(commonPriority?.priorityScore ?? 0);
    });

    it('categorizes into high/medium/low priority', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'high', name: 'High', deficit: 100 }),
        createMaterial({ key: 'med', name: 'Medium', deficit: 30 }),
        createMaterial({ key: 'low', name: 'Low', deficit: 5 }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      expect(result.highPriority.length).toBeGreaterThan(0);
      expect(result.priorities.length).toBe(3);
    });

    it('sets correct farming type based on category', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [createMaterial({ key: 'talent', name: 'Talent', deficit: 10 })];
      grouped.boss = [createMaterial({ key: 'boss', name: 'Boss', deficit: 10, category: 'boss' })];
      grouped.localSpecialty = [
        createMaterial({ key: 'local', name: 'Local', deficit: 10, category: 'localSpecialty' }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      const talentMat = result.priorities.find((p) => p.material.name === 'Talent');
      const bossMat = result.priorities.find((p) => p.material.name === 'Boss');
      const localMat = result.priorities.find((p) => p.material.name === 'Local');

      expect(talentMat?.farmingType).toBe('domain');
      expect(bossMat?.farmingType).toBe('boss');
      expect(localMat?.farmingType).toBe('overworld');
    });

    it('sets mostBlockingMaterial to highest priority', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'high', name: 'High Priority', deficit: 100 }),
        createMaterial({ key: 'low', name: 'Low Priority', deficit: 5 }),
      ];

      const result = analyzeSimpleDeficitPriority(grouped);

      expect(result.mostBlockingMaterial?.material.name).toBe('High Priority');
    });
  });

  describe('getDeficitRecommendation', () => {
    it('returns positive message when no deficits', () => {
      const summary = analyzeSimpleDeficitPriority(createEmptyGroupedMaterials());
      const recommendation = getDeficitRecommendation(summary);

      expect(recommendation).toContain('All materials collected');
    });

    it('returns recommendation for highest priority material', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.talent = [
        createMaterial({ key: 'freedom', name: 'Guide to Freedom', deficit: 50 }),
      ];

      const summary = analyzeSimpleDeficitPriority(grouped);
      const recommendation = getDeficitRecommendation(summary);

      expect(recommendation).toContain('Guide to Freedom');
      expect(recommendation).toContain('domain');
    });

    it('includes farming type in recommendation', () => {
      const grouped = createEmptyGroupedMaterials();
      grouped.boss = [
        createMaterial({ key: 'boss', name: 'Boss Material', deficit: 50, category: 'boss' }),
      ];

      const summary = analyzeSimpleDeficitPriority(grouped);
      const recommendation = getDeficitRecommendation(summary);

      expect(recommendation).toContain('boss');
    });
  });
});
