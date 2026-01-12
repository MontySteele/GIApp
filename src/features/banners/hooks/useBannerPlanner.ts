/**
 * Banner Planner Hook
 *
 * Manages planned banners and primogem forecasting
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PlannedBanner } from '@/types';
import { upcomingWishRepo } from '@/features/wishes/repo/upcomingWishRepo';
import { PRIMOS_PER_PULL, INCOME_F2P, INCOME_WELKIN, INCOME_WITH_EVENTS } from '@/lib/constants';

export interface BannerPlannerState {
  banners: PlannedBanner[];
  isLoading: boolean;
  error: Error | null;
}

export interface PrimoPlan {
  currentPrimos: number;
  currentFates: number;
  incomePerDay: number;
  bannerForecasts: BannerForecast[];
  totalPullsNeeded: number;
  totalPrimosNeeded: number;
  daysUntilGoal: number;
}

export interface BannerForecast {
  banner: PlannedBanner;
  daysUntilBanner: number;
  primosAvailable: number;
  pullsAvailable: number;
  canReachGoal: boolean;
  pullDeficit: number;
}

export type IncomeMode = 'f2p' | 'welkin' | 'events';

const INCOME_RATES: Record<IncomeMode, number> = {
  f2p: INCOME_F2P,
  welkin: INCOME_WELKIN,
  events: INCOME_WITH_EVENTS,
};

export function useBannerPlanner() {
  const [banners, setBanners] = useState<PlannedBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // User settings (persisted in localStorage)
  const [currentPrimos, setCurrentPrimos] = useState(() => {
    const saved = localStorage.getItem('bannerPlanner_primos');
    return saved ? Number(saved) : 0;
  });

  const [currentFates, setCurrentFates] = useState(() => {
    const saved = localStorage.getItem('bannerPlanner_fates');
    return saved ? Number(saved) : 0;
  });

  const [incomeMode, setIncomeMode] = useState<IncomeMode>(() => {
    const saved = localStorage.getItem('bannerPlanner_incomeMode');
    return (saved as IncomeMode) || 'welkin';
  });

  // Load banners
  useEffect(() => {
    const loadBanners = async () => {
      try {
        setIsLoading(true);
        const data = await upcomingWishRepo.getAll();
        setBanners(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load banners'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('bannerPlanner_primos', String(currentPrimos));
  }, [currentPrimos]);

  useEffect(() => {
    localStorage.setItem('bannerPlanner_fates', String(currentFates));
  }, [currentFates]);

  useEffect(() => {
    localStorage.setItem('bannerPlanner_incomeMode', incomeMode);
  }, [incomeMode]);

  // Calculate forecasts
  const plan = useMemo<PrimoPlan>(() => {
    const incomePerDay = INCOME_RATES[incomeMode];

    const today = new Date();
    const bannerForecasts: BannerForecast[] = [];

    let cumulativePrimos = currentPrimos;

    // Sort banners by start date
    const sortedBanners = [...banners].sort(
      (a, b) => new Date(a.expectedStartDate).getTime() - new Date(b.expectedStartDate).getTime()
    );

    for (const banner of sortedBanners) {
      const startDate = new Date(banner.expectedStartDate);
      const daysUntilBanner = Math.max(0, Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Calculate primos available by banner start
      const primosGained = daysUntilBanner * incomePerDay;
      const primosAvailable = cumulativePrimos + primosGained;
      const pullsFromPrimos = Math.floor(primosAvailable / PRIMOS_PER_PULL);
      const pullsAvailable = pullsFromPrimos + currentFates;

      // Check if goal can be reached
      const targetPulls = banner.maxPullBudget ?? 180; // Default to 2 pities
      const canReachGoal = pullsAvailable >= targetPulls;
      const pullDeficit = Math.max(0, targetPulls - pullsAvailable);

      bannerForecasts.push({
        banner,
        daysUntilBanner,
        primosAvailable,
        pullsAvailable,
        canReachGoal,
        pullDeficit,
      });

      // If pulling on this banner, subtract from cumulative
      if (banner.maxPullBudget) {
        const pullsUsed = Math.min(pullsAvailable, banner.maxPullBudget);
        cumulativePrimos = primosAvailable - pullsUsed * PRIMOS_PER_PULL;
      }
    }

    // Calculate totals
    const totalPullsNeeded = banners.reduce((sum, b) => sum + (b.maxPullBudget ?? 180), 0);
    const totalPrimosNeeded = totalPullsNeeded * PRIMOS_PER_PULL;
    const primoDeficit = Math.max(0, totalPrimosNeeded - currentPrimos - currentFates * PRIMOS_PER_PULL);
    const daysUntilGoal = Math.ceil(primoDeficit / incomePerDay);

    return {
      currentPrimos,
      currentFates,
      incomePerDay,
      bannerForecasts,
      totalPullsNeeded,
      totalPrimosNeeded,
      daysUntilGoal,
    };
  }, [banners, currentPrimos, currentFates, incomeMode]);

  // Banner CRUD operations
  const addBanner = useCallback(async (banner: Omit<PlannedBanner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await upcomingWishRepo.create(banner);
      const newBanner: PlannedBanner = {
        ...banner,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBanners((prev) => [...prev, newBanner]);
      return id;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add banner'));
      throw err;
    }
  }, []);

  const updateBanner = useCallback(async (id: string, updates: Partial<PlannedBanner>) => {
    try {
      await upcomingWishRepo.update(id, updates);
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update banner'));
      throw err;
    }
  }, []);

  const deleteBanner = useCallback(async (id: string) => {
    try {
      await upcomingWishRepo.delete(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete banner'));
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await upcomingWishRepo.getAll();
      setBanners(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh banners'));
    }
  }, []);

  return {
    // State
    banners,
    isLoading,
    error,
    plan,

    // Settings
    currentPrimos,
    setCurrentPrimos,
    currentFates,
    setCurrentFates,
    incomeMode,
    setIncomeMode,

    // Actions
    addBanner,
    updateBanner,
    deleteBanner,
    refresh,
  };
}

/**
 * Calculate pulls needed for guaranteed featured character
 */
export function pullsForGuaranteed(currentPity: number, hasGuarantee: boolean): number {
  const maxPity = 90;
  const pullsToFirst5Star = maxPity - currentPity;

  if (hasGuarantee) {
    return pullsToFirst5Star;
  }

  // Need to account for 50/50 loss
  // Worst case: lose 50/50 at hard pity, then need another 90
  return pullsToFirst5Star + maxPity;
}

/**
 * Format primogems to readable string
 */
export function formatPrimos(primos: number): string {
  if (primos >= 1000000) {
    return `${(primos / 1000000).toFixed(1)}M`;
  }
  if (primos >= 1000) {
    return `${(primos / 1000).toFixed(1)}K`;
  }
  return primos.toLocaleString();
}

/**
 * Calculate days between two dates
 */
export function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
