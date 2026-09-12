import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentPity, useAllCurrentPity } from './useCurrentPity';
import { wishRepo } from '../repo/wishRepo';
import { getPityByBanner, getPityForBanner, type BannerPitySnapshot } from '../selectors/pitySelectors';
import type { WishRecord, BannerType } from '@/types';

// Mock dependencies
vi.mock('../repo/wishRepo', () => ({
  wishRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

vi.mock('../selectors/pitySelectors', () => ({
  getPityByBanner: vi.fn(),
  getPityForBanner: vi.fn(),
}));

const mockWishRecords: WishRecord[] = [
  {
    id: 'wish-1',
    gachaId: '1001',
    bannerType: 'character',
    bannerVersion: '4.3-phase1',
    timestamp: '2024-01-15T12:00:00Z',
    itemType: 'character',
    itemKey: 'HuTao',
    rarity: 5,
    isFeatured: true,
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'wish-2',
    gachaId: '1002',
    bannerType: 'character',
    bannerVersion: '4.3-phase1',
    timestamp: '2024-01-15T11:00:00Z',
    itemType: 'character',
    itemKey: 'Xingqiu',
    rarity: 4,
    isFeatured: true,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

const mockPitySnapshot: BannerPitySnapshot = {
  banner: 'character',
  pity: 15,
  guaranteed: false,
  radiantStreak: 0,
  radianceActive: false,
};

const mockAllPity: Record<BannerType, BannerPitySnapshot> = {
  character: { ...mockPitySnapshot },
  weapon: { ...mockPitySnapshot, banner: 'weapon', pity: 30, guaranteed: true, fatePoints: 0 },
  standard: { ...mockPitySnapshot, banner: 'standard', pity: 45 },
  chronicled: { ...mockPitySnapshot, banner: 'chronicled', pity: 20 },
};

describe('useCurrentPity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when records are loading', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useCurrentPity('character'));

    expect(result.current).toBeNull();
  });

  it('returns pity snapshot for specified banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockPitySnapshot);

    const { result } = renderHook(() => useCurrentPity('character'));

    expect(getPityForBanner).toHaveBeenCalledWith(mockWishRecords, 'character');
    expect(result.current).toEqual(mockPitySnapshot);
  });

  it('calculates pity for character banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockPitySnapshot);

    const { result } = renderHook(() => useCurrentPity('character'));

    expect(result.current?.pity).toBe(15);
    expect(result.current?.guaranteed).toBe(false);
  });

  it('calculates pity for weapon banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockAllPity.weapon);

    const { result } = renderHook(() => useCurrentPity('weapon'));

    expect(getPityForBanner).toHaveBeenCalledWith(mockWishRecords, 'weapon');
    expect(result.current?.pity).toBe(30);
    expect(result.current?.guaranteed).toBe(true);
  });

  it('calculates pity for standard banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockAllPity.standard);

    const { result } = renderHook(() => useCurrentPity('standard'));

    expect(getPityForBanner).toHaveBeenCalledWith(mockWishRecords, 'standard');
    expect(result.current?.pity).toBe(45);
  });

  it('re-calculates when banner type changes', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner)
      .mockReturnValueOnce(mockPitySnapshot)
      .mockReturnValueOnce(mockAllPity.weapon);

    const { result, rerender } = renderHook(
      ({ banner }) => useCurrentPity(banner),
      { initialProps: { banner: 'character' as BannerType } }
    );

    expect(result.current?.pity).toBe(15);

    rerender({ banner: 'weapon' as BannerType });

    expect(getPityForBanner).toHaveBeenLastCalledWith(mockWishRecords, 'weapon');
  });
});

describe('useAllCurrentPity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when records are loading', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useAllCurrentPity());

    expect(result.current).toBeNull();
  });

  it('returns pity for all banners', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityByBanner).mockReturnValue(mockAllPity);

    const { result } = renderHook(() => useAllCurrentPity());

    expect(getPityByBanner).toHaveBeenCalledWith(mockWishRecords);
    expect(result.current).toEqual(mockAllPity);
  });

  it('contains pity for all banner types', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityByBanner).mockReturnValue(mockAllPity);

    const { result } = renderHook(() => useAllCurrentPity());

    expect(result.current).toHaveProperty('character');
    expect(result.current).toHaveProperty('weapon');
    expect(result.current).toHaveProperty('standard');
    expect(result.current).toHaveProperty('chronicled');
  });

  it('provides different pity values per banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityByBanner).mockReturnValue(mockAllPity);

    const { result } = renderHook(() => useAllCurrentPity());

    expect(result.current?.character.pity).toBe(15);
    expect(result.current?.weapon.pity).toBe(30);
    expect(result.current?.standard.pity).toBe(45);
    expect(result.current?.chronicled.pity).toBe(20);
  });
});
