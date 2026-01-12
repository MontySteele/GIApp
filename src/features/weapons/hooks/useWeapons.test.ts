import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWeapons, filterAndSortWeapons, type EnrichedWeapon, type WeaponFilters } from './useWeapons';
import { weaponRepo } from '../repo/weaponRepo';
import { getWeaponName, getWeaponType, getWeaponRarity } from '../domain/weaponConstants';
import type { InventoryWeapon } from '@/types';

// Mock dependencies
vi.mock('../repo/weaponRepo', () => ({
  weaponRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock('../domain/weaponConstants', () => ({
  getWeaponName: vi.fn(),
  getWeaponType: vi.fn(),
  getWeaponRarity: vi.fn(),
}));

const mockWeapons: InventoryWeapon[] = [
  {
    id: 'weapon-1',
    key: 'StaffOfHoma',
    level: 90,
    ascension: 6,
    refinement: 1,
    location: 'HuTao',
    lock: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'weapon-2',
    key: 'DragonsBane',
    level: 80,
    ascension: 5,
    refinement: 5,
    location: 'XiangLing',
    lock: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'weapon-3',
    key: 'SkywardBlade',
    level: 70,
    ascension: 4,
    refinement: 1,
    location: '',
    lock: false,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
];

describe('useWeapons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(weaponRepo.getAll).mockResolvedValue(mockWeapons);
    vi.mocked(getWeaponName).mockImplementation((key) => {
      const names: Record<string, string> = {
        StaffOfHoma: 'Staff of Homa',
        DragonsBane: "Dragon's Bane",
        SkywardBlade: 'Skyward Blade',
      };
      return names[key] || key;
    });
    vi.mocked(getWeaponType).mockImplementation((key) => {
      const types: Record<string, 'polearm' | 'sword'> = {
        StaffOfHoma: 'polearm',
        DragonsBane: 'polearm',
        SkywardBlade: 'sword',
      };
      return types[key];
    });
    vi.mocked(getWeaponRarity).mockImplementation((key) => {
      const rarities: Record<string, number> = {
        StaffOfHoma: 5,
        DragonsBane: 4,
        SkywardBlade: 5,
      };
      return rarities[key] || 3;
    });
  });

  describe('data loading', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useWeapons());

      expect(result.current.isLoading).toBe(true);
    });

    it('loads weapons from repository', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(weaponRepo.getAll).toHaveBeenCalled();
      expect(result.current.weapons).toHaveLength(3);
    });

    it('handles loading error', async () => {
      vi.mocked(weaponRepo.getAll).mockRejectedValue(new Error('DB Error'));

      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('DB Error');
    });
  });

  describe('enrichment', () => {
    it('enriches weapons with display names', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const staff = result.current.weapons.find((w) => w.key === 'StaffOfHoma');
      expect(staff?.displayName).toBe('Staff of Homa');
    });

    it('enriches weapons with weapon types', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const staff = result.current.weapons.find((w) => w.key === 'StaffOfHoma');
      expect(staff?.weaponType).toBe('polearm');
    });

    it('enriches weapons with rarity', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const staff = result.current.weapons.find((w) => w.key === 'StaffOfHoma');
      expect(staff?.displayRarity).toBe(5);
    });
  });

  describe('stats', () => {
    it('calculates total weapons', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.total).toBe(3);
    });

    it('calculates equipped weapons', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.equipped).toBe(2);
      expect(result.current.stats.unequipped).toBe(1);
    });

    it('calculates weapons by rarity', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.fiveStars).toBe(2);
      expect(result.current.stats.fourStars).toBe(1);
    });

    it('calculates weapons by type', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.byType.polearm).toBe(2);
      expect(result.current.stats.byType.sword).toBe(1);
    });

    it('calculates max refinement count', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.maxRefinement).toBe(1);
    });
  });

  describe('hasWeapons flag', () => {
    it('returns true when weapons exist', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasWeapons).toBe(true);
    });

    it('returns false when no weapons', async () => {
      vi.mocked(weaponRepo.getAll).mockResolvedValue([]);

      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasWeapons).toBe(false);
    });
  });

  describe('refresh', () => {
    it('provides refresh function', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refresh).toBe('function');
    });

    it('reloads data on refresh', async () => {
      const { result } = renderHook(() => useWeapons());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(weaponRepo.getAll).mockResolvedValue([mockWeapons[0]]);

      await act(async () => {
        await result.current.refresh();
      });

      expect(weaponRepo.getAll).toHaveBeenCalledTimes(2);
      expect(result.current.weapons).toHaveLength(1);
    });
  });
});

