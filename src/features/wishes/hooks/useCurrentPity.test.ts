import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentPity, useAllCurrentPity } from './useCurrentPity';
import { wishRepo } from '../repo/wishRepo';
import { getPityByBanner, getPityForBanner } from '../selectors/pitySelectors';
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
    gachaType: '301',
    itemId: '10000046',
    name: 'Hu Tao',
    itemType: 'Character',
    rarity: 5,
    time: '2024-01-15 12:00:00',
    pity: 76,
    isFeatured: true,
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'wish-2',
    gachaType: '301',
    itemId: '10000025',
    name: 'Xingqiu',
    itemType: 'Character',
    rarity: 4,
    time: '2024-01-15 11:00:00',
    pity: 5,
    isFeatured: true,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

const mockPitySnapshot = {
  currentPity: 15,
  fiveStarPity: 15,
  fourStarPity: 5,
  guaranteed: false,
  lastFiveStar: mockWishRecords[0],
  lastFourStar: mockWishRecords[1],
  totalPulls: 100,
};

const mockAllPity: Record<BannerType, typeof mockPitySnapshot> = {
  character: { ...mockPitySnapshot },
  weapon: { ...mockPitySnapshot, currentPity: 30, guaranteed: true },
  standard: { ...mockPitySnapshot, currentPity: 45 },
  chronicled: { ...mockPitySnapshot, currentPity: 20 },
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

    expect(result.current?.currentPity).toBe(15);
    expect(result.current?.guaranteed).toBe(false);
  });

  it('calculates pity for weapon banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockAllPity.weapon);

    const { result } = renderHook(() => useCurrentPity('weapon'));

    expect(getPityForBanner).toHaveBeenCalledWith(mockWishRecords, 'weapon');
    expect(result.current?.currentPity).toBe(30);
    expect(result.current?.guaranteed).toBe(true);
  });

  it('calculates pity for standard banner', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(mockWishRecords);
    vi.mocked(getPityForBanner).mockReturnValue(mockAllPity.standard);

    const { result } = renderHook(() => useCurrentPity('standard'));

    expect(getPityForBanner).toHaveBeenCalledWith(mockWishRecords, 'standard');
    expect(result.current?.currentPity).toBe(45);
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

    expect(result.current?.currentPity).toBe(15);

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

    expect(result.current?.character.currentPity).toBe(15);
    expect(result.current?.weapon.currentPity).toBe(30);
    expect(result.current?.standard.currentPity).toBe(45);
    expect(result.current?.chronicled.currentPity).toBe(20);
  });
});
