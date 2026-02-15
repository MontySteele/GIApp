import { useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { PrimogemEntry, PrimogemSource } from '@/types';

type EntryMode = 'purchase' | 'spending';

interface PurchaseLedgerProps {
  purchases: PrimogemEntry[];
  onAdd: (amount: number, timestamp: string, notes: string, source: PrimogemSource) => Promise<void>;
  onUpdate: (id: string, amount: number, timestamp: string, notes: string, source: PrimogemSource) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface FormState {
  mode: EntryMode;
  amount: number;
  date: string;
  time: string;
  notes: string;
}

const getDefaultFormState = (): FormState => ({
  mode: 'purchase',
  amount: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
  time: format(new Date(), 'HH:mm'),
  notes: '',
});

export function PurchaseLedger({ purchases, onAdd, onUpdate, onDelete }: PurchaseLedgerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(getDefaultFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormState(getDefaultFormState());
    setIsAdding(false);
    setEditingId(null);
  };

  const startEditing = (entry: PrimogemEntry) => {
    const entryDate = parseISO(entry.timestamp);
    const isSpending = entry.source === 'cosmetic';
    setFormState({
      mode: isSpending ? 'spending' : 'purchase',
      amount: Math.abs(entry.amount),
      date: format(entryDate, 'yyyy-MM-dd'),
      time: format(entryDate, 'HH:mm'),
      notes: entry.notes ?? '',
    });
    setEditingId(entry.id);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.amount <= 0) return;

    setIsSubmitting(true);
    try {
      const timestamp = new Date(`${formState.date}T${formState.time}`).toISOString();
      const source: PrimogemSource = formState.mode === 'spending' ? 'cosmetic' : 'purchase';
      const amount = formState.mode === 'spending' ? -formState.amount : formState.amount;

      if (editingId) {
        await onUpdate(editingId, amount, timestamp, formState.notes, source);
      } else {
        await onAdd(amount, timestamp, formState.notes, source);
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  // Split entries into purchases and spending
  const purchaseOnly = purchases.filter((p) => p.source !== 'cosmetic');
  const spendingOnly = purchases.filter((p) => p.source === 'cosmetic');

  // Sort all entries by date descending
  const sortedPurchases = [...purchases].sort(
    (a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
  );

  const totalPurchased = purchaseOnly.reduce((sum, p) => sum + p.amount, 0);
  const totalSpent = spendingOnly.reduce((sum, p) => sum + p.amount, 0); // negative

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-slate-400">Total Purchased</p>
            <p className="text-2xl font-bold text-indigo-400">{totalPurchased.toLocaleString()}</p>
          </div>
          {totalSpent !== 0 && (
            <div>
              <p className="text-sm text-slate-400">Non-Wish Spending</p>
              <p className="text-2xl font-bold text-rose-400">{totalSpent.toLocaleString()}</p>
            </div>
          )}
        </div>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100">
              {editingId ? 'Edit Entry' : 'Add Entry'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-slate-400 hover:text-slate-200"
              aria-label="Close form"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, mode: 'purchase' }))}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                formState.mode === 'purchase'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Purchase (Genesis Crystals)
            </button>
            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, mode: 'spending' }))}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                formState.mode === 'spending'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Spending (Outfits, etc.)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              label="Amount"
              type="number"
              min={1}
              value={formState.amount || ''}
              onChange={(e) => setFormState((s) => ({ ...s, amount: Number(e.target.value) }))}
              placeholder={formState.mode === 'spending' ? 'e.g., 1680' : 'e.g., 8080'}
              required
            />
            <Input
              label="Date"
              type="date"
              value={formState.date}
              onChange={(e) => setFormState((s) => ({ ...s, date: e.target.value }))}
              required
            />
            <Input
              label="Time"
              type="time"
              value={formState.time}
              onChange={(e) => setFormState((s) => ({ ...s, time: e.target.value }))}
              required
            />
            <Input
              label="Notes (optional)"
              type="text"
              value={formState.notes}
              onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
              placeholder={formState.mode === 'spending' ? 'e.g., Jean outfit' : 'e.g., Welkin + BP'}
            />
          </div>

          {formState.mode === 'purchase' && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Quick amounts:</span>
              {[300, 980, 1980, 3280, 6480, 8080].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormState((s) => ({ ...s, amount }))}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  {amount}
                </button>
              ))}
            </div>
          )}

          {formState.mode === 'spending' && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Quick amounts:</span>
              {[1680, 2480].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormState((s) => ({ ...s, amount }))}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  {amount}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={formState.amount <= 0}>
              {editingId ? 'Save Changes' : formState.mode === 'spending' ? 'Log Spending' : 'Add Purchase'}
            </Button>
          </div>
        </form>
      )}

      {/* Entry List */}
      {sortedPurchases.length > 0 ? (
        <div className="space-y-2">
          {sortedPurchases.map((purchase) => {
            const isSpending = purchase.source === 'cosmetic';
            return (
              <div
                key={purchase.id}
                className={`flex items-center justify-between bg-slate-800 border rounded-lg p-3 transition-colors ${
                  editingId === purchase.id ? 'border-primary-500' : 'border-slate-700'
                }`}
              >
                <div>
                  <p className={`font-semibold ${isSpending ? 'text-rose-300' : 'text-indigo-300'}`}>
                    {isSpending ? '' : '+'}{purchase.amount.toLocaleString()} primogems
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{format(parseISO(purchase.timestamp), 'MMM d, yyyy h:mm a')}</span>
                    <span>•</span>
                    <span className={isSpending ? 'text-rose-400' : 'text-indigo-400'}>
                      {isSpending ? 'Cosmetic' : 'Purchase'}
                    </span>
                    {purchase.notes && (
                      <>
                        <span>•</span>
                        <span>{purchase.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(purchase)}
                    className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded"
                    title="Edit"
                    aria-label="Edit purchase"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(purchase.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                    title="Delete"
                    aria-label="Delete purchase"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center text-slate-400">
          No entries recorded yet. Genesis crystal purchases and non-wish spending (outfits, etc.) go here.
        </div>
      )}

      <p className="text-xs text-slate-500">
        Track primogem purchases and non-wish spending separately from earned income. Spending entries (outfits, etc.)
        are automatically accounted for in income rate calculations.
      </p>
    </div>
  );
}

export default PurchaseLedger;
