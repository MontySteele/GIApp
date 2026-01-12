/**
 * Resource Service
 *
 * Shared service for calculating available pulls across features.
 * Consolidates logic from calculator and ledger to avoid duplication.
 *
 * This service aggregates data from:
 * - Resource snapshots (ledger)
 * - Primogem/Fate entries (ledger)
 * - Wish history (wishes) for spending calculation
 */

// Import from feature public APIs
import {
  fateEntryRepo,
  primogemEntryRepo,
  resourceSnapshotRepo,
  calculateAvailablePulls,
  calculateWishSpending,
  type LedgerResourceSnapshot,
} from '@/features/ledger';
import { wishRepo } from '@/features/wishes';
import type { FateType } from '@/types';

export interface AvailablePullsResult {
  availablePulls: number;
  resources: LedgerResourceSnapshot;
}

/**
 * Sum fate entries by type (intertwined/acquaint)
 */
function sumByFate(entries: Awaited<ReturnType<typeof fateEntryRepo.getAll>>) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.fateType] += entry.amount;
      return acc;
    },
    { intertwined: 0, acquaint: 0 } as Record<FateType, number>
  );
}

/**
 * Sum all primogem entries
 */
function sumPrimogems(entries: Awaited<ReturnType<typeof primogemEntryRepo.getAll>>) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

/**
 * Get available pulls from tracker data
 *
 * Aggregates:
 * - Latest resource snapshot
 * - Primogem/fate entries since snapshot
 * - Wish spending since snapshot
 *
 * Returns current available pulls and resource counts
 */
export async function getAvailablePullsFromTracker(): Promise<AvailablePullsResult> {
  const [snapshot, wishes] = await Promise.all([
    resourceSnapshotRepo.getLatest(),
    wishRepo.getAll(),
  ]);
  const nowIso = new Date().toISOString();

  const [primogemEntries, fateEntries] = await Promise.all([
    snapshot
      ? primogemEntryRepo.getByDateRange(snapshot.timestamp, nowIso)
      : primogemEntryRepo.getAll(),
    snapshot
      ? fateEntryRepo.getByDateRange(snapshot.timestamp, nowIso)
      : fateEntryRepo.getAll(),
  ]);

  const primogemDelta = sumPrimogems(primogemEntries);
  const fateDeltas = sumByFate(fateEntries);
  const wishSpending = snapshot ? calculateWishSpending(wishes, snapshot.timestamp) : undefined;

  // When there's a snapshot, base = snapshot values and we add deltas
  // When there's no snapshot, base = 0 and deltas are the totals
  const base: LedgerResourceSnapshot = snapshot
    ? {
        primogems: snapshot.primogems,
        genesisCrystals: snapshot.genesisCrystals ?? 0,
        intertwined: snapshot.intertwined,
        acquaint: snapshot.acquaint,
        starglitter: snapshot.starglitter,
      }
    : {
        primogems: 0,
        genesisCrystals: 0,
        intertwined: 0,
        acquaint: 0,
        starglitter: 0,
      };

  const resources: LedgerResourceSnapshot = {
    primogems: base.primogems + primogemDelta - (wishSpending?.primogemEquivalent ?? 0),
    genesisCrystals: base.genesisCrystals,
    intertwined: base.intertwined + fateDeltas.intertwined - (wishSpending?.pullsByFate.intertwined ?? 0),
    acquaint: base.acquaint + fateDeltas.acquaint - (wishSpending?.pullsByFate.acquaint ?? 0),
    starglitter: base.starglitter,
  };

  const safeResources: LedgerResourceSnapshot = {
    primogems: Math.max(0, resources.primogems),
    genesisCrystals: Math.max(0, resources.genesisCrystals),
    intertwined: Math.max(0, resources.intertwined),
    acquaint: Math.max(0, resources.acquaint),
    starglitter: Math.max(0, resources.starglitter),
  };

  return {
    availablePulls: calculateAvailablePulls(safeResources),
    resources: safeResources,
  };
}
