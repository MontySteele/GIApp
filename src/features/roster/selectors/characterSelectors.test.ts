import { describe, expect, it } from 'vitest';
import { filterAndSortCharacters, type CharacterQuery } from './characterSelectors';
import type { Character } from '@/types';

const baseCharacter: Omit<Character, 'id' | 'createdAt' | 'updatedAt'> = {
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: {
    auto: 1,
    skill: 1,
    burst: 1,
  },
  weapon: {
    key: 'Test Weapon',
    level: 1,
    ascension: 0,
    refinement: 1,
  },
  artifacts: [],
  notes: '',
  priority: 'main',
  teamIds: [],
};

const makeCharacter = (overrides: Partial<Character>): Character => ({
  id: `character-${Math.random().toString(36).slice(2)}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...baseCharacter,
  ...overrides,
});

describe('filterAndSortCharacters', () => {
  const characters: Character[] = [
    makeCharacter({ key: 'Furina', priority: 'main', level: 90 }),
    makeCharacter({ key: 'Neuvillette', priority: 'main', level: 80 }),
    makeCharacter({ key: 'Kazuha', priority: 'secondary', level: 90 }),
    makeCharacter({ key: 'Bennett', priority: 'bench', level: 60 }),
  ];

  it('filters by element, weapon type, rarity, and priority together', () => {
    const query: CharacterQuery = {
      filters: {
        element: 'Hydro',
        weaponType: 'Sword',
        rarity: 5,
        priority: 'main',
      },
    };

    const result = filterAndSortCharacters(characters, query);
    expect(result.map((c) => c.key)).toEqual(['Furina']);
  });

  it('filters by search term (case-insensitive) combined with priority', () => {
    const query: CharacterQuery = {
      filters: {
        priority: 'main',
        search: 'neuvi',
      },
    };

    const result = filterAndSortCharacters(characters, query);
    expect(result.map((c) => c.key)).toEqual(['Neuvillette']);
  });

  it('sorts by level descending and keeps stability for ties', () => {
    const result = filterAndSortCharacters(characters, {
      sort: { field: 'level', direction: 'desc' },
    });

    // Furina and Kazuha share the same level and should preserve their original order
    expect(result.map((c) => c.key)).toEqual(['Furina', 'Kazuha', 'Neuvillette', 'Bennett']);
  });

  it('sorts by priority order while keeping stability', () => {
    const reordered = [
      characters[1], // Neuvillette (main)
      characters[0], // Furina (main)
      characters[2], // Kazuha (secondary)
      characters[3], // Bennett (bench)
    ];

    const result = filterAndSortCharacters(reordered, {
      sort: { field: 'priority', direction: 'asc' },
    });

    expect(result.map((c) => c.key)).toEqual(['Neuvillette', 'Furina', 'Kazuha', 'Bennett']);
  });

  describe('characters with missing metadata', () => {
    const charsWithUnknown = [
      ...characters,
      makeCharacter({ key: 'TotallyFakeChar', priority: 'bench', level: 50 }),
    ];

    it('characters with no metadata still appear in unfiltered results', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {});

      expect(result.map((c) => c.key)).toContain('TotallyFakeChar');
      expect(result).toHaveLength(5);
    });

    it('characters with no metadata are excluded by element filter (not crash)', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        filters: { element: 'Hydro' },
      });

      expect(result.map((c) => c.key)).not.toContain('TotallyFakeChar');
      // Should still return valid Hydro characters
      expect(result.map((c) => c.key)).toContain('Furina');
    });

    it('characters with no metadata are excluded by weaponType filter', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        filters: { weaponType: 'Sword' },
      });

      expect(result.map((c) => c.key)).not.toContain('TotallyFakeChar');
    });

    it('characters with no metadata are excluded by rarity filter', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        filters: { rarity: 5 },
      });

      expect(result.map((c) => c.key)).not.toContain('TotallyFakeChar');
    });

    it('search filter works for characters without metadata', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        filters: { search: 'fake' },
      });

      expect(result.map((c) => c.key)).toEqual(['TotallyFakeChar']);
    });

    it('characters with no metadata can be sorted by level', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        sort: { field: 'level', direction: 'asc' },
      });

      expect(result[0].key).toBe('TotallyFakeChar'); // level 50, lowest
    });

    it('characters with no metadata can be sorted by name', () => {
      const result = filterAndSortCharacters(charsWithUnknown, {
        sort: { field: 'name', direction: 'asc' },
      });

      // T comes after N, K, F, B alphabetically
      expect(result.map((c) => c.key)).toEqual([
        'Bennett', 'Furina', 'Kazuha', 'Neuvillette', 'TotallyFakeChar',
      ]);
    });
  });
});
