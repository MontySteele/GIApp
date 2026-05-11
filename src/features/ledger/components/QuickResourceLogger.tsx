import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { primogemEntryRepo } from '../repo/primogemEntryRepo';
import type { PrimogemEntry, PrimogemSource } from '@/types';

interface PresetEntry {
  label: string;
  amount: number;
  source: PrimogemSource;
  notes: string;
}

const PRESETS: PresetEntry[] = [
  { label: 'Commissions', amount: 60, source: 'daily_commission', notes: 'Daily commissions' },
  { label: 'Welkin', amount: 90, source: 'welkin', notes: 'Welkin Moon' },
  { label: 'Code', amount: 60, source: 'codes', notes: 'Redemption code' },
  { label: 'Event', amount: 420, source: 'event', notes: 'Event rewards' },
];

function getRepeatableEntry(entries: PrimogemEntry[] | undefined): PrimogemEntry | null {
  return entries?.find((entry) => entry.amount > 0 && entry.source !== 'purchase') ?? null;
}

export default function QuickResourceLogger() {
  const entries = useLiveQuery(() => primogemEntryRepo.getAll(), []);
  const repeatEntry = useMemo(() => getRepeatableEntry(entries), [entries]);
  const [customAmount, setCustomAmount] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logEntry = async (entry: PresetEntry) => {
    setIsSaving(true);
    try {
      await primogemEntryRepo.create({
        amount: entry.amount,
        source: entry.source,
        notes: entry.notes,
      });
      setLastSaved(`Logged ${entry.amount} primogems from ${entry.label}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const logRepeat = async () => {
    if (!repeatEntry) return;
    await logEntry({
      label: repeatEntry.notes || repeatEntry.source.replace(/_/g, ' '),
      amount: repeatEntry.amount,
      source: repeatEntry.source,
      notes: repeatEntry.notes || 'Repeated entry',
    });
  };

  const logCustom = async () => {
    const amount = Math.floor(Number(customAmount));
    if (!Number.isFinite(amount) || amount <= 0) return;
    await logEntry({
      label: customNotes || 'Custom',
      amount,
      source: 'other',
      notes: customNotes || 'Quick add',
    });
    setCustomAmount('');
    setCustomNotes('');
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Quick Log</h2>
        <p className="text-sm text-slate-400">Capture common primogem income without opening the full tracker.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => logEntry(preset)}
            loading={isSaving}
          >
            <Plus className="h-4 w-4" />
            {preset.label} +{preset.amount}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          aria-label="Custom primogem amount"
          type="number"
          min="1"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Amount"
        />
        <Input
          aria-label="Custom primogem note"
          value={customNotes}
          onChange={(event) => setCustomNotes(event.target.value)}
          placeholder="Note"
        />
        <Button type="button" variant="secondary" onClick={logCustom} disabled={!customAmount || isSaving}>
          Add
        </Button>
        <Button type="button" variant="ghost" onClick={logRepeat} disabled={!repeatEntry || isSaving}>
          <RotateCcw className="h-4 w-4" />
          Repeat Last
        </Button>
      </div>

      {lastSaved && (
        <div className="mt-3 rounded-lg border border-green-900/50 bg-green-950/20 px-3 py-2 text-sm text-green-200">
          {lastSaved}
        </div>
      )}
    </section>
  );
}
