import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { format } from 'date-fns';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import type { ResourceSnapshot, WishRecord, PrimogemEntry } from '@/types';
import {
  buildUnifiedChartData,
  calculateDailyRateFromSnapshots,
  calculateDailyRateFromWishes,
  type ChartDataPoint,
} from '../domain/historicalReconstruction';
import { PRIMOS_PER_PULL } from '@/lib/constants';

interface UnifiedChartProps {
  snapshots: ResourceSnapshot[];
  wishes: WishRecord[];
  purchases: PrimogemEntry[];
  currentPrimogems: number;
  currentIntertwined?: number;
}

type ProjectionDays = 21 | 42 | 63 | 84;
type LookbackDays = 30 | 60 | 90 | 180;
type RateLookbackDays = 14 | 30 | 60 | 90;

export function UnifiedChart({ snapshots, wishes, purchases, currentPrimogems, currentIntertwined = 0 }: UnifiedChartProps) {
  const [projectionDays, setProjectionDays] = useState<ProjectionDays>(42);
  const [lookbackDays, setLookbackDays] = useState<LookbackDays>(90);
  const [rateLookbackDays, setRateLookbackDays] = useState<RateLookbackDays>(14);
  const [customDailyRate, setCustomDailyRate] = useState<number | null>(null);
  const [showPurchases, setShowPurchases] = useState(true);

  // Prefer snapshot-based calculation (more accurate), fall back to wish-based
  const { calculatedDailyRate, rateSource } = useMemo(() => {
    const snapshotRate = calculateDailyRateFromSnapshots(snapshots, wishes, rateLookbackDays);
    if (snapshotRate > 0) {
      return { calculatedDailyRate: snapshotRate, rateSource: 'snapshots' as const };
    }
    return { calculatedDailyRate: calculateDailyRateFromWishes(wishes, rateLookbackDays), rateSource: 'wishes' as const };
  }, [snapshots, wishes, rateLookbackDays]);

  const effectiveDailyRate = customDailyRate ?? calculatedDailyRate;

  const chartData = useMemo(
    () => buildUnifiedChartData(snapshots, wishes, purchases, effectiveDailyRate, lookbackDays, projectionDays),
    [snapshots, wishes, purchases, effectiveDailyRate, lookbackDays, projectionDays]
  );

  // Find snapshot points for reference dots
  const snapshotPoints = chartData.filter(d => d.isSnapshot);

  // Calculate summary stats
  const finalProjection = chartData[chartData.length - 1];

  const pullsFromPrimos = Math.floor(currentPrimogems / PRIMOS_PER_PULL);
  const currentPulls = pullsFromPrimos + currentIntertwined;
  const projectedPrimogems = finalProjection?.projected ?? currentPrimogems;
  // Note: projectedPrimogems already includes intertwined fates as primogem-equivalent
  // (from buildHistoricalData which adds intertwined * 160 to the total)
  // So we don't add currentIntertwined again here
  const projectedPulls = Math.floor(projectedPrimogems / PRIMOS_PER_PULL);
  const daysForOnePity = effectiveDailyRate > 0 ? Math.ceil((90 * PRIMOS_PER_PULL) / effectiveDailyRate) : Infinity;

  interface TooltipPayload {
    payload: ChartDataPoint;
    value: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    const firstPayload = payload?.[0];
    if (active && firstPayload) {
      const data = firstPayload.payload;
      const displayValue = showPurchases
        ? (data.historicalWithPurchases ?? data.projectedWithPurchases ?? data.historical ?? data.projected)
        : (data.historical ?? data.projected);
      const pullsAtPoint = Math.floor((displayValue ?? 0) / PRIMOS_PER_PULL);

      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-100 font-semibold mb-2">
            {data.label}
            {data.isToday && <span className="text-amber-400 ml-2">(Today)</span>}
            {data.isSnapshot && <span className="text-green-400 ml-2">(Snapshot)</span>}
          </p>
          <div className="space-y-1 text-sm">
            {data.historical !== undefined && (
              <p className="text-primary-400">
                Historical: <span className="font-semibold">{Math.round(showPurchases ? (data.historicalWithPurchases ?? 0) : data.historical).toLocaleString()}</span>
              </p>
            )}
            {data.projected !== undefined && (
              <p className="text-green-400">
                Projected: <span className="font-semibold">{Math.round(showPurchases ? (data.projectedWithPurchases ?? 0) : data.projected).toLocaleString()}</span>
              </p>
            )}
            <p className="text-amber-400">
              Pulls: <span className="font-semibold">{pullsAtPoint}</span>
            </p>
            {data.cumulativePulls > 0 && (
              <p className="text-slate-400 text-xs">
                Total pulls to date: {data.cumulativePulls}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasSnapshots = snapshots.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="History"
          value={lookbackDays.toString()}
          onChange={(e) => setLookbackDays(Number(e.target.value) as LookbackDays)}
          options={[
            { value: '30', label: '30 days' },
            { value: '60', label: '60 days' },
            { value: '90', label: '90 days' },
            { value: '180', label: '180 days' },
          ]}
        />
        <Select
          label="Projection"
          value={projectionDays.toString()}
          onChange={(e) => setProjectionDays(Number(e.target.value) as ProjectionDays)}
          options={[
            { value: '21', label: '21 days (1 banner)' },
            { value: '42', label: '42 days (1 patch)' },
            { value: '63', label: '63 days (3 banners)' },
            { value: '84', label: '84 days (2 patches)' },
          ]}
        />
        <Select
          label="Rate window"
          value={rateLookbackDays.toString()}
          onChange={(e) => setRateLookbackDays(Number(e.target.value) as RateLookbackDays)}
          options={[
            { value: '14', label: '14 days' },
            { value: '30', label: '30 days' },
            { value: '60', label: '60 days' },
            { value: '90', label: '90 days' },
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
        <label className="flex items-center gap-2 text-sm text-slate-200 mb-1">
          <input
            type="checkbox"
            checked={showPurchases}
            onChange={(e) => setShowPurchases(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Include purchases (uncheck for F2P view)
        </label>
      </div>

      {!hasSnapshots && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-3">
          <p className="text-sm text-amber-300">
            No resource snapshots found. Add a snapshot to see historical primogem reconstruction based on your wish history.
          </p>
          <p className="text-xs text-amber-400/70 mt-1">
            The chart will use wish spending data to reconstruct your historical primogem balance.
          </p>
        </div>
      )}

      {calculatedDailyRate === 0 && customDailyRate === null && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <p className="text-sm text-slate-300">
            No recent wishes found to calculate daily income rate. Enter a daily rate manually for projections.
          </p>
          <p className="text-xs text-slate-400 mt-1">
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
            {customDailyRate !== null
              ? 'manual override'
              : rateSource === 'snapshots'
                ? `from ${rateLookbackDays}d snapshots`
                : `from ${rateLookbackDays}d wish history`}
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Current Pulls</p>
          <p className="text-xl font-bold text-amber-400">{currentPulls}</p>
          <p className="text-xs text-slate-500">
            {pullsFromPrimos} from primos{currentIntertwined > 0 && ` + ${currentIntertwined} fates`}
          </p>
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
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
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

              {/* Historical data */}
              <Area
                type="monotone"
                dataKey={showPurchases ? 'historicalWithPurchases' : 'historical'}
                name="Historical"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#historicalGradient)"
                connectNulls={false}
              />

              {/* Projection data */}
              <Line
                type="monotone"
                dataKey={showPurchases ? 'projectedWithPurchases' : 'projected'}
                name="Projected"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />

              {/* Today marker */}
              <ReferenceLine
                x={format(new Date(), 'MMM d')}
                stroke="#f59e0b"
                strokeWidth={2}
                label={{ value: 'Today', fill: '#f59e0b', fontSize: 12 }}
              />

              {/* Snapshot markers */}
              {snapshotPoints.map((point) => (
                <ReferenceDot
                  key={point.date}
                  x={point.label}
                  y={showPurchases ? point.historicalWithPurchases : point.historical}
                  r={6}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>• Historical data reconstructed from snapshots and intertwined fate spending (160 primos per pull)</p>
        <p>• Standard banner pulls excluded (use acquaint fates, not primogems)</p>
        <p>• Daily rate = (change in resources + spending) ÷ days between snapshots</p>
        <p>• Green dots indicate snapshot points (ground truth data)</p>
        {!showPurchases && <p>• F2P view: Purchased primogems excluded from calculations</p>}
      </div>
    </div>
  );
}

export default UnifiedChart;
