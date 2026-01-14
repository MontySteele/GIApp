import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { primogemEntryRepo } from '../repo/primogemEntryRepo';
import { fateEntryRepo } from '../repo/fateEntryRepo';
import { resourceSnapshotRepo } from '../repo/resourceSnapshotRepo';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import { UnifiedChart } from '../components/UnifiedChart';
import { TransactionLog } from '../components/TransactionLog';
import { PurchaseLedger } from '../components/PurchaseLedger';
import {
  calculateAvailablePulls,
  calculateWishSpending,
} from '../domain/resourceCalculations';
import { markChecklistItem } from '@/hooks/useOnboarding';
import type { FateType, PrimogemEntry } from '@/types';

const FAR_FUTURE = '9999-12-31T23:59:59.999Z';

export default function LedgerPage() {
  // Data queries
  const allPrimogemEntries = useLiveQuery(() => primogemEntryRepo.getAll(), []);
  const fateEntries = useLiveQuery(() => fateEntryRepo.getAll(), []);
  const allSnapshots = useLiveQuery(() => resourceSnapshotRepo.getAll(), []);
  const latestSnapshot = allSnapshots?.[0]; // Already sorted desc by timestamp
  const snapshotTimestamp = latestSnapshot?.timestamp;

  const postSnapshotPrimogemEntries = useLiveQuery(
    () => (snapshotTimestamp ? primogemEntryRepo.getByDateRange(snapshotTimestamp, FAR_FUTURE) : []),
    [snapshotTimestamp]
  );
  const postSnapshotFateEntries = useLiveQuery(
    () => (snapshotTimestamp ? fateEntryRepo.getByDateRange(snapshotTimestamp, FAR_FUTURE) : []),
    [snapshotTimestamp]
  );
  const wishRecords = useLiveQuery(() => wishRepo.getAll(), []);

  // Snapshot form state
  const [snapshotValues, setSnapshotValues] = useState({
    primogems: latestSnapshot?.primogems ?? 0,
    genesisCrystals: latestSnapshot?.genesisCrystals ?? 0,
    intertwined: latestSnapshot?.intertwined ?? 0,
    acquaint: latestSnapshot?.acquaint ?? 0,
    starglitter: latestSnapshot?.starglitter ?? 0,
    stardust: latestSnapshot?.stardust ?? 0,
  });

  // Collapsible states
  const [snapshotExpanded, setSnapshotExpanded] = useState(true);
  const [purchaseLedgerExpanded, setPurchaseLedgerExpanded] = useState(true);
  const [transactionLogExpanded, setTransactionLogExpanded] = useState(false);

  // Editing purchase state (used for scrolling to purchase ledger when editing from transaction log)
  const [, setEditingPurchase] = useState<PrimogemEntry | null>(null);

  // Mark pulls as visited for onboarding checklist
  useEffect(() => {
    markChecklistItem('hasCheckedPulls');
  }, []);

  // Sync snapshot values when latest snapshot changes
  useEffect(() => {
    if (!latestSnapshot) return;
    setSnapshotValues({
      primogems: latestSnapshot.primogems,
      genesisCrystals: latestSnapshot.genesisCrystals ?? 0,
      intertwined: latestSnapshot.intertwined,
      acquaint: latestSnapshot.acquaint,
      starglitter: latestSnapshot.starglitter,
      stardust: latestSnapshot.stardust,
    });
  }, [latestSnapshot]);

  // Calculate purchase entries (source === 'purchase')
  const purchaseEntries = useMemo(
    () => (allPrimogemEntries ?? []).filter((e) => e.source === 'purchase'),
    [allPrimogemEntries]
  );

  // Calculate post-snapshot purchases
  const postSnapshotPurchases = useMemo(
    () => (postSnapshotPrimogemEntries ?? []).filter((e) => e.source === 'purchase'),
    [postSnapshotPrimogemEntries]
  );

  // Calculate totals
  const totalPurchased = useMemo(
    () => purchaseEntries.reduce((sum, e) => sum + e.amount, 0),
    [purchaseEntries]
  );

  const postSnapshotPurchasedTotal = useMemo(
    () => postSnapshotPurchases.reduce((sum, e) => sum + e.amount, 0),
    [postSnapshotPurchases]
  );

  const fateTotals = useMemo(() => {
    const totals: Record<FateType, number> = { intertwined: 0, acquaint: 0 };
    (fateEntries ?? []).forEach((entry) => {
      totals[entry.fateType] += entry.amount;
    });
    return totals;
  }, [fateEntries]);

  const fateDeltas = useMemo(() => {
    const totals: Record<FateType, number> = { intertwined: 0, acquaint: 0 };
    (postSnapshotFateEntries ?? []).forEach((entry) => {
      totals[entry.fateType] += entry.amount;
    });
    return totals;
  }, [postSnapshotFateEntries]);

  const wishSpending = useMemo(
    () => (snapshotTimestamp ? calculateWishSpending(wishRecords ?? [], snapshotTimestamp) : undefined),
    [snapshotTimestamp, wishRecords]
  );

  // Calculate effective current values
  const basePrimogems = latestSnapshot?.primogems ?? 0;
  const primogemGross = basePrimogems + postSnapshotPurchasedTotal;
  const primogemAfterSpending = primogemGross - (wishSpending?.primogemEquivalent ?? 0);
  const effectivePrimogems = Math.max(0, primogemAfterSpending);

  const effectiveIntertwined = Math.max(
    0,
    (latestSnapshot ? latestSnapshot.intertwined + fateDeltas.intertwined : fateTotals.intertwined) -
      (wishSpending?.pullsByFate.intertwined ?? 0)
  );
  const effectiveAcquaint = Math.max(
    0,
    (latestSnapshot ? latestSnapshot.acquaint + fateDeltas.acquaint : fateTotals.acquaint) -
      (wishSpending?.pullsByFate.acquaint ?? 0)
  );
  const effectiveGenesis = latestSnapshot?.genesisCrystals ?? 0;
  const effectiveStarglitter = latestSnapshot?.starglitter ?? 0;

  const wishesAvailable = useMemo(
    () =>
      calculateAvailablePulls({
        primogems: effectivePrimogems,
        genesisCrystals: effectiveGenesis,
        intertwined: effectiveIntertwined,
        acquaint: effectiveAcquaint,
        starglitter: effectiveStarglitter,
      }),
    [effectiveAcquaint, effectiveGenesis, effectiveIntertwined, effectivePrimogems, effectiveStarglitter]
  );

  const wishSpendingTotals =
    wishSpending ?? { totalPulls: 0, primogemEquivalent: 0, pullsByFate: { intertwined: 0, acquaint: 0 } };

  // Handlers
  const handleSnapshotSave = async () => {
    await resourceSnapshotRepo.create({
      ...snapshotValues,
    });
  };

  const handleAddPurchase = async (amount: number, timestamp: string, notes: string) => {
    await primogemEntryRepo.create({
      amount,
      source: 'purchase',
      notes,
      timestamp,
    });
  };

  const handleUpdatePurchase = async (id: string, amount: number, timestamp: string, notes: string) => {
    await primogemEntryRepo.update(id, {
      amount,
      timestamp,
      notes,
    });
  };

  const handleDeletePurchase = async (id: string) => {
    await primogemEntryRepo.delete(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Primogem Tracker</h1>
        <p className="text-slate-400">
          Track your primogem stash with snapshots and see historical + projected values.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Current Primogems</p>
          <p className="text-3xl font-bold text-primary-400">{effectivePrimogems.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {latestSnapshot ? 'Snapshot + purchases - wish spending' : 'Add a snapshot to track'}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Purchased Primogems</p>
          <p className="text-3xl font-bold text-indigo-400">{totalPurchased.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">
            {postSnapshotPurchasedTotal > 0 && latestSnapshot
              ? `+${postSnapshotPurchasedTotal.toLocaleString()} since snapshot`
              : 'Track separately from earned'}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Wishes Available</p>
          <p className="text-3xl font-bold text-amber-400">{Math.floor(wishesAvailable)}</p>
          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
            <p>{Math.floor(effectivePrimogems / 160)} from primogems</p>
            <p>{effectiveIntertwined} intertwined + {effectiveAcquaint} acquaint fates</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Pulls Since Snapshot</p>
          <p className="text-3xl font-bold text-slate-100">{wishSpendingTotals.totalPulls}</p>
          <p className="text-xs text-slate-500 mt-1">
            {wishSpendingTotals.primogemEquivalent.toLocaleString()} primos equivalent
          </p>
        </div>
      </div>

      {/* Snapshot Logger (moved higher) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl">
        <button
          className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors rounded-t-xl"
          onClick={() => setSnapshotExpanded(!snapshotExpanded)}
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-green-400" />
            <div>
              <h2 className="text-xl font-semibold">Resource Snapshot</h2>
              <p className="text-sm text-slate-400">
                {latestSnapshot
                  ? `Last: ${new Date(latestSnapshot.timestamp).toLocaleString()}`
                  : 'No snapshots yet - add one to start tracking'}
              </p>
            </div>
          </div>
          {snapshotExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {snapshotExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-slate-800">
            <p className="text-sm text-slate-400 pt-4">
              Enter your current in-game values. This becomes the ground truth for calculations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'primogems', label: 'Primogems' },
                { key: 'genesisCrystals', label: 'Genesis Crystals' },
                { key: 'intertwined', label: 'Intertwined Fates' },
                { key: 'acquaint', label: 'Acquaint Fates' },
                { key: 'starglitter', label: 'Starglitter' },
                { key: 'stardust', label: 'Stardust' },
              ].map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type="number"
                  value={snapshotValues[field.key as keyof typeof snapshotValues]}
                  onChange={(e) =>
                    setSnapshotValues((prev) => ({
                      ...prev,
                      [field.key]: Number(e.target.value),
                    }))
                  }
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSnapshotSave}>
                <Plus className="w-4 h-4" />
                Save Snapshot
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Unified Chart */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Primogem History & Projection</h2>
          <p className="text-slate-400 text-sm">
            Historical values reconstructed from snapshots + wish spending. Future projection based on pull frequency.
          </p>
        </div>
        <UnifiedChart
          snapshots={allSnapshots ?? []}
          wishes={wishRecords ?? []}
          purchases={purchaseEntries}
          currentPrimogems={effectivePrimogems}
          currentIntertwined={effectiveIntertwined}
        />
      </section>

      {/* Purchase Ledger */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl">
        <button
          className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors rounded-t-xl"
          onClick={() => setPurchaseLedgerExpanded(!purchaseLedgerExpanded)}
        >
          <div>
            <h2 className="text-xl font-semibold">Purchase Ledger</h2>
            <p className="text-sm text-slate-400">
              Track primogem purchases separately from earned income
            </p>
          </div>
          {purchaseLedgerExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {purchaseLedgerExpanded && (
          <div className="px-4 pb-4 border-t border-slate-800 pt-4">
            <PurchaseLedger
              purchases={purchaseEntries}
              onAdd={handleAddPurchase}
              onUpdate={handleUpdatePurchase}
              onDelete={handleDeletePurchase}
            />
          </div>
        )}
      </section>

      {/* Transaction Log */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl">
        <button
          className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors rounded-t-xl"
          onClick={() => setTransactionLogExpanded(!transactionLogExpanded)}
        >
          <div>
            <h2 className="text-xl font-semibold">Transaction Log</h2>
            <p className="text-sm text-slate-400">
              Unified view of snapshots, purchases, and wish spending
            </p>
          </div>
          {transactionLogExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {transactionLogExpanded && (
          <div className="px-4 pb-4 border-t border-slate-800 pt-4">
            <TransactionLog
              snapshots={allSnapshots ?? []}
              wishes={wishRecords ?? []}
              purchases={purchaseEntries}
              onEditPurchase={(entry) => {
                setPurchaseLedgerExpanded(true);
                setEditingPurchase(entry);
              }}
              onDeletePurchase={handleDeletePurchase}
            />
          </div>
        )}
      </section>
    </div>
  );
}
