import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Camera, CreditCard, Sparkles, Filter, MinusCircle } from 'lucide-react';
import Select from '@/components/ui/Select';
import type { ResourceSnapshot, WishRecord, PrimogemEntry } from '@/types';
import { buildTransactionLog, type TransactionLogEntry } from '../domain/historicalReconstruction';

interface TransactionLogProps {
  snapshots: ResourceSnapshot[];
  wishes: WishRecord[];
  purchases: PrimogemEntry[];
  onEditPurchase?: (entry: PrimogemEntry) => void;
  onDeletePurchase?: (id: string) => void;
}

type FilterType = 'all' | 'snapshot' | 'purchase' | 'wish_spending' | 'cosmetic_spending';

export function TransactionLog({
  snapshots,
  wishes,
  purchases,
  onEditPurchase,
  onDeletePurchase,
}: TransactionLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [limit, setLimit] = useState(20);

  const allEntries = useMemo(
    () => buildTransactionLog(snapshots, wishes, purchases),
    [snapshots, wishes, purchases]
  );

  const filteredEntries = useMemo(() => {
    if (filter === 'all') return allEntries;
    return allEntries.filter((e) => e.type === filter);
  }, [allEntries, filter]);

  const displayedEntries = filteredEntries.slice(0, limit);
  const hasMore = filteredEntries.length > limit;

  const getIcon = (type: TransactionLogEntry['type']) => {
    switch (type) {
      case 'snapshot':
        return <Camera className="w-4 h-4 text-green-400" />;
      case 'purchase':
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
      case 'wish_spending':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'cosmetic_spending':
        return <MinusCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getTypeLabel = (type: TransactionLogEntry['type']) => {
    switch (type) {
      case 'snapshot':
        return 'Snapshot';
      case 'purchase':
        return 'Purchase';
      case 'wish_spending':
        return 'Wish Spending';
      case 'cosmetic_spending':
        return 'Cosmetic Spending';
    }
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'text-green-400';
    if (amount < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  if (allEntries.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
        No transactions recorded yet. Add a snapshot or make some wishes to see activity here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          options={[
            { value: 'all', label: 'All Transactions' },
            { value: 'snapshot', label: 'Snapshots' },
            { value: 'purchase', label: 'Purchases' },
            { value: 'wish_spending', label: 'Wish Spending' },
            { value: 'cosmetic_spending', label: 'Cosmetic Spending' },
          ]}
        />
        <span className="text-sm text-slate-400">
          {filteredEntries.length} entries
        </span>
      </div>

      <div className="space-y-2">
        {displayedEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 bg-slate-800 border border-slate-700 rounded-lg p-3 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex-shrink-0">
              {getIcon(entry.type)}
            </div>

            <div className="flex-grow min-w-0">
              <p className="font-medium text-slate-100 truncate">
                {entry.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{format(parseISO(entry.date), 'MMM d, yyyy h:mm a')}</span>
                <span>•</span>
                <span className="capitalize">{getTypeLabel(entry.type)}</span>
                {entry.notes && (
                  <>
                    <span>•</span>
                    <span className="truncate">{entry.notes}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <p className={`font-semibold ${getAmountColor(entry.amount)}`}>
                {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">primogems</p>
            </div>

            {entry.editable && (entry.type === 'purchase' || entry.type === 'cosmetic_spending') && (
              <div className="flex-shrink-0 flex gap-2">
                {onEditPurchase && (
                  <button
                    onClick={() => onEditPurchase(entry.originalEntry as PrimogemEntry)}
                    className="px-2 py-1 text-xs text-primary-400 hover:text-primary-300 hover:bg-slate-700 rounded"
                  >
                    Edit
                  </button>
                )}
                {onDeletePurchase && (
                  <button
                    onClick={() => {
                      const purchase = entry.originalEntry as PrimogemEntry;
                      if (confirm(`Delete purchase of ${purchase.amount} primogems?`)) {
                        onDeletePurchase(purchase.id);
                      }
                    }}
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-slate-700 rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setLimit((l) => l + 20)}
          className="w-full py-2 text-sm text-primary-400 hover:text-primary-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Load more ({filteredEntries.length - limit} remaining)
        </button>
      )}
    </div>
  );
}

export default TransactionLog;
