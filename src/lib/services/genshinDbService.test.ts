import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCharacterMaterials,
  getWeaponMaterials,
  clearCharacterCache,
  clearWeaponCache,
  preloadCharacters,
  clearMemoryCache,
} from './genshinDbService';
import { db } from '@/db/schema';

// Mock the database
vi.mock('@/db/schema', () => ({
  db: {
    externalCache: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      toArray: vi.fn(),
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('genshinDbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMemoryCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('clearMemoryCache', () => {
    it('clears memory cache without error', () => {
      expect(() => clearMemoryCache()).not.toThrow();
    });
  });

  describe('getCharacterMaterials', () => {
    const mockCharacterResponse = {
      name: 'Hu Tao',
      element: 'Pyro',
      costs: {
        ascend1: [
          { name: 'Agnidus Agate Sliver', count: 1 },
          { name: 'Silk Flower', count: 3 },
          { name: 'Whopperflower Nectar', count: 3 },
        ],
        ascend2: [
          { name: 'Agnidus Agate Fragment', count: 3 },
          { name: 'Juvenile Jade', count: 2 },
          { name: 'Silk Flower', count: 10 },
          { name: 'Shimmering Nectar', count: 15 },
        ],
        ascend3: [
          { name: 'Agnidus Agate Fragment', count: 6 },
          { name: 'Juvenile Jade', count: 4 },
          { name: 'Silk Flower', count: 20 },
          { name: 'Shimmering Nectar', count: 12 },
        ],
        ascend4: [
          { name: 'Agnidus Agate Chunk', count: 3 },
          { name: 'Juvenile Jade', count: 8 },
          { name: 'Silk Flower', count: 30 },
          { name: 'Energy Nectar', count: 18 },
        ],
        ascend5: [
          { name: 'Agnidus Agate Chunk', count: 6 },
          { name: 'Juvenile Jade', count: 12 },
          { name: 'Silk Flower', count: 45 },
          { name: 'Energy Nectar', count: 12 },
        ],
        ascend6: [
          { name: 'Agnidus Agate Gemstone', count: 6 },
          { name: 'Juvenile Jade', count: 20 },
          { name: 'Silk Flower', count: 60 },
          { name: 'Energy Nectar', count: 24 },
        ],
      },
    };

    const mockTalentResponse = {
      name: 'Hu Tao',
      costs: {
        lvl2: [
          { name: 'Teachings of Diligence', count: 3 },
          { name: 'Whopperflower Nectar', count: 6 },
        ],
        lvl3: [
          { name: 'Guide to Diligence', count: 2 },
          { name: 'Shimmering Nectar', count: 3 },
        ],
        lvl4: [
          { name: 'Guide to Diligence', count: 4 },
          { name: 'Shimmering Nectar', count: 4 },
        ],
        lvl5: [
          { name: 'Guide to Diligence', count: 6 },
          { name: 'Shimmering Nectar', count: 6 },
        ],
        lvl6: [
          { name: 'Guide to Diligence', count: 9 },
          { name: 'Energy Nectar', count: 9 },
        ],
        lvl7: [
          { name: 'Philosophies of Diligence', count: 4 },
          { name: 'Energy Nectar', count: 4 },
          { name: 'Dvalin\'s Plume', count: 1 },
        ],
        lvl8: [
          { name: 'Philosophies of Diligence', count: 6 },
          { name: 'Energy Nectar', count: 6 },
          { name: 'Dvalin\'s Plume', count: 1 },
        ],
        lvl9: [
          { name: 'Philosophies of Diligence', count: 12 },
          { name: 'Energy Nectar', count: 9 },
          { name: 'Dvalin\'s Plume', count: 2 },
        ],
        lvl10: [
          { name: 'Philosophies of Diligence', count: 16 },
          { name: 'Energy Nectar', count: 12 },
          { name: 'Dvalin\'s Plume', count: 2 },
          { name: 'Crown of Insight', count: 1 },
        ],
      },
    };

    describe('when data is not cached', () => {
      beforeEach(() => {
        vi.mocked(db.externalCache.get).mockResolvedValue(null);
        vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockCharacterResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTalentResponse),
          });
      });

      it('fetches character and talent data from API', async () => {
        await getCharacterMaterials('HuTao');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/characters?query=HuTao')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/talents?query=HuTao')
        );
      });

      it('returns processed material data', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data).not.toBeNull();
        expect(result.isStale).toBe(false);
        expect(result.error).toBeUndefined();
      });

      it('identifies element correctly', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.element).toBe('Pyro');
      });

      it('processes gem materials by tier', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.ascensionMaterials.gem.element).toBe('Pyro');
        expect(result.data?.ascensionMaterials.gem.byTier.sliver).toBe(1);
        expect(result.data?.ascensionMaterials.gem.byTier.fragment).toBe(9); // 3 + 6
        expect(result.data?.ascensionMaterials.gem.byTier.chunk).toBe(9); // 3 + 6
        expect(result.data?.ascensionMaterials.gem.byTier.gemstone).toBe(6);
      });

      it('processes local specialty materials', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.ascensionMaterials.localSpecialty.name).toBe('Silk Flower');
        expect(result.data?.ascensionMaterials.localSpecialty.totalCount).toBe(168); // sum
      });

      it('processes talent book materials', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.talentMaterials.books.series).toBe('Diligence');
        expect(result.data?.talentMaterials.books.region).toBe('Liyue');
        expect(result.data?.talentMaterials.books.byTier.teachings).toBe(3);
        expect(result.data?.talentMaterials.books.byTier.guide).toBe(21); // 2+4+6+9
        expect(result.data?.talentMaterials.books.byTier.philosophies).toBe(38); // 4+6+12+16
      });

      it('processes weekly boss material', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.talentMaterials.weekly.name).toBe("Dvalin's Plume");
        expect(result.data?.talentMaterials.weekly.totalCount).toBe(6); // 1+1+2+2
      });

      it('processes crown material', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data?.talentMaterials.crown.name).toBe('Crown of Insight');
        expect(result.data?.talentMaterials.crown.totalCount).toBe(1);
      });

      it('caches data in IndexedDB', async () => {
        await getCharacterMaterials('HuTao');

        expect(db.externalCache.put).toHaveBeenCalledWith(
          expect.objectContaining({
            cacheKey: 'genshin-character:hutao',
            data: expect.objectContaining({
              schemaVersion: expect.any(Number),
              data: expect.any(Object),
            }),
          })
        );
      });
    });

    describe('when data is cached', () => {
      const cachedMaterials = {
        characterKey: 'HuTao',
        element: 'Pyro',
        ascensionMaterials: {
          gem: { name: 'Agnidus Agate', byTier: { sliver: 1, fragment: 9, chunk: 9, gemstone: 6 } },
          boss: { name: 'Juvenile Jade', totalCount: 46 },
          localSpecialty: { name: 'Silk Flower', totalCount: 168 },
          common: { name: '', baseName: '', tierNames: { gray: '', green: '', blue: '' }, byTier: { gray: 0, green: 0, blue: 0 } },
        },
        talentMaterials: {
          books: { name: 'Diligence', series: 'Diligence', region: 'Liyue', days: ['Tuesday', 'Friday', 'Sunday'], byTier: { teachings: 3, guide: 21, philosophies: 38 } },
          common: { name: '', baseName: '', tierNames: { gray: '', green: '', blue: '' }, byTier: { gray: 0, green: 0, blue: 0 } },
          weekly: { name: "Dvalin's Plume", totalCount: 6 },
          crown: { name: 'Crown of Insight', totalCount: 1 },
        },
        fetchedAt: Date.now(),
        apiVersion: 'v5',
      };

      beforeEach(() => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        vi.mocked(db.externalCache.get).mockResolvedValue({
          id: 'genshin-character:hutao',
          cacheKey: 'genshin-character:hutao',
          data: {
            data: cachedMaterials,
            schemaVersion: 4, // Current schema version
          },
          fetchedAt: new Date().toISOString(),
          expiresAt: futureDate,
        });
      });

      it('returns cached data without API call', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.data?.element).toBe('Pyro');
        expect(result.isStale).toBe(false);
      });

      it('refetches when forceRefresh is true', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockCharacterResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTalentResponse),
          });
        vi.mocked(db.externalCache.put).mockResolvedValue(undefined);

        await getCharacterMaterials('HuTao', { forceRefresh: true });

        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('when cache schema is outdated', () => {
      beforeEach(() => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        vi.mocked(db.externalCache.get).mockResolvedValue({
          id: 'genshin-character:hutao',
          cacheKey: 'genshin-character:hutao',
          data: {
            data: { characterKey: 'HuTao', element: 'Pyro' },
            schemaVersion: 1, // Old schema version
          },
          fetchedAt: new Date().toISOString(),
          expiresAt: futureDate,
        });
        vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockCharacterResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTalentResponse),
          });
      });

      it('refetches data when schema version is old', async () => {
        await getCharacterMaterials('HuTao');

        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    describe('when API fails', () => {
      beforeEach(() => {
        vi.mocked(db.externalCache.get).mockResolvedValue(null);
        mockFetch.mockRejectedValue(new Error('Network error'));
      });

      it('returns error when no cache available', async () => {
        const result = await getCharacterMaterials('HuTao');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Network error');
      });

      it('returns stale cache when useStaleOnError is true and cache exists', async () => {
        const staleCache = {
          characterKey: 'HuTao',
          element: 'Pyro',
        };

        // Cache is expired but exists
        const pastDate = new Date(Date.now() - 1000).toISOString();
        vi.mocked(db.externalCache.get).mockResolvedValue({
          id: 'genshin-character:hutao',
          cacheKey: 'genshin-character:hutao',
          data: staleCache,
          fetchedAt: new Date().toISOString(),
          expiresAt: pastDate,
        });

        const result = await getCharacterMaterials('HuTao', { useStaleOnError: true });

        expect(result.data).toEqual(staleCache);
        expect(result.isStale).toBe(true);
        expect(result.error).toBe('Network error');
      });
    });

    describe('when fetch returns error response', () => {
      beforeEach(() => {
        vi.mocked(db.externalCache.get).mockResolvedValue(null);
        mockFetch.mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
        });
      });

      it('returns error for non-ok response', async () => {
        const result = await getCharacterMaterials('InvalidCharacter');

        expect(result.data).toBeNull();
        expect(result.error).toContain('Failed to fetch character data');
      });
    });
  });

  describe('getWeaponMaterials', () => {
    const mockWeaponResponse = {
      name: 'Staff of Homa',
      rarity: 5,
      costs: {
        ascend1: [
          { name: 'Grain of Aerosiderite', count: 5 },
          { name: 'Fragile Bone Shard', count: 5 },
          { name: 'Slime Condensate', count: 3 },
        ],
        ascend2: [
          { name: 'Piece of Aerosiderite', count: 5 },
          { name: 'Sturdy Bone Shard', count: 18 },
          { name: 'Slime Secretions', count: 12 },
        ],
        ascend3: [
          { name: 'Piece of Aerosiderite', count: 9 },
          { name: 'Sturdy Bone Shard', count: 9 },
          { name: 'Slime Secretions', count: 9 },
        ],
        ascend4: [
          { name: 'Bit of Aerosiderite', count: 5 },
          { name: 'Fossilized Bone Shard', count: 14 },
          { name: 'Slime Concentrate', count: 14 },
        ],
        ascend5: [
          { name: 'Bit of Aerosiderite', count: 9 },
          { name: 'Fossilized Bone Shard', count: 9 },
          { name: 'Slime Concentrate', count: 9 },
        ],
        ascend6: [
          { name: 'Chunk of Aerosiderite', count: 6 },
          { name: 'Fossilized Bone Shard', count: 18 },
          { name: 'Slime Concentrate', count: 18 },
        ],
      },
    };

    describe('when data is not cached', () => {
      beforeEach(() => {
        vi.mocked(db.externalCache.get).mockResolvedValue(null);
        vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockWeaponResponse),
        });
      });

      it('fetches weapon data from API', async () => {
        await getWeaponMaterials('StaffOfHoma');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/weapons?query=StaffOfHoma')
        );
      });

      it('returns processed weapon material data', async () => {
        const result = await getWeaponMaterials('StaffOfHoma');

        expect(result.data).not.toBeNull();
        expect(result.data?.weaponKey).toBe('StaffOfHoma');
        expect(result.data?.rarity).toBe(5);
        expect(result.isStale).toBe(false);
      });

      it('processes domain materials', async () => {
        const result = await getWeaponMaterials('StaffOfHoma');

        expect(result.data?.ascensionMaterials.domain.series).toBe('Aerosiderite');
        expect(result.data?.ascensionMaterials.domain.region).toBe('Liyue');
      });

      it('processes common materials', async () => {
        const result = await getWeaponMaterials('StaffOfHoma');

        expect(result.data?.ascensionMaterials.common.baseName).toBe('Slime');
      });

      it('caches weapon data', async () => {
        await getWeaponMaterials('StaffOfHoma');

        expect(db.externalCache.put).toHaveBeenCalledWith(
          expect.objectContaining({
            cacheKey: 'genshin-weapon:staffofhoma',
          })
        );
      });
    });

    describe('when data is cached', () => {
      beforeEach(() => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        vi.mocked(db.externalCache.get).mockResolvedValue({
          id: 'genshin-weapon:staffofhoma',
          cacheKey: 'genshin-weapon:staffofhoma',
          data: {
            data: {
              weaponKey: 'StaffOfHoma',
              rarity: 5,
              ascensionMaterials: {},
            },
            schemaVersion: 4,
          },
          fetchedAt: new Date().toISOString(),
          expiresAt: futureDate,
        });
      });

      it('returns cached data without API call', async () => {
        const result = await getWeaponMaterials('StaffOfHoma');

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.data?.weaponKey).toBe('StaffOfHoma');
      });
    });

    describe('when API fails', () => {
      beforeEach(() => {
        vi.mocked(db.externalCache.get).mockResolvedValue(null);
        mockFetch.mockRejectedValue(new Error('Weapon API error'));
      });

      it('returns error when no cache', async () => {
        const result = await getWeaponMaterials('StaffOfHoma');

        expect(result.data).toBeNull();
        expect(result.error).toBe('Weapon API error');
      });
    });
  });

  describe('clearCharacterCache', () => {
    it('clears specific character cache', async () => {
      vi.mocked(db.externalCache.delete).mockResolvedValue(undefined);

      await clearCharacterCache('HuTao');

      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-character:hutao');
    });

    it('clears all character caches when no key provided', async () => {
      vi.mocked(db.externalCache.toArray).mockResolvedValue([
        { id: 'genshin-character:hutao', cacheKey: 'genshin-character:hutao', data: {}, fetchedAt: '', expiresAt: '' },
        { id: 'genshin-character:xingqiu', cacheKey: 'genshin-character:xingqiu', data: {}, fetchedAt: '', expiresAt: '' },
        { id: 'genshin-weapon:staffofhoma', cacheKey: 'genshin-weapon:staffofhoma', data: {}, fetchedAt: '', expiresAt: '' },
      ]);
      vi.mocked(db.externalCache.delete).mockResolvedValue(undefined);

      await clearCharacterCache();

      // Should only delete character caches, not weapon caches
      expect(db.externalCache.delete).toHaveBeenCalledTimes(2);
      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-character:hutao');
      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-character:xingqiu');
    });
  });

  describe('clearWeaponCache', () => {
    it('clears specific weapon cache', async () => {
      vi.mocked(db.externalCache.delete).mockResolvedValue(undefined);

      await clearWeaponCache('StaffOfHoma');

      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-weapon:staffofhoma');
    });

    it('clears all weapon caches when no key provided', async () => {
      vi.mocked(db.externalCache.toArray).mockResolvedValue([
        { id: 'genshin-character:hutao', cacheKey: 'genshin-character:hutao', data: {}, fetchedAt: '', expiresAt: '' },
        { id: 'genshin-weapon:staffofhoma', cacheKey: 'genshin-weapon:staffofhoma', data: {}, fetchedAt: '', expiresAt: '' },
        { id: 'genshin-weapon:mistsplitter', cacheKey: 'genshin-weapon:mistsplitter', data: {}, fetchedAt: '', expiresAt: '' },
      ]);
      vi.mocked(db.externalCache.delete).mockResolvedValue(undefined);

      await clearWeaponCache();

      // Should only delete weapon caches, not character caches
      expect(db.externalCache.delete).toHaveBeenCalledTimes(2);
      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-weapon:staffofhoma');
      expect(db.externalCache.delete).toHaveBeenCalledWith('genshin-weapon:mistsplitter');
    });
  });

  describe('preloadCharacters', () => {
    it('fetches multiple characters in parallel', async () => {
      vi.mocked(db.externalCache.get).mockResolvedValue(null);
      vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'Character',
            element: 'Pyro',
            costs: {},
          }),
      });

      await preloadCharacters(['HuTao', 'Xingqiu', 'Zhongli']);

      // 3 characters × 2 API calls each (character + talent)
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });

    it('does not throw when some characters fail', async () => {
      vi.mocked(db.externalCache.get).mockResolvedValue(null);
      mockFetch.mockRejectedValue(new Error('API Error'));

      await expect(preloadCharacters(['Invalid1', 'Invalid2'])).resolves.not.toThrow();
    });
  });

  describe('memory cache behavior', () => {
    it('uses memory cache for repeated calls', async () => {
      vi.mocked(db.externalCache.get).mockResolvedValue(null);
      vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'Character',
            element: 'Pyro',
            costs: {},
          }),
      });

      // First call - fetches from API
      await getCharacterMaterials('HuTao');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call - should use memory cache
      await getCharacterMaterials('HuTao');
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('memory cache is cleared by clearMemoryCache', async () => {
      vi.mocked(db.externalCache.get).mockResolvedValue(null);
      vi.mocked(db.externalCache.put).mockResolvedValue(undefined);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'Character',
            element: 'Pyro',
            costs: {},
          }),
      });

      // First call
      await getCharacterMaterials('HuTao');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear memory cache
      clearMemoryCache();

      // Second call - should fetch again (IndexedDB cache is not cleared)
      vi.mocked(db.externalCache.get).mockResolvedValue(null);
      await getCharacterMaterials('HuTao');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});
