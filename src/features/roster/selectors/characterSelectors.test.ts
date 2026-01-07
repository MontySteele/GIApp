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
});
