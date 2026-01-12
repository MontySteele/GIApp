/**
 * Resources Hook
 *
 * Provides current primogem and fate counts from the ledger
 * Uses reactive useLiveQuery for automatic updates when database changes
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
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

const defaultResourceState: ResourceState = {
  primogems: 0,
  genesisCrystals: 0,
  intertwined: 0,
  acquaint: 0,
  starglitter: 0,
  stardust: 0,
  lastUpdated: null,
};

export function useResources() {
  // Reactive query - automatically updates when snapshot changes
  const snapshot = useLiveQuery(() => resourceSnapshotRepo.getLatest(), []);

  // Transform snapshot to ResourceState
  const resources: ResourceState = useMemo(() => {
    if (!snapshot) {
      return defaultResourceState;
    }

    return {
      primogems: snapshot.primogems,
      genesisCrystals: snapshot.genesisCrystals,
      intertwined: snapshot.intertwined,
      acquaint: snapshot.acquaint,
      starglitter: snapshot.starglitter,
      stardust: snapshot.stardust,
      lastUpdated: snapshot.timestamp,
    };
  }, [snapshot]);

  // Memoize calculated values
  const totalPulls = useMemo(
    () => resources.intertwined + Math.floor(resources.primogems / PRIMOS_PER_PULL),
    [resources.intertwined, resources.primogems]
  );

  const totalPrimosEquivalent = useMemo(
    () => resources.primogems + resources.intertwined * PRIMOS_PER_PULL,
    [resources.primogems, resources.intertwined]
  );

  const hasSnapshot = useMemo(
    () => resources.lastUpdated !== null,
    [resources.lastUpdated]
  );

  return {
    ...resources,
    isLoading: snapshot === undefined,
    totalPulls,
    totalPrimosEquivalent,
    hasSnapshot,
  };
}
