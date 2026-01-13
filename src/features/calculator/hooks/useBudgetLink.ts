/**
 * Budget Link Hook
 *
 * Provides budget data from the ledger for use in the calculator.
 * Connects primogem tracking to pull probability calculations.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import { resourceSnapshotRepo } from '@/features/ledger/repo/resourceSnapshotRepo';
import { calculateDailyRateFromWishes } from '@/features/ledger/domain/historicalReconstruction';
import { PRIMOS_PER_PULL } from '@/lib/constants';

export interface BudgetLinkData {
  // Current state
  currentPrimogems: number;
  currentFates: number;
  currentPulls: number;

  // Projection
  dailyRate: number;
  projectedPrimogems30Days: number;
  projectedPrimogems60Days: number;
  projectedPulls30Days: number;
  projectedPulls60Days: number;

  // Combined (current + projected)
  totalPulls30Days: number;
  totalPulls60Days: number;

  // Metadata
  lastUpdated: string | null;
  hasData: boolean;
  isLoading: boolean;
}

export function useBudgetLink(rateLookbackDays: number = 30): BudgetLinkData {
  // Get latest resource snapshot
  const snapshot = useLiveQuery(() => resourceSnapshotRepo.getLatest(), []);

  // Get all wishes for rate calculation
  const wishes = useLiveQuery(() => wishRepo.getAll(), []);

  const budgetData = useMemo((): BudgetLinkData => {
    const isLoading = snapshot === undefined || wishes === undefined;

    if (isLoading) {
      return {
        currentPrimogems: 0,
        currentFates: 0,
        currentPulls: 0,
        dailyRate: 0,
        projectedPrimogems30Days: 0,
        projectedPrimogems60Days: 0,
        projectedPulls30Days: 0,
        projectedPulls60Days: 0,
        totalPulls30Days: 0,
        totalPulls60Days: 0,
        lastUpdated: null,
        hasData: false,
        isLoading: true,
      };
    }

    // Current resources
    const currentPrimogems = snapshot?.primogems ?? 0;
    const currentFates = snapshot?.intertwined ?? 0;
    const currentPulls = currentFates + Math.floor(currentPrimogems / PRIMOS_PER_PULL);

    // Calculate daily rate from wish history
    const dailyRate = calculateDailyRateFromWishes(wishes ?? [], rateLookbackDays);

    // Project income for 30 and 60 days
    const projectedPrimogems30Days = Math.floor(dailyRate * 30);
    const projectedPrimogems60Days = Math.floor(dailyRate * 60);

    const projectedPulls30Days = Math.floor(projectedPrimogems30Days / PRIMOS_PER_PULL);
    const projectedPulls60Days = Math.floor(projectedPrimogems60Days / PRIMOS_PER_PULL);

    // Total pulls (current + projected)
    const totalPulls30Days = currentPulls + projectedPulls30Days;
    const totalPulls60Days = currentPulls + projectedPulls60Days;

    return {
      currentPrimogems,
      currentFates,
      currentPulls,
      dailyRate,
      projectedPrimogems30Days,
      projectedPrimogems60Days,
      projectedPulls30Days,
      projectedPulls60Days,
      totalPulls30Days,
      totalPulls60Days,
      lastUpdated: snapshot?.timestamp ?? null,
      hasData: !!snapshot,
      isLoading: false,
    };
  }, [snapshot, wishes, rateLookbackDays]);

  return budgetData;
}
