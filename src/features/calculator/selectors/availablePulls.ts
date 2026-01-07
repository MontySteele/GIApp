import { fateEntryRepo } from '@/features/ledger/repo/fateEntryRepo';
import { primogemEntryRepo } from '@/features/ledger/repo/primogemEntryRepo';
import { resourceSnapshotRepo } from '@/features/ledger/repo/resourceSnapshotRepo';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import {
  calculateAvailablePulls,
  calculateWishSpending,
  type LedgerResourceSnapshot,
} from '@/features/ledger/domain/resourceCalculations';
import type { FateType } from '@/types';

interface AvailablePullsResult {
  availablePulls: number;
  resources: LedgerResourceSnapshot;
}

function sumByFate(entries: Awaited<ReturnType<typeof fateEntryRepo.getAll>>) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.fateType] += entry.amount;
      return acc;
    },
    { intertwined: 0, acquaint: 0 } as Record<FateType, number>
  );
}

function sumPrimogems(entries: Awaited<ReturnType<typeof primogemEntryRepo.getAll>>) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

export async function getAvailablePullsFromTracker(): Promise<AvailablePullsResult> {
  const [snapshot, wishes] = await Promise.all([resourceSnapshotRepo.getLatest(), wishRepo.getAll()]);
  const nowIso = new Date().toISOString();

  const [primogemEntries, fateEntries] = await Promise.all([
    snapshot
      ? primogemEntryRepo.getByDateRange(snapshot.timestamp, nowIso)
      : primogemEntryRepo.getAll(),
    snapshot ? fateEntryRepo.getByDateRange(snapshot.timestamp, nowIso) : fateEntryRepo.getAll(),
  ]);

  const primogemDelta = sumPrimogems(primogemEntries);
  const fateDeltas = sumByFate(fateEntries);
  const wishSpending = snapshot ? calculateWishSpending(wishes, snapshot.timestamp) : undefined;

  const base: LedgerResourceSnapshot = snapshot
    ? {
        primogems: snapshot.primogems,
        genesisCrystals: snapshot.genesisCrystals ?? 0,
        intertwined: snapshot.intertwined,
        acquaint: snapshot.acquaint,
        starglitter: snapshot.starglitter,
      }
    : {
        primogems: primogemDelta,
        genesisCrystals: 0,
        intertwined: fateDeltas.intertwined,
        acquaint: fateDeltas.acquaint,
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
