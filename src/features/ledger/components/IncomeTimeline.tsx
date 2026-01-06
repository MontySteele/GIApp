import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { IncomeBucket, IncomeBucketFilters } from '../domain/resourceCalculations';
import { PRIMOGEM_SOURCES } from '../domain/resourceCalculations';

interface IncomeTimelineProps {
  buckets: IncomeBucket[];
  filters: IncomeBucketFilters;
  onFiltersChange: (next: IncomeBucketFilters) => void;
}

export function IncomeTimeline({ buckets, filters, onFiltersChange }: IncomeTimelineProps) {
  const chartData = buckets.map((bucket) => ({
    label: bucket.label,
    earned: bucket.totals.earned,
    purchased: bucket.totals.purchased,
    total: bucket.totals.total,
  }));

  const handleFilterChange = <K extends keyof IncomeBucketFilters>(key: K, value: IncomeBucketFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Interval"
          value={filters.interval}
          onChange={(e) => handleFilterChange('interval', e.target.value as IncomeBucketFilters['interval'])}
          options={[
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
          ]}
        />

        <Input
          label="Start Date"
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
        />

        <Input
          label="End Date"
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
        />

        <Select
          label="Source"
          value={filters.source ?? 'all'}
          onChange={(e) => handleFilterChange('source', e.target.value as IncomeBucketFilters['source'])}
          options={[{ value: 'all', label: 'All Sources' }, ...PRIMOGEM_SOURCES.map((source) => ({
            value: source,
            label: source.replace(/_/g, ' '),
          }))]}
        />

        <label className="flex items-center gap-2 text-sm text-slate-200 mb-1">
          <input
            type="checkbox"
            checked={filters.includePurchases}
            onChange={(e) => handleFilterChange('includePurchases', e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Include purchases
        </label>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="earned" stackId="income" fill="#22c55e" name="Earned" />
              <Bar dataKey="purchased" stackId="income" fill="#6366f1" name="Purchased" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-3">Breakdown</h4>
        <div className="space-y-2">
          {buckets.map((bucket) => (
            <div key={bucket.bucketStart} className="border border-slate-800 rounded-lg p-3 bg-slate-900/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-100">{bucket.label}</p>
                  <p className="text-xs text-slate-400">Totals from {filters.interval}</p>
                </div>
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-primary-300">{bucket.totals.total}</span> primogems total
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400">Earned</p>
                  <p className="text-lg font-semibold text-green-300">{bucket.totals.earned}</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400">Purchased</p>
                  <p className="text-lg font-semibold text-indigo-300">{bucket.totals.purchased}</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400">Top Sources</p>
                  <ul className="space-y-1">
                    {Object.entries(bucket.totals.sources)
                      .filter(([, amount]) => amount !== 0)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([source, amount]) => (
                        <li key={source} className="flex justify-between">
                          <span className="capitalize">{source.replace(/_/g, ' ')}</span>
                          <span className="text-slate-200 font-semibold">{amount}</span>
                        </li>
                      ))}
                    {Object.values(bucket.totals.sources).every((amount) => amount === 0) && (
                      <li className="text-slate-500">No data</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
          {buckets.length === 0 && <p className="text-sm text-slate-500">No income records in this range.</p>}
        </div>
      </div>
    </div>
  );
}

export default IncomeTimeline;
