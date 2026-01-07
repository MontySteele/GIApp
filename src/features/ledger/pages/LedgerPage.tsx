import { useEffect, useMemo, useState } from 'react';
import { Plus, Coins, Sparkles, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { primogemEntryRepo } from '../repo/primogemEntryRepo';
import { fateEntryRepo } from '../repo/fateEntryRepo';
import { resourceSnapshotRepo } from '../repo/resourceSnapshotRepo';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import IncomeTimeline from '../components/IncomeTimeline';
import {
  bucketPrimogemEntries,
  calculateAvailablePulls,
  calculateWishSpending,
  splitPrimogemIncome,
  type IncomeBucketFilters,
} from '../domain/resourceCalculations';
import type { FateType, PrimogemSource, FateSource } from '@/types';

const FAR_FUTURE = '9999-12-31T23:59:59.999Z';

export default function LedgerPage() {
  const primogemEntries = useLiveQuery(() => primogemEntryRepo.getAll(), []);
  const fateEntries = useLiveQuery(() => fateEntryRepo.getAll(), []);
  const latestSnapshot = useLiveQuery(() => resourceSnapshotRepo.getLatest(), []);
  const snapshotTimestamp = latestSnapshot?.timestamp;
  const postSnapshotPrimogemEntries = useLiveQuery(
    () => (snapshotTimestamp ? primogemEntryRepo.getByDateRange(snapshotTimestamp, FAR_FUTURE) : primogemEntryRepo.getAll()),
    [snapshotTimestamp]
  );
  const postSnapshotFateEntries = useLiveQuery(
    () => (snapshotTimestamp ? fateEntryRepo.getByDateRange(snapshotTimestamp, FAR_FUTURE) : fateEntryRepo.getAll()),
    [snapshotTimestamp]
  );
  const wishRecords = useLiveQuery(() => wishRepo.getAll(), []);

  const [primogemAmount, setPrimogemAmount] = useState<number>(0);
  const [primogemSource, setPrimogemSource] = useState<PrimogemSource>('daily_commission');
  const [primogemNotes, setPrimogemNotes] = useState('');

  const [fateAmount, setFateAmount] = useState<number>(1);
  const [fateType, setFateType] = useState<FateType>('intertwined');
  const [fateSource, setFateSource] = useState<FateSource>('event');

  const [snapshotValues, setSnapshotValues] = useState({
    primogems: latestSnapshot?.primogems ?? 0,
    genesisCrystals: latestSnapshot?.genesisCrystals ?? 0,
    intertwined: latestSnapshot?.intertwined ?? 0,
    acquaint: latestSnapshot?.acquaint ?? 0,
    starglitter: latestSnapshot?.starglitter ?? 0,
    stardust: latestSnapshot?.stardust ?? 0,
  });
  const [includePurchases, setIncludePurchases] = useState(true);
  const [timelineFilters, setTimelineFilters] = useState<IncomeBucketFilters>({
    interval: 'week',
    includePurchases: true,
    source: 'all',
  });

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

  useEffect(() => {
    setTimelineFilters((prev) => ({ ...prev, includePurchases }));
  }, [includePurchases]);

  const primogemTotal = useMemo(
    () => primogemEntries?.reduce((sum, entry) => sum + entry.amount, 0) ?? 0,
    [primogemEntries]
  );

  const primogemDelta = useMemo(
    () => postSnapshotPrimogemEntries?.reduce((sum, entry) => sum + entry.amount, 0) ?? 0,
    [postSnapshotPrimogemEntries]
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

  const primogemIncomeSplit = useMemo(
    () => splitPrimogemIncome((snapshotTimestamp ? postSnapshotPrimogemEntries : primogemEntries) ?? []),
    [postSnapshotPrimogemEntries, primogemEntries, snapshotTimestamp]
  );

  const basePrimogems = latestSnapshot?.primogems ?? primogemTotal;
  const primogemGross = latestSnapshot ? basePrimogems + primogemDelta : primogemTotal;
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

  const netChangePrimogems = latestSnapshot ? primogemDelta - (wishSpending?.primogemEquivalent ?? 0) : primogemTotal;
  const netChangeIntertwined = latestSnapshot
    ? fateDeltas.intertwined - (wishSpending?.pullsByFate.intertwined ?? 0)
    : fateTotals.intertwined;
  const netChangeAcquaint = latestSnapshot
    ? fateDeltas.acquaint - (wishSpending?.pullsByFate.acquaint ?? 0)
    : fateTotals.acquaint;

  const filteredNetChangePrimogems = includePurchases
    ? netChangePrimogems
    : netChangePrimogems - primogemIncomeSplit.purchased;

  const incomeBuckets = useMemo(
    () => bucketPrimogemEntries(primogemEntries ?? [], timelineFilters),
    [primogemEntries, timelineFilters]
  );

  const wishSpendingTotals =
    wishSpending ?? { totalPulls: 0, primogemEquivalent: 0, pullsByFate: { intertwined: 0, acquaint: 0 } };

  const handleAddPrimogems = async (amount: number, source: PrimogemSource, notes = '') => {
    await primogemEntryRepo.create({ amount, source, notes });
    setPrimogemAmount(0);
    setPrimogemNotes('');
  };

  const handleSnapshotSave = async () => {
    await resourceSnapshotRepo.create({
      ...snapshotValues,
    });
  };

  const handleTimelineFiltersChange = (next: IncomeBucketFilters) => {
    setTimelineFilters(next);
    if (next.includePurchases !== includePurchases) {
      setIncludePurchases(next.includePurchases);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Primogem Tracker</h1>
          <p className="text-slate-400">Track your currency gains, spending, and current stash.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleAddPrimogems(60, 'daily_commission', 'Daily commissions')}>
            <Sparkles className="w-4 h-4" />
            Commission +60
          </Button>
          <Button variant="secondary" onClick={() => handleAddPrimogems(90, 'welkin', 'Blessing of the Welkin Moon')}>
            <Coins className="w-4 h-4" />
            Welkin +90
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={includePurchases}
            onChange={(e) => setIncludePurchases(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Include purchased primogems in summaries
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Current primogem stash</p>
          <p className="text-3xl font-bold text-primary-400">{effectivePrimogems.toLocaleString()} Primogems</p>
          <p className="text-sm text-slate-500">
            {latestSnapshot
              ? 'Snapshot + ledger deltas - wish spending'
              : 'Based on your logged entries'}
          </p>
          {latestSnapshot && (
            <p className="text-xs text-slate-400 mt-1">
              Net Δ since snapshot: {filteredNetChangePrimogems >= 0 ? '+' : ''}
              {filteredNetChangePrimogems.toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Earned primogems</p>
          <p className="text-3xl font-bold text-green-300">{primogemIncomeSplit.earned.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Ledger deltas (excludes purchases)</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Purchased primogems</p>
          <p className="text-3xl font-bold text-indigo-300">{primogemIncomeSplit.purchased.toLocaleString()}</p>
          <p className="text-sm text-slate-500">Tracked separately from earned income</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Fates (Intertwined)</p>
          <p className="text-3xl font-bold text-indigo-300">{effectiveIntertwined}</p>
          <p className="text-sm text-slate-500">
            {latestSnapshot ? 'Snapshot + ledger deltas - pulls' : 'Logged across all sources'}
          </p>
          {latestSnapshot && (
            <p className="text-xs text-slate-400 mt-1">
              Net Δ: {netChangeIntertwined >= 0 ? '+' : ''}
              {netChangeIntertwined}
            </p>
          )}
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Fates (Acquaint)</p>
          <p className="text-3xl font-bold text-cyan-300">{effectiveAcquaint}</p>
          <p className="text-sm text-slate-500">
            {latestSnapshot ? 'Snapshot + ledger deltas - pulls' : 'Logged across all sources'}
          </p>
          {latestSnapshot && (
            <p className="text-xs text-slate-400 mt-1">
              Net Δ: {netChangeAcquaint >= 0 ? '+' : ''}
              {netChangeAcquaint}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Wishes Available</p>
          <p className="text-3xl font-bold text-amber-300">{wishesAvailable.toFixed(2)}</p>
          <p className="text-sm text-slate-500">
            Snapshot + ledger deltas + starglitter (5 per wish)
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Total pulls spent since snapshot</p>
          <p className="text-3xl font-bold text-slate-100">{wishSpendingTotals.totalPulls}</p>
          <p className="text-sm text-slate-500">
            {latestSnapshot ? 'Counted from wish history after your snapshot' : 'Add a snapshot to reconcile pulls'}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">Primogem-equivalent spent</p>
          <p className="text-3xl font-bold text-slate-100">{wishSpendingTotals.primogemEquivalent.toLocaleString()}</p>
          <p className="text-sm text-slate-500">
            Deducted so snapshots + pulls don’t double count
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add Primogem Entry</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPrimogemAmount(60)}>
                Commission
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPrimogemAmount(90)}>
                Welkin
              </Button>
            </div>
          </div>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await primogemEntryRepo.create({
                amount: primogemAmount,
                source: primogemSource,
                notes: primogemNotes,
              });
              setPrimogemAmount(0);
              setPrimogemNotes('');
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Amount"
                type="number"
                value={primogemAmount}
                onChange={(e) => setPrimogemAmount(Number(e.target.value))}
                required
              />
              <Select
                label="Source"
                value={primogemSource}
                onChange={(e) => setPrimogemSource(e.target.value as PrimogemSource)}
                options={[
                  { value: 'daily_commission', label: 'Daily Commission' },
                  { value: 'welkin', label: 'Welkin' },
                  { value: 'event', label: 'Event' },
                  { value: 'exploration', label: 'Exploration' },
                  { value: 'abyss', label: 'Abyss' },
                  { value: 'quest', label: 'Quest' },
                  { value: 'achievement', label: 'Achievement' },
                  { value: 'codes', label: 'Codes' },
                  { value: 'battle_pass', label: 'Battle Pass' },
                  { value: 'purchase', label: 'Purchase' },
                  { value: 'wish_conversion', label: 'Wish Conversion' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input
                label="Notes"
                placeholder="Optional"
                value={primogemNotes}
                onChange={(e) => setPrimogemNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </div>
          </form>

          <div>
            <h3 className="text-lg font-semibold mb-2">Recent Entries</h3>
            <div className="space-y-2">
              {(primogemEntries ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">
                      {entry.amount > 0 ? '+' : ''}
                      {entry.amount} primogems
                    </p>
                    <p className="text-sm text-slate-400 capitalize">{entry.source.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-sm text-slate-500 text-right">
                    <p>{new Date(entry.timestamp).toLocaleDateString()}</p>
                    {entry.notes && <p className="text-slate-400">{entry.notes}</p>}
                  </div>
                </div>
              ))}
              {(primogemEntries?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500">No primogem entries yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h2 className="text-xl font-semibold">Add Fate Entry</h2>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await fateEntryRepo.create({
                amount: fateAmount,
                fateType,
                source: fateSource,
              });
              setFateAmount(1);
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Amount"
                type="number"
                value={fateAmount}
                onChange={(e) => setFateAmount(Number(e.target.value))}
                required
              />
              <Select
                label="Type"
                value={fateType}
                onChange={(e) => setFateType(e.target.value as FateType)}
                options={[
                  { value: 'intertwined', label: 'Intertwined Fate' },
                  { value: 'acquaint', label: 'Acquaint Fate' },
                ]}
              />
              <Select
                label="Source"
                value={fateSource}
                onChange={(e) => setFateSource(e.target.value as FateSource)}
                options={[
                  { value: 'primogem_conversion', label: 'Primogem Conversion' },
                  { value: 'battle_pass', label: 'Battle Pass' },
                  { value: 'paimon_shop', label: 'Paimon’s Bargains' },
                  { value: 'event', label: 'Event' },
                  { value: 'ascension', label: 'Ascension' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </div>
          </form>

          <div>
            <h3 className="text-lg font-semibold mb-2">Recent Entries</h3>
            <div className="space-y-2">
              {(fateEntries ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">
                      {entry.amount > 0 ? '+' : ''}
                      {entry.amount} {entry.fateType === 'intertwined' ? 'Intertwined' : 'Acquaint'} Fate
                    </p>
                    <p className="text-sm text-slate-400 capitalize">{entry.source.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-sm text-slate-500 text-right">
                    <p>{new Date(entry.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {(fateEntries?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500">No fate entries yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">Income Timeline</h2>
            <p className="text-slate-400 text-sm">
              Bucket primogem income by week/month with earned vs purchased breakdowns.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Toggle purchases to include/exclude paid primogems from analytics.
          </p>
        </div>
        <IncomeTimeline buckets={incomeBuckets} filters={timelineFilters} onFiltersChange={handleTimelineFiltersChange} />
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Current Stash</h2>
            <p className="text-slate-400 text-sm">
              Snapshot baseline (ledger deltas and wish spending are applied on top automatically)
            </p>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {latestSnapshot ? new Date(latestSnapshot.timestamp).toLocaleString() : 'No snapshot yet'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            { key: 'primogems', label: 'Primogems' },
            { key: 'genesisCrystals', label: 'Genesis Crystals' },
            { key: 'intertwined', label: 'Intertwined' },
            { key: 'acquaint', label: 'Acquaint' },
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
      </section>
    </div>
  );
}
