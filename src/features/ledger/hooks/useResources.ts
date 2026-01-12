/**
 * Resources Hook
 *
 * Provides current primogem and fate counts from the ledger
 */

import { useState, useEffect, useCallback } from 'react';
import { resourceSnapshotRepo } from '../repo/resourceSnapshotRepo';
import { PRIMOS_PER_PULL } from '@/lib/constants';

export interface ResourceState {
  primogems: number;
  genesisCrystals: number;
  intertwined: number;
  acquaint: number;
  starglitter: number;
  stardust: number;
  lastUpdated: string | null;
}

export function useResources() {
  const [resources, setResources] = useState<ResourceState>({
    primogems: 0,
    genesisCrystals: 0,
    intertwined: 0,
    acquaint: 0,
    starglitter: 0,
    stardust: 0,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadResources = useCallback(async () => {
    try {
      setIsLoading(true);
      const snapshot = await resourceSnapshotRepo.getLatest();
      if (snapshot) {
        setResources({
          primogems: snapshot.primogems,
          genesisCrystals: snapshot.genesisCrystals,
          intertwined: snapshot.intertwined,
          acquaint: snapshot.acquaint,
          starglitter: snapshot.starglitter,
          stardust: snapshot.stardust,
          lastUpdated: snapshot.timestamp,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load resources'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Calculate available pulls
  const totalPulls = resources.intertwined + Math.floor(resources.primogems / PRIMOS_PER_PULL);
  const totalPrimosEquivalent = resources.primogems + resources.intertwined * PRIMOS_PER_PULL;

  return {
    ...resources,
    isLoading,
    error,
    totalPulls,
    totalPrimosEquivalent,
    hasSnapshot: resources.lastUpdated !== null,
    refresh: loadResources,
  };
}
