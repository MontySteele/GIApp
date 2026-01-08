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
import { format, addDays, parseISO, differenceInDays, startOfDay, isAfter, isBefore } from 'date-fns';
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
  actual?: number;
  projected: number;
  dailyRate: number;
}

function calculateDailyIncomeRate(entries: PrimogemEntry[], lookbackDays: number = 30): number {
  if (entries.length === 0) return 0;

  const now = new Date();
  const cutoffDate = addDays(now, -lookbackDays);

  // Filter to earned entries (not purchases) within lookback period
  const recentEntries = entries.filter((entry) => {
    const entryDate = parseISO(entry.timestamp);
    return (
      isAfter(entryDate, cutoffDate) &&
      isBefore(entryDate, now) &&
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

  const actualDays = Math.max(1, differenceInDays(maxDate, minDate) + 1);

  return totalEarned / actualDays;
}

function buildChartData(
  entries: PrimogemEntry[],
  currentPrimogems: number,
  projectionDays: ProjectionDays,
  dailyRate: number
): ChartDataPoint[] {
  const now = startOfDay(new Date());
  const data: ChartDataPoint[] = [];

  // Build historical data (last 30 days of actual values)
  const historicalDays = 30;
  const historicalStart = addDays(now, -historicalDays);

  // Compute cumulative primogems backwards from current
  // We need to subtract entries that happened after each historical date
  const sortedEntries = [...entries].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
  );

  // Calculate primogems at historical start by working backwards
  let primogemsAtHistoricalStart = currentPrimogems;
  for (const entry of sortedEntries) {
    const entryDate = parseISO(entry.timestamp);
    if (isAfter(entryDate, historicalStart) && isBefore(entryDate, addDays(now, 1))) {
      primogemsAtHistoricalStart -= entry.amount;
    }
  }

  // Now build forward from historical start
  let runningTotal = primogemsAtHistoricalStart;

  for (let i = 0; i <= historicalDays; i++) {
    const date = addDays(historicalStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Add entries for this day
    const dayEntries = sortedEntries.filter((e) => {
      const entryDate = startOfDay(parseISO(e.timestamp));
      return format(entryDate, 'yyyy-MM-dd') === dateStr;
    });

    for (const entry of dayEntries) {
      runningTotal += entry.amount;
    }

    // Calculate what projected value would have been
    const daysFromStart = i;
    const projectedFromStart = primogemsAtHistoricalStart + dailyRate * daysFromStart;

    data.push({
      date: dateStr,
      label: format(date, 'MMM d'),
      actual: Math.max(0, runningTotal),
      projected: Math.max(0, projectedFromStart),
      dailyRate,
    });
  }

  // Add projection data (future days)
  for (let i = 1; i <= projectionDays; i++) {
    const date = addDays(now, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const projectedValue = currentPrimogems + dailyRate * i;

    data.push({
      date: dateStr,
      label: format(date, 'MMM d'),
      projected: Math.max(0, projectedValue),
      dailyRate,
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
    () => buildChartData(entries, currentPrimogems, projectionDays, effectiveDailyRate),
    [entries, currentPrimogems, projectionDays, effectiveDailyRate]
  );

  const projectedPulls = Math.floor((currentPrimogems + effectiveDailyRate * projectionDays) / PRIMOS_PER_PULL);
  const currentPulls = Math.floor(currentPrimogems / PRIMOS_PER_PULL);
  const daysForOnePity = effectiveDailyRate > 0 ? Math.ceil((90 * PRIMOS_PER_PULL) / effectiveDailyRate) : Infinity;

  // Calculate divergence (difference between actual and projected at today)
  const todayData = chartData.find((d) => d.actual !== undefined && d.date === format(new Date(), 'yyyy-MM-dd'));
  const divergence = todayData ? (todayData.actual ?? 0) - todayData.projected : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-100 font-semibold mb-2">{data.label}</p>
          <div className="space-y-1 text-sm">
            {data.actual !== undefined && (
              <p className="text-green-400">
                Actual: <span className="font-semibold">{data.actual.toLocaleString()}</span>
              </p>
            )}
            <p className="text-primary-400">
              Projected: <span className="font-semibold">{Math.round(data.projected).toLocaleString()}</span>
            </p>
            {data.actual !== undefined && (
              <p className={divergence >= 0 ? 'text-green-300' : 'text-red-300'}>
                Divergence: {divergence >= 0 ? '+' : ''}{Math.round(data.actual - data.projected).toLocaleString()}
              </p>
            )}
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
          placeholder={`Auto: ${Math.round(calculatedDailyRate)}`}
          value={customDailyRate ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setCustomDailyRate(val === '' ? null : Number(val));
          }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Daily Income Rate</p>
          <p className="text-xl font-bold text-primary-400">
            {Math.round(effectiveDailyRate).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">primogems/day</p>
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
          <p className="text-xs text-slate-500">{Math.round((90 * PRIMOS_PER_PULL)).toLocaleString()} primos needed</p>
        </div>
      </div>

      {divergence !== 0 && (
        <div className={`border rounded-lg p-3 ${divergence >= 0 ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
          <p className={`text-sm ${divergence >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {divergence >= 0 ? '📈 Ahead of projection' : '📉 Behind projection'} by{' '}
            <span className="font-semibold">{Math.abs(Math.round(divergence)).toLocaleString()}</span> primogems
            {' '}({Math.abs(Math.floor(divergence / PRIMOS_PER_PULL))} pulls)
          </p>
        </div>
      )}

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
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine
                x={format(new Date(), 'MMM d')}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ value: 'Today', fill: '#f59e0b', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="#0ea5e9"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>• Daily rate calculated from your last 30 days of earned primogems (excluding purchases)</p>
        <p>• Projection assumes consistent daily income at the calculated rate</p>
        <p>• Use the override field to model different income scenarios (e.g., 60 for commissions-only, 150 for Welkin)</p>
      </div>
    </div>
  );
}

export default ProjectionChart;
