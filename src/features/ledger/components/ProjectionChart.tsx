import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format, addDays, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import type { PrimogemEntry } from '@/types';
import { PRIMOS_PER_PULL } from '@/lib/constants';

interface ProjectionChartProps {
  entries: PrimogemEntry[];
  currentPrimogems: number;
}

type ProjectionDays = 30 | 60 | 90 | 180;

interface ChartDataPoint {
  date: string;
  label: string;
  projected: number;
  isToday?: boolean;
}

function calculateDailyIncomeRate(entries: PrimogemEntry[], lookbackDays: number = 30): number {
  if (entries.length === 0) return 0;

  const now = new Date();
  const cutoffDate = addDays(now, -lookbackDays);

  // Filter to earned entries (not purchases) within lookback period with positive amounts
  const recentEntries = entries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp);
    return (
      isAfter(entryDate, cutoffDate) &&
      isBefore(entryDate, addDays(now, 1)) &&
      entry.source !== 'purchase' &&
      entry.amount > 0
    );
  });

  if (recentEntries.length === 0) return 0;

  // Calculate total earned in the period
  const totalEarned = recentEntries.reduce((sum, e) => sum + e.amount, 0);

  // Find the actual date range of the data
  const dates = recentEntries.map((e) => parseISO(e.timestamp));
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  // Use the span of days with data, or at least 1 day
  const actualDays = Math.max(1, differenceInDays(maxDate, minDate) + 1);

  return totalEarned / actualDays;
}

function buildChartData(
  currentPrimogems: number,
  projectionDays: ProjectionDays,
  dailyRate: number
): ChartDataPoint[] {
  const now = new Date();
  const data: ChartDataPoint[] = [];

  // Start from today and project forward
  for (let i = 0; i <= projectionDays; i++) {
    const date = addDays(now, i);
    const projectedValue = currentPrimogems + dailyRate * i;

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM d'),
      projected: Math.max(0, projectedValue),
      isToday: i === 0,
    });
  }

  return data;
}

export function ProjectionChart({ entries, currentPrimogems }: ProjectionChartProps) {
  const [projectionDays, setProjectionDays] = useState<ProjectionDays>(60);
  const [customDailyRate, setCustomDailyRate] = useState<number | null>(null);

  const calculatedDailyRate = useMemo(
    () => calculateDailyIncomeRate(entries, 30),
    [entries]
  );

  const effectiveDailyRate = customDailyRate ?? calculatedDailyRate;

  const chartData = useMemo(
    () => buildChartData(currentPrimogems, projectionDays, effectiveDailyRate),
    [currentPrimogems, projectionDays, effectiveDailyRate]
  );

  // Calculate summary stats
  const projectedPrimogems = currentPrimogems + effectiveDailyRate * projectionDays;
  const projectedPulls = Math.floor(projectedPrimogems / PRIMOS_PER_PULL);
  const currentPulls = Math.floor(currentPrimogems / PRIMOS_PER_PULL);
  const daysForOnePity = effectiveDailyRate > 0 ? Math.ceil((90 * PRIMOS_PER_PULL) / effectiveDailyRate) : Infinity;

  // Count recent entries for display
  const recentEntriesCount = entries.filter((e) => {
    const entryDate = parseISO(e.timestamp);
    return isAfter(entryDate, addDays(new Date(), -30)) && e.source !== 'purchase' && e.amount > 0;
  }).length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const pullsAtPoint = Math.floor(data.projected / PRIMOS_PER_PULL);
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-100 font-semibold mb-2">
            {data.label} {data.isToday && <span className="text-amber-400">(Today)</span>}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-primary-400">
              Primogems: <span className="font-semibold">{Math.round(data.projected).toLocaleString()}</span>
            </p>
            <p className="text-amber-400">
              Pulls: <span className="font-semibold">{pullsAtPoint}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Projection period"
          value={projectionDays.toString()}
          onChange={(e) => setProjectionDays(Number(e.target.value) as ProjectionDays)}
          options={[
            { value: '30', label: '30 days' },
            { value: '60', label: '60 days' },
            { value: '90', label: '90 days (1 patch)' },
            { value: '180', label: '180 days (3 patches)' },
          ]}
        />
        <Input
          label="Daily rate override"
          type="number"
          placeholder={calculatedDailyRate > 0 ? `Auto: ${Math.round(calculatedDailyRate)}` : 'Enter rate'}
          value={customDailyRate ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setCustomDailyRate(val === '' ? null : Number(val));
          }}
        />
      </div>

      {calculatedDailyRate === 0 && customDailyRate === null && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-300">
            No primogem entries found in the last 30 days. Enter a daily rate manually to see projections.
          </p>
          <p className="text-xs text-amber-400/70 mt-1">
            Typical rates: ~60/day (commissions only), ~150/day (with Welkin), ~200+/day (active events)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Daily Income Rate</p>
          <p className="text-xl font-bold text-primary-400">
            {Math.round(effectiveDailyRate).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">
            {customDailyRate !== null ? 'manual override' : `from ${recentEntriesCount} entries`}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Current Pulls</p>
          <p className="text-xl font-bold text-amber-400">{currentPulls}</p>
          <p className="text-xs text-slate-500">from {currentPrimogems.toLocaleString()} primos</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Projected Pulls ({projectionDays}d)</p>
          <p className="text-xl font-bold text-green-400">{projectedPulls}</p>
          <p className="text-xs text-slate-500">+{projectedPulls - currentPulls} from income</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Days per Pity (90 pulls)</p>
          <p className="text-xl font-bold text-purple-400">
            {daysForOnePity === Infinity ? '∞' : daysForOnePity}
          </p>
          <p className="text-xs text-slate-500">{(90 * PRIMOS_PER_PULL).toLocaleString()} primos needed</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine
                x={format(new Date(), 'MMM d')}
                stroke="#f59e0b"
                strokeWidth={2}
                label={{ value: 'Today', fill: '#f59e0b', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected Primogems"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>• Daily rate calculated from your last 30 days of earned primogems (excluding purchases)</p>
        <p>• Projection assumes consistent daily income at the calculated/entered rate</p>
        <p>• Use the override field to model different scenarios (e.g., 60 for commissions-only, 150 for Welkin)</p>
      </div>
    </div>
  );
}

export default ProjectionChart;
