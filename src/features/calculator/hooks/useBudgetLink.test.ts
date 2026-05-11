import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBudgetLink } from './useBudgetLink';
import { PRIMOS_PER_PULL } from '@/lib/constants';

// Mock dependencies
vi.mock('@/features/wishes/repo/wishRepo', () => ({
  wishRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/lib/services/resourceService', () => ({
  getAvailablePullsFromTracker: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

vi.mock('@/features/ledger/domain/historicalReconstruction', () => ({
  calculateDailyRateFromWishes: vi.fn(),
}));

const mockResourceSnapshot = {
  id: 'snapshot-1',
  timestamp: '2024-01-15T12:00:00Z',
  primogems: 16000,
  intertwined: 10,
  acquaint: 5,
  starglitter: 100,
  stardust: 500,
  genesisCrystals: 0,
};

const mockPullAvailability = {
  eventPulls: Math.floor(mockResourceSnapshot.primogems / PRIMOS_PER_PULL)
    + mockResourceSnapshot.intertwined
    + Math.floor(mockResourceSnapshot.starglitter / 5),
  standardPulls: mockResourceSnapshot.acquaint,
  allWishes: Math.floor(mockResourceSnapshot.primogems / PRIMOS_PER_PULL)
    + mockResourceSnapshot.intertwined
    + Math.floor(mockResourceSnapshot.starglitter / 5)
    + mockResourceSnapshot.acquaint,
  currencyPulls: mockResourceSnapshot.primogems / PRIMOS_PER_PULL,
  starglitterPulls: Math.floor(mockResourceSnapshot.starglitter / 5),
};

const mockAvailablePullsResult = {
  availablePulls: mockPullAvailability.eventPulls,
  pullAvailability: mockPullAvailability,
  resources: {
    primogems: mockResourceSnapshot.primogems,
    genesisCrystals: mockResourceSnapshot.genesisCrystals,
    intertwined: mockResourceSnapshot.intertwined,
    acquaint: mockResourceSnapshot.acquaint,
    starglitter: mockResourceSnapshot.starglitter,
  },
  lastUpdated: mockResourceSnapshot.timestamp,
  hasSnapshot: true,
};

const mockWishes = [
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
];

describe('useBudgetLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state when data is undefined', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    useLiveQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => useBudgetLink());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasData).toBe(false);
  });

  it('returns hasData false when no snapshot exists', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce({
        availablePulls: 0,
        pullAvailability: {
          eventPulls: 0,
          standardPulls: 0,
          allWishes: 0,
          currencyPulls: 0,
          starglitterPulls: 0,
        },
        resources: {
          primogems: 0,
          genesisCrystals: 0,
          intertwined: 0,
          acquaint: 0,
          starglitter: 0,
        },
        lastUpdated: null,
        hasSnapshot: false,
      })
      .mockReturnValueOnce([]); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    const { result } = renderHook(() => useBudgetLink());

    expect(result.current.hasData).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('calculates current event pulls from primogems, intertwined fates, and starglitter', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    const { result } = renderHook(() => useBudgetLink());

    // 16000 primos / 160 per pull = 100 pulls + 10 intertwined + 20 from starglitter.
    const expectedPulls = mockPullAvailability.eventPulls;
    expect(result.current.currentPulls).toBe(expectedPulls);
    expect(result.current.currentPrimogems).toBe(16000);
    expect(result.current.currentFates).toBe(10);
    expect(result.current.starglitterPulls).toBe(20);
    expect(result.current.standardPulls).toBe(5);
  });

  it('calculates projections based on daily rate', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes

    // 160 primos per day = 1 pull per day
    calculateDailyRateFromWishes.mockReturnValue(160);

    const { result } = renderHook(() => useBudgetLink());

    // 160 * 30 = 4800 primos = 30 pulls in 30 days
    expect(result.current.projectedPrimogems30Days).toBe(4800);
    expect(result.current.projectedPulls30Days).toBe(30);

    // 160 * 60 = 9600 primos = 60 pulls in 60 days
    expect(result.current.projectedPrimogems60Days).toBe(9600);
    expect(result.current.projectedPulls60Days).toBe(60);
  });

  it('calculates total pulls including projections', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes

    calculateDailyRateFromWishes.mockReturnValue(160);

    const { result } = renderHook(() => useBudgetLink());

    // Current: 100 + 10 + 20 = 130 event pulls
    // Projected 30d: 30 pulls
    // Total 30d: 160 pulls
    const currentPulls = mockPullAvailability.eventPulls;
    expect(result.current.totalPulls30Days).toBe(currentPulls + 30);
    expect(result.current.totalPulls60Days).toBe(currentPulls + 60);
  });

  it('includes lastUpdated timestamp', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    const { result } = renderHook(() => useBudgetLink());

    expect(result.current.lastUpdated).toBe('2024-01-15T12:00:00Z');
    expect(result.current.hasData).toBe(true);
  });

  it('passes lookback days to rate calculation', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    renderHook(() => useBudgetLink(45));

    expect(calculateDailyRateFromWishes).toHaveBeenCalledWith(mockWishes, 45);
  });

  it('uses default 30 day lookback when not specified', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    renderHook(() => useBudgetLink());

    expect(calculateDailyRateFromWishes).toHaveBeenCalledWith(mockWishes, 30);
  });

  it('handles zero primogems correctly', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    const emptyPullsResult = {
      availablePulls: 0,
      pullAvailability: {
        eventPulls: 0,
        standardPulls: 0,
        allWishes: 0,
        currencyPulls: 0,
        starglitterPulls: 0,
      },
      resources: {
        primogems: 0,
        genesisCrystals: mockResourceSnapshot.genesisCrystals,
        intertwined: 0,
        acquaint: mockResourceSnapshot.acquaint,
        starglitter: 0,
      },
      lastUpdated: mockResourceSnapshot.timestamp,
      hasSnapshot: true,
    };

    useLiveQuery
      .mockReturnValueOnce(emptyPullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(0);

    const { result } = renderHook(() => useBudgetLink());

    expect(result.current.currentPulls).toBe(0);
    expect(result.current.currentPrimogems).toBe(0);
    expect(result.current.currentFates).toBe(0);
  });

  it('returns daily rate from calculation', async () => {
    const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
    const { calculateDailyRateFromWishes } = vi.mocked(
      await import('@/features/ledger/domain/historicalReconstruction')
    );

    useLiveQuery
      .mockReturnValueOnce(mockAvailablePullsResult)
      .mockReturnValueOnce(mockWishes); // wishes
    calculateDailyRateFromWishes.mockReturnValue(320);

    const { result } = renderHook(() => useBudgetLink());

    expect(result.current.dailyRate).toBe(320);
  });
});