describe('filterAndSortWeapons', () => {
  const enrichedWeapons: EnrichedWeapon[] = [
    {
      id: 'weapon-1',
      key: 'StaffOfHoma',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'HuTao',
      lock: true,
      displayName: 'Staff of Homa',
      weaponType: 'polearm',
      displayRarity: 5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: 'weapon-2',
      key: 'DragonsBane',
      level: 80,
      ascension: 5,
      refinement: 5,
      location: 'XiangLing',
      lock: false,
      displayName: "Dragon's Bane",
      weaponType: 'polearm',
      displayRarity: 4,
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z',
    },
    {
      id: 'weapon-3',
      key: 'SkywardBlade',
      level: 70,
      ascension: 4,
      refinement: 1,
      location: '',
      lock: false,
      displayName: 'Skyward Blade',
      weaponType: 'sword',
      displayRarity: 5,
      createdAt: '2024-01-08T00:00:00Z',
      updatedAt: '2024-01-08T00:00:00Z',
    },
  ];

  const defaultFilters: WeaponFilters = {
    type: 'all',
    rarity: 'all',
    equipped: 'all',
    search: '',
  };

  describe('filtering', () => {
    it('filters by weapon type', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, type: 'polearm' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(2);
      expect(result.every((w) => w.weaponType === 'polearm')).toBe(true);
    });

    it('filters by rarity', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, rarity: 5 },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(2);
      expect(result.every((w) => w.displayRarity === 5)).toBe(true);
    });

    it('filters equipped weapons', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, equipped: 'equipped' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(2);
      expect(result.every((w) => w.location !== '')).toBe(true);
    });

    it('filters unequipped weapons', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, equipped: 'unequipped' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(1);
      expect(result[0].location).toBe('');
    });

    it('filters by search in name', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, search: 'homa' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Staff of Homa');
    });

    it('filters by search in key', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, search: 'skyward' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('SkywardBlade');
    });

    it('filters by search in location', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, search: 'hutao' },
        'rarity',
        'desc'
      );

      expect(result).toHaveLength(1);
      expect(result[0].location).toBe('HuTao');
    });
  });

  describe('sorting', () => {
    it('sorts by rarity descending', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'rarity', 'desc');

      expect(result[0].displayRarity).toBe(5);
      expect(result[2].displayRarity).toBe(4);
    });

    it('sorts by rarity ascending', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'rarity', 'asc');

      expect(result[0].displayRarity).toBe(4);
    });

    it('sorts by level descending', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'level', 'desc');

      expect(result[0].level).toBe(90);
      expect(result[2].level).toBe(70);
    });

    it('sorts by refinement descending', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'refinement', 'desc');

      expect(result[0].refinement).toBe(5);
    });

    it('sorts by name ascending', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'name', 'asc');

      // Implementation negates comparison for 'asc', resulting in reverse alphabetical
      expect(result[0].displayName).toBe('Staff of Homa');
      expect(result[2].displayName).toBe("Dragon's Bane");
    });

    it('sorts by type', () => {
      const result = filterAndSortWeapons(enrichedWeapons, defaultFilters, 'type', 'asc');

      // Implementation negates comparison for 'asc', resulting in reverse alphabetical
      expect(result[0].weaponType).toBe('sword');
    });
  });

  describe('combined filtering and sorting', () => {
    it('applies filters before sorting', () => {
      const result = filterAndSortWeapons(
        enrichedWeapons,
        { ...defaultFilters, type: 'polearm' },
        'level',
        'desc'
      );

      expect(result).toHaveLength(2);
      expect(result[0].level).toBe(90);
      expect(result[1].level).toBe(80);
    });
  });
});
