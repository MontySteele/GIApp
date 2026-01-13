/**
 * Tests for shared filter/sort utilities
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  matchesSearch,
  matchesFilter,
  matchesAllFilters,
  filterItems,
  getNestedValue,
  compareValues,
  sortItems,
  sortByMultiple,
  filterAndSort,
  sortByRarity,
  sortByPriority,
  PRIORITY_ORDER,
  ELEMENT_ORDER,
} from './filterSort';

describe('filterSort utilities', () => {
  describe('normalizeSearchText', () => {
    it('converts to lowercase and trims', () => {
      expect(normalizeSearchText('  Hello World  ')).toBe('hello world');
      expect(normalizeSearchText('TEST')).toBe('test');
    });
  });

  describe('matchesSearch', () => {
    const items = [
      { name: 'Raiden Shogun', element: 'Electro' },
      { name: 'Bennett', element: 'Pyro' },
      { name: 'Xingqiu', element: 'Hydro' },
    ];

    it('returns true for empty query', () => {
      expect(matchesSearch(items[0], '', ['name', 'element'])).toBe(true);
      expect(matchesSearch(items[0], '  ', ['name', 'element'])).toBe(true);
    });

    it('matches on specified fields', () => {
      expect(matchesSearch(items[0], 'raiden', ['name'])).toBe(true);
      expect(matchesSearch(items[0], 'electro', ['element'])).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(matchesSearch(items[0], 'RAIDEN', ['name'])).toBe(true);
    });

    it('returns false when no fields match', () => {
      expect(matchesSearch(items[0], 'bennett', ['name'])).toBe(false);
    });

    it('handles null/undefined field values', () => {
      const item = { name: 'Test', element: null };
      expect(matchesSearch(item, 'test', ['name', 'element' as keyof typeof item])).toBe(true);
      expect(matchesSearch(item, 'null', ['name', 'element' as keyof typeof item])).toBe(false);
    });
  });

  describe('matchesFilter', () => {
    it('returns true for empty filter value', () => {
      expect(matchesFilter({ name: 'test' }, { field: 'name', value: '' })).toBe(true);
      expect(matchesFilter({ name: 'test' }, { field: 'name', value: undefined })).toBe(true);
      expect(matchesFilter({ name: 'test' }, { field: 'name', value: null })).toBe(true);
    });

    it('equals operator works', () => {
      expect(matchesFilter({ rarity: 5 }, { field: 'rarity', value: 5, operator: 'equals' })).toBe(true);
      expect(matchesFilter({ rarity: 4 }, { field: 'rarity', value: 5, operator: 'equals' })).toBe(false);
    });

    it('includes operator works for strings', () => {
      expect(matchesFilter({ name: 'Raiden Shogun' }, { field: 'name', value: 'raiden', operator: 'includes' })).toBe(true);
    });

    it('includes operator works for arrays', () => {
      expect(matchesFilter({ tags: ['dps', 'electro'] }, { field: 'tags', value: 'dps', operator: 'includes' })).toBe(true);
      expect(matchesFilter({ tags: ['dps', 'electro'] }, { field: 'tags', value: 'support', operator: 'includes' })).toBe(false);
    });

    it('comparison operators work', () => {
      expect(matchesFilter({ level: 90 }, { field: 'level', value: 80, operator: 'gt' })).toBe(true);
      expect(matchesFilter({ level: 70 }, { field: 'level', value: 80, operator: 'gt' })).toBe(false);
      expect(matchesFilter({ level: 90 }, { field: 'level', value: 90, operator: 'gte' })).toBe(true);
      expect(matchesFilter({ level: 80 }, { field: 'level', value: 90, operator: 'lt' })).toBe(true);
      expect(matchesFilter({ level: 90 }, { field: 'level', value: 90, operator: 'lte' })).toBe(true);
    });

    it('startsWith and endsWith work', () => {
      expect(matchesFilter({ name: 'Raiden Shogun' }, { field: 'name', value: 'Raiden', operator: 'startsWith' })).toBe(true);
      expect(matchesFilter({ name: 'Raiden Shogun' }, { field: 'name', value: 'Shogun', operator: 'endsWith' })).toBe(true);
    });
  });

  describe('matchesAllFilters', () => {
    it('returns true when all filters match', () => {
      const item = { rarity: 5, element: 'Electro' };
      const filters = [
        { field: 'rarity' as const, value: 5 },
        { field: 'element' as const, value: 'Electro' },
      ];
      expect(matchesAllFilters(item, filters)).toBe(true);
    });

    it('returns false when any filter fails', () => {
      const item = { rarity: 4, element: 'Electro' };
      const filters = [
        { field: 'rarity' as const, value: 5 },
        { field: 'element' as const, value: 'Electro' },
      ];
      expect(matchesAllFilters(item, filters)).toBe(false);
    });
  });

  describe('filterItems', () => {
    const items = [
      { name: 'Raiden', rarity: 5, element: 'Electro' },
      { name: 'Bennett', rarity: 4, element: 'Pyro' },
      { name: 'Xingqiu', rarity: 4, element: 'Hydro' },
    ];

    it('filters by criteria', () => {
      const result = filterItems(items, [{ field: 'rarity', value: 5 }]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Raiden');
    });

    it('combines search and filters', () => {
      const result = filterItems(items, [{ field: 'rarity', value: 4 }], 'xing', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Xingqiu');
    });
  });

  describe('getNestedValue', () => {
    it('gets simple property', () => {
      expect(getNestedValue({ name: 'test' }, 'name')).toBe('test');
    });

    it('gets nested property', () => {
      const obj = { user: { profile: { name: 'test' } } };
      expect(getNestedValue(obj, 'user.profile.name')).toBe('test');
    });

    it('returns undefined for missing path', () => {
      expect(getNestedValue({ name: 'test' }, 'missing')).toBeUndefined();
      expect(getNestedValue({ name: 'test' }, 'a.b.c')).toBeUndefined();
    });
  });

  describe('compareValues', () => {
    it('handles null/undefined values', () => {
      expect(compareValues(null, 'a')).toBe(1);
      expect(compareValues('a', null)).toBe(-1);
      expect(compareValues(undefined, 'a')).toBe(1);
    });

    it('compares strings case-insensitively', () => {
      expect(compareValues('Apple', 'banana')).toBeLessThan(0);
      expect(compareValues('banana', 'Apple')).toBeGreaterThan(0);
    });

    it('compares numbers', () => {
      expect(compareValues(10, 5)).toBe(5);
      expect(compareValues(5, 10)).toBe(-5);
    });

    it('compares dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-06-01');
      expect(compareValues(date1, date2)).toBeLessThan(0);
    });
  });

  describe('sortItems', () => {
    const items = [
      { name: 'Xingqiu', rarity: 4 },
      { name: 'Raiden', rarity: 5 },
      { name: 'Bennett', rarity: 4 },
    ];

    it('sorts ascending', () => {
      const result = sortItems(items, { field: 'name', direction: 'asc' });
      expect(result.map((i) => i.name)).toEqual(['Bennett', 'Raiden', 'Xingqiu']);
    });

    it('sorts descending', () => {
      const result = sortItems(items, { field: 'rarity', direction: 'desc' });
      expect(result[0].name).toBe('Raiden');
    });

    it('does not mutate original array', () => {
      const original = [...items];
      sortItems(items, { field: 'name', direction: 'asc' });
      expect(items).toEqual(original);
    });
  });

  describe('sortByMultiple', () => {
    const items = [
      { name: 'Xingqiu', rarity: 4, level: 90 },
      { name: 'Bennett', rarity: 4, level: 80 },
      { name: 'Raiden', rarity: 5, level: 90 },
    ];

    it('sorts by primary then secondary field', () => {
      const result = sortByMultiple(items, [
        { field: 'rarity', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ]);
      expect(result.map((i) => i.name)).toEqual(['Raiden', 'Bennett', 'Xingqiu']);
    });
  });

  describe('filterAndSort', () => {
    const items = [
      { name: 'Raiden', rarity: 5, element: 'Electro' },
      { name: 'Bennett', rarity: 4, element: 'Pyro' },
      { name: 'Xingqiu', rarity: 4, element: 'Hydro' },
    ];

    it('filters and sorts in one operation', () => {
      const result = filterAndSort(items, {
        filters: [{ field: 'rarity', value: 4 }],
        sort: { field: 'name', direction: 'asc' },
      });
      expect(result.map((i) => i.name)).toEqual(['Bennett', 'Xingqiu']);
    });
  });

  describe('sortByRarity', () => {
    it('sorts by rarity descending by default', () => {
      const items = [
        { name: 'A', rarity: 4 },
        { name: 'B', rarity: 5 },
        { name: 'C', rarity: 3 },
      ];
      const result = sortByRarity(items);
      expect(result.map((i) => i.rarity)).toEqual([5, 4, 3]);
    });
  });

  describe('sortByPriority', () => {
    it('sorts by priority order', () => {
      const items = [
        { name: 'A', priority: 'support' },
        { name: 'B', priority: 'main-dps' },
        { name: 'C', priority: 'sub-dps' },
      ];
      const result = sortByPriority(items);
      expect(result.map((i) => i.priority)).toEqual(['main-dps', 'sub-dps', 'support']);
    });

    it('handles missing priority', () => {
      const items = [
        { name: 'A', priority: undefined },
        { name: 'B', priority: 'main-dps' },
      ];
      const result = sortByPriority(items);
      expect(result[0].priority).toBe('main-dps');
    });
  });

  describe('constants', () => {
    it('PRIORITY_ORDER has expected values', () => {
      expect(PRIORITY_ORDER['main-dps']).toBeLessThan(PRIORITY_ORDER['sub-dps']);
      expect(PRIORITY_ORDER['sub-dps']).toBeLessThan(PRIORITY_ORDER['support']);
    });

    it('ELEMENT_ORDER has all elements', () => {
      expect(Object.keys(ELEMENT_ORDER)).toContain('Pyro');
      expect(Object.keys(ELEMENT_ORDER)).toContain('Hydro');
      expect(Object.keys(ELEMENT_ORDER)).toContain('Dendro');
    });
  });
});
