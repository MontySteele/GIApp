import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCharacters, useCharacter } from './useCharacters';
import { characterRepo } from '../repo/characterRepo';
import * as dexieReactHooks from 'dexie-react-hooks';
import type { Character } from '@/types';

// Mock the characterRepo
vi.mock('../repo/characterRepo', () => ({
  characterRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

// Mock character metadata (used by the selector for filtering)
vi.mock('../data/characterMetadata', () => ({
  getCharacterMetadata: vi.fn((key: string) => {
    const metadata: Record<string, { element: string; weaponType: string; rarity: number }> = {
      HuTao: { element: 'Pyro', weaponType: 'Polearm', rarity: 5 },
      Xingqiu: { element: 'Hydro', weaponType: 'Sword', rarity: 4 },
      Zhongli: { element: 'Geo', weaponType: 'Polearm', rarity: 5 },
    };
    return metadata[key] || null;
  }),
}));

const mockCharacters: Character[] = [
  {
    id: '1',
    key: 'HuTao',
    name: 'Hu Tao',
    level: 90,
    ascension: 6,
    constellation: 1,
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 5,
    talents: { normal: 10, skill: 10, burst: 10 },
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    key: 'Xingqiu',
    name: 'Xingqiu',
    level: 80,
    ascension: 5,
    constellation: 6,
    element: 'Hydro',
    weaponType: 'Sword',
    rarity: 4,
    talents: { normal: 6, skill: 9, burst: 12 },
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    key: 'Zhongli',
    name: 'Zhongli',
    level: 90,
    ascension: 6,
    constellation: 0,
    element: 'Geo',
    weaponType: 'Polearm',
    rarity: 5,
    talents: { normal: 1, skill: 9, burst: 9 },
    priority: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('useCharacters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(characterRepo.getAll).mockResolvedValue(mockCharacters);
  });

  describe('data loading', () => {
    it('returns empty array when loading', () => {
      vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(undefined);

      const { result } = renderHook(() => useCharacters());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.characters).toEqual([]);
    });

    it('returns characters when loaded', () => {
      vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(mockCharacters);

      const { result } = renderHook(() => useCharacters());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.characters).toHaveLength(3);
      expect(result.current.allCharacters).toHaveLength(3);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(mockCharacters);
    });

    it('filters by element', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { element: 'Pyro' } })
      );

      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].element).toBe('Pyro');
    });

    it('filters by weapon type', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { weaponType: 'Polearm' } })
      );

      expect(result.current.characters).toHaveLength(2);
    });

    it('filters by rarity', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { rarity: 5 } })
      );

      expect(result.current.characters).toHaveLength(2);
    });

    it('filters by priority', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { priority: 'high' } })
      );

      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].priority).toBe('high');
    });

    it('filters by search term', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { search: 'hu' } })
      );

      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].name).toBe('Hu Tao');
    });

    it('combines multiple filters', () => {
      const { result } = renderHook(() =>
        useCharacters({ filters: { element: 'Pyro', rarity: 5 } })
      );

      expect(result.current.characters).toHaveLength(1);
      expect(result.current.characters[0].name).toBe('Hu Tao');
    });
  });

  describe('sorting', () => {
    beforeEach(() => {
      vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(mockCharacters);
    });

    it('sorts by level descending', () => {
      const { result } = renderHook(() =>
        useCharacters({ sort: { field: 'level', direction: 'desc' } })
      );

      expect(result.current.characters[0].level).toBe(90);
      expect(result.current.characters[2].level).toBe(80);
    });

    it('sorts by level ascending', () => {
      const { result } = renderHook(() =>
        useCharacters({ sort: { field: 'level', direction: 'asc' } })
      );

      expect(result.current.characters[0].level).toBe(80);
    });

    it('sorts by name alphabetically', () => {
      const { result } = renderHook(() =>
        useCharacters({ sort: { field: 'name', direction: 'asc' } })
      );

      expect(result.current.characters[0].name).toBe('Hu Tao');
      expect(result.current.characters[2].name).toBe('Zhongli');
    });
  });

  describe('CRUD operations', () => {
    beforeEach(() => {
      vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(mockCharacters);
    });

    it('provides createCharacter function', () => {
      const { result } = renderHook(() => useCharacters());

      expect(typeof result.current.createCharacter).toBe('function');
    });

    it('provides updateCharacter function', () => {
      const { result } = renderHook(() => useCharacters());

      expect(typeof result.current.updateCharacter).toBe('function');
    });

    it('provides deleteCharacter function', () => {
      const { result } = renderHook(() => useCharacters());

      expect(typeof result.current.deleteCharacter).toBe('function');
    });

    it('calls repo.create when createCharacter is called', async () => {
      vi.mocked(characterRepo.create).mockResolvedValue('new-id');

      const { result } = renderHook(() => useCharacters());
      const newChar = {
        key: 'Keqing',
        name: 'Keqing',
        level: 80,
        ascension: 5,
        constellation: 2,
        element: 'Electro',
        weaponType: 'Sword' as const,
        rarity: 5 as const,
        talents: { normal: 8, skill: 8, burst: 8 },
        priority: 'medium' as const,
      };

      await result.current.createCharacter(newChar);

      expect(characterRepo.create).toHaveBeenCalledWith(newChar);
    });

    it('calls repo.update when updateCharacter is called', async () => {
      vi.mocked(characterRepo.update).mockResolvedValue();

      const { result } = renderHook(() => useCharacters());

      await result.current.updateCharacter('1', { level: 85 });

      expect(characterRepo.update).toHaveBeenCalledWith('1', { level: 85 });
    });

    it('calls repo.delete when deleteCharacter is called', async () => {
      vi.mocked(characterRepo.delete).mockResolvedValue();

      const { result } = renderHook(() => useCharacters());

      await result.current.deleteCharacter('1');

      expect(characterRepo.delete).toHaveBeenCalledWith('1');
    });
  });
});

describe('useCharacter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when id is undefined', () => {
    vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(undefined);

    const { result } = renderHook(() => useCharacter(undefined));

    expect(result.current.character).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns character when found', () => {
    vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(mockCharacters[0]);

    const { result } = renderHook(() => useCharacter('1'));

    expect(result.current.character).toEqual(mockCharacters[0]);
    expect(result.current.isLoading).toBe(false);
  });

  it('shows loading when id provided but character not yet loaded', () => {
    vi.mocked(dexieReactHooks.useLiveQuery).mockReturnValue(undefined);

    const { result } = renderHook(() => useCharacter('1'));

    expect(result.current.isLoading).toBe(true);
  });
});
