import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailablePullsFromTracker } from './resourceService';
import { fateEntryRepo } from '@/features/ledger/repo/fateEntryRepo';
import { primogemEntryRepo } from '@/features/ledger/repo/primogemEntryRepo';
import { resourceSnapshotRepo } from '@/features/ledger/repo/resourceSnapshotRepo';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import * as resourceCalculations from '@/features/ledger/domain/resourceCalculations';

// Mock all dependencies
vi.mock('@/features/ledger/repo/fateEntryRepo', () => ({
  fateEntryRepo: {
    getAll: vi.fn(),
    getByDateRange: vi.fn(),
  },
}));

vi.mock('@/features/ledger/repo/primogemEntryRepo', () => ({
  primogemEntryRepo: {
    getAll: vi.fn(),
    getByDateRange: vi.fn(),
  },
}));

vi.mock('@/features/ledger/repo/resourceSnapshotRepo', () => ({
  resourceSnapshotRepo: {
    getLatest: vi.fn(),
  },
}));

vi.mock('@/features/wishes/repo/wishRepo', () => ({
  wishRepo: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/features/ledger/domain/resourceCalculations', () => ({
  calculateAvailablePulls: vi.fn(),
  calculateWishSpending: vi.fn(),
}));

describe('resourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailablePullsFromTracker', () => {
    describe('when no snapshot exists', () => {
      beforeEach(() => {
        vi.mocked(resourceSnapshotRepo.getLatest).mockResolvedValue(null);
        vi.mocked(wishRepo.getAll).mockResolvedValue([]);
        vi.mocked(primogemEntryRepo.getAll).mockResolvedValue([]);
        vi.mocked(fateEntryRepo.getAll).mockResolvedValue([]);
        vi.mocked(resourceCalculations.calculateAvailablePulls).mockReturnValue(0);
      });

      it('returns zero resources when no data', async () => {
        const result = await getAvailablePullsFromTracker();

        expect(result.resources).toEqual({
          primogems: 0,
          genesisCrystals: 0,
          intertwined: 0,
          acquaint: 0,
          starglitter: 0,
        });
      });

      it('calls getAll for entries instead of getByDateRange', async () => {
        await getAvailablePullsFromTracker();

        expect(primogemEntryRepo.getAll).toHaveBeenCalled();
        expect(fateEntryRepo.getAll).toHaveBeenCalled();
        expect(primogemEntryRepo.getByDateRange).not.toHaveBeenCalled();
        expect(fateEntryRepo.getByDateRange).not.toHaveBeenCalled();
      });

      it('aggregates primogem entries', async () => {
        vi.mocked(primogemEntryRepo.getAll).mockResolvedValue([
          { id: '1', amount: 100, source: 'daily', date: '2024-01-01', createdAt: '', updatedAt: '' },
          { id: '2', amount: 200, source: 'event', date: '2024-01-02', createdAt: '', updatedAt: '' },
        ]);
        vi.mocked(resourceCalculations.calculateAvailablePulls).mockReturnValue(1);

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.primogems).toBe(300);
      });

      it('aggregates fate entries by type', async () => {
        vi.mocked(fateEntryRepo.getAll).mockResolvedValue([
          { id: '1', amount: 5, fateType: 'intertwined', source: 'shop', date: '2024-01-01', createdAt: '', updatedAt: '' },
          { id: '2', amount: 3, fateType: 'acquaint', source: 'bp', date: '2024-01-01', createdAt: '', updatedAt: '' },
          { id: '3', amount: 2, fateType: 'intertwined', source: 'event', date: '2024-01-02', createdAt: '', updatedAt: '' },
        ]);

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.intertwined).toBe(7);
        expect(result.resources.acquaint).toBe(3);
      });
    });

    describe('when snapshot exists', () => {
      const mockSnapshot = {
        id: 'snapshot-1',
        primogems: 1000,
        genesisCrystals: 500,
        intertwined: 10,
        acquaint: 5,
        starglitter: 20,
        timestamp: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      beforeEach(() => {
        vi.mocked(resourceSnapshotRepo.getLatest).mockResolvedValue(mockSnapshot);
        vi.mocked(wishRepo.getAll).mockResolvedValue([]);
        vi.mocked(primogemEntryRepo.getByDateRange).mockResolvedValue([]);
        vi.mocked(fateEntryRepo.getByDateRange).mockResolvedValue([]);
        vi.mocked(resourceCalculations.calculateWishSpending).mockReturnValue(undefined);
        vi.mocked(resourceCalculations.calculateAvailablePulls).mockReturnValue(16);
      });

      it('uses snapshot as base values', async () => {
        const result = await getAvailablePullsFromTracker();

        expect(result.resources.primogems).toBe(1000);
        expect(result.resources.genesisCrystals).toBe(500);
        expect(result.resources.intertwined).toBe(10);
        expect(result.resources.acquaint).toBe(5);
        expect(result.resources.starglitter).toBe(20);
      });

      it('calls getByDateRange with snapshot timestamp', async () => {
        await getAvailablePullsFromTracker();

        expect(primogemEntryRepo.getByDateRange).toHaveBeenCalledWith(
          '2024-01-01T00:00:00Z',
          expect.any(String)
        );
        expect(fateEntryRepo.getByDateRange).toHaveBeenCalledWith(
          '2024-01-01T00:00:00Z',
          expect.any(String)
        );
      });

      it('adds primogem delta to snapshot base', async () => {
        vi.mocked(primogemEntryRepo.getByDateRange).mockResolvedValue([
          { id: '1', amount: 500, source: 'event', date: '2024-01-02', createdAt: '', updatedAt: '' },
        ]);

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.primogems).toBe(1500); // 1000 + 500
      });

      it('adds fate deltas to snapshot base', async () => {
        vi.mocked(fateEntryRepo.getByDateRange).mockResolvedValue([
          { id: '1', amount: 3, fateType: 'intertwined', source: 'shop', date: '2024-01-02', createdAt: '', updatedAt: '' },
          { id: '2', amount: 2, fateType: 'acquaint', source: 'bp', date: '2024-01-02', createdAt: '', updatedAt: '' },
        ]);

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.intertwined).toBe(13); // 10 + 3
        expect(result.resources.acquaint).toBe(7); // 5 + 2
      });

      it('subtracts wish spending from resources', async () => {
        vi.mocked(resourceCalculations.calculateWishSpending).mockReturnValue({
          primogemEquivalent: 160,
          pullsByFate: { intertwined: 1, acquaint: 0 },
        });

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.primogems).toBe(840); // 1000 - 160
        expect(result.resources.intertwined).toBe(9); // 10 - 1
      });

      it('ensures resources are never negative', async () => {
        vi.mocked(resourceCalculations.calculateWishSpending).mockReturnValue({
          primogemEquivalent: 2000, // More than snapshot
          pullsByFate: { intertwined: 20, acquaint: 10 },
        });

        const result = await getAvailablePullsFromTracker();

        expect(result.resources.primogems).toBeGreaterThanOrEqual(0);
        expect(result.resources.intertwined).toBeGreaterThanOrEqual(0);
        expect(result.resources.acquaint).toBeGreaterThanOrEqual(0);
      });
    });

    describe('available pulls calculation', () => {
      it('calls calculateAvailablePulls with safe resources', async () => {
        vi.mocked(resourceSnapshotRepo.getLatest).mockResolvedValue(null);
        vi.mocked(wishRepo.getAll).mockResolvedValue([]);
        vi.mocked(primogemEntryRepo.getAll).mockResolvedValue([
          { id: '1', amount: 480, source: 'event', date: '2024-01-01', createdAt: '', updatedAt: '' },
        ]);
        vi.mocked(fateEntryRepo.getAll).mockResolvedValue([
          { id: '1', amount: 5, fateType: 'intertwined', source: 'shop', date: '2024-01-01', createdAt: '', updatedAt: '' },
        ]);
        vi.mocked(resourceCalculations.calculateAvailablePulls).mockReturnValue(8);

        const result = await getAvailablePullsFromTracker();

        expect(resourceCalculations.calculateAvailablePulls).toHaveBeenCalledWith({
          primogems: 480,
          genesisCrystals: 0,
          intertwined: 5,
          acquaint: 0,
          starglitter: 0,
        });
        expect(result.availablePulls).toBe(8);
      });

      it('returns the calculated pull count', async () => {
        vi.mocked(resourceSnapshotRepo.getLatest).mockResolvedValue(null);
        vi.mocked(wishRepo.getAll).mockResolvedValue([]);
        vi.mocked(primogemEntryRepo.getAll).mockResolvedValue([]);
        vi.mocked(fateEntryRepo.getAll).mockResolvedValue([]);
        vi.mocked(resourceCalculations.calculateAvailablePulls).mockReturnValue(42);

        const result = await getAvailablePullsFromTracker();

        expect(result.availablePulls).toBe(42);
      });
    });
  });
});
