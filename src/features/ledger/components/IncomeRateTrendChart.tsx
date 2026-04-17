import { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { ResourceSnapshot, WishRecord, PrimogemEntry } from '@/types';
import {
  calculateIncomeRateTrend,
  type IncomeRateDataPoint,
} from '../domain/historicalReconstruction';

interface IncomeRateTrendChartProps {
  snapshots: ResourceSnapshot[];
  wishes: WishRecord[];
  purchases: PrimogemEntry[];
}

export function IncomeRateTrendChart({ snapshots, wishes, purchases }: IncomeRateTrendChartProps) {
  const [excludePurchases, setExcludePurchases] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  const trendData = useMemo(
    () => calculateIncomeRateTrend(snapshots, wishes, purchases, excludePurchases),
    [snapshots, wishes, purchases, excludePurchases]
  );

  // One-time diagnostic: for each trendData period, count how many wishes
  // actually have stored timestamps inside [periodStart, periodEnd), and
  // list the bannerType/timestamp of wishes within ±12h of each boundary.
  // This lets us see whether the bucketing mismatch is due to stored TZ
  // shift, mental-model mismatch, or a code bug.
  useEffect(() => {
    if (!showDebug) return;
    const INTERTWINED = new Set(['character', 'weapon', 'chronicled']);
    const parsed = wishes
      .filter(w => INTERTWINED.has(w.bannerType))
      .map(w => ({ ...w, t: new Date(w.timestamp).getTime() }))
      .sort((a, b) => a.t - b.t);
    /* eslint-disable no-console */
    console.group('[IncomeRate] wish bucketing diagnostic');
    console.log(`Total intertwined wishes: ${parsed.length}`);
    for (const d of trendData) {
      const startMs = new Date(d.periodStart + 'T00:00:00Z').getTime(); // rough bucket label
      console.group(`Period ${d.label} (starts ${d.periodStart}, reports ${d.estimate?.wishesInPeriod ?? d.diagnostics?.wishesBetween ?? '?'} wishes)`);
      // Nearby = within 24h of periodStart
      const nearby = parsed.filter(w => Math.abs(w.t - startMs) <= 24 * 3600 * 1000);
      console.table(
        nearby.slice(0, 30).map(w => ({
          banner: w.bannerType,
          stored: w.timestamp,
          vsBoundary: `${((w.t - startMs) / 3600000).toFixed(1)}h`,
        })),
      );
      console.groupEnd();
    }
    console.log('Inspect: does each wish timestamp align with when you actually pulled (server time UTC-5 for NA)?');
    console.groupEnd();
    /* eslint-enable no-console */
  }, [showDebug, trendData, wishes]);

  // Calculate average and trend
  const averageRate = useMemo(() => {
    if (trendData.length === 0) return 0;
    const total = trendData.reduce((sum, d) => sum + d.dailyRate, 0);
    return Math.round(total / trendData.length);
  }, [trendData]);

  // Calculate recent vs early average to show trend direction
  const trendDirection = useMemo(() => {
    if (trendData.length < 4) return null;
    const midpoint = Math.floor(trendData.length / 2);
    const earlyAvg = trendData.slice(0, midpoint).reduce((sum, d) => sum + d.dailyRate, 0) / midpoint;
    const lateAvg = trendData.slice(midpoint).reduce((sum, d) => sum + d.dailyRate, 0) / (trendData.length - midpoint);
    const change = ((lateAvg - earlyAvg) / earlyAvg) * 100;
    return {
      earlyAvg: Math.round(earlyAvg),
      lateAvg: Math.round(lateAvg),
      changePercent: Math.round(change),
    };
  }, [trendData]);

  interface TooltipPayload {
    payload: IncomeRateDataPoint;
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
      const d = data.diagnostics;
      const e = data.estimate;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-slate-100 font-semibold mb-2">
            Banner starting {data.label}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-primary-400">
              Daily Rate: <span className="font-semibold">{data.dailyRate}</span> primos/day
            </p>
            <p className="text-slate-300">
              Total Income: <span className="font-semibold">{data.totalIncome.toLocaleString()}</span> primos
            </p>
            <p className="text-slate-400 text-xs">
              {Math.round(data.days)} days in period
            </p>
            {!data.hasSnapshotData && (
              <p className="text-amber-400 text-xs">
                * Estimated from wish spending
              </p>
            )}
            {e && (
              <div className="mt-2 pt-2 border-t border-slate-700 text-xs space-y-0.5">
                <p className="text-slate-400 font-semibold">Estimate tie-back</p>
                <p className="text-slate-300">
                  Wishes in period: <span className="font-mono">{e.wishesInPeriod}</span> ({e.wishPrimos.toLocaleString()} primos)
                </p>
                {e.purchasesInPeriod > 0 && excludePurchases && (
                  <p className="text-amber-300">
                    Purchases subtracted: <span className="font-mono">−{e.purchasesInPeriod.toLocaleString()}</span>
                  </p>
                )}
                {e.purchasesInPeriod > 0 && !excludePurchases && (
                  <p className="text-slate-400">
                    Purchases in period: <span className="font-mono">{e.purchasesInPeriod.toLocaleString()}</span> (not subtracted)
                  </p>
                )}
                <p className="text-slate-200 pt-0.5">
                  = <span className="font-mono">{e.estimatedIncome.toLocaleString()}</span> over {Math.round(e.effectiveDays)}d ({Math.round(e.estimatedIncome / (e.effectiveDays || 1))}/d)
                </p>
                <p className="text-slate-500 pt-1 italic">
                  Assumes spending ≈ earning (no snapshot bracket for this period).
                </p>
              </div>
            )}
            {d && (
              <div className="mt-2 pt-2 border-t border-slate-700 text-xs space-y-0.5">
                <p className="text-slate-400 font-semibold">Period breakdown</p>
                <p className="text-slate-400">
                  Bracketed by snapshots {d.startSnapshotDate} → {d.endSnapshotDate}
                </p>
                <p className="text-slate-300">
                  Earned Δ: <span className="font-mono">{d.snapshotDelta >= 0 ? '+' : ''}{d.snapshotDelta.toLocaleString()}</span>
                </p>
                <p className="text-slate-300">
                  Wishes in period: <span className="font-mono">{d.wishesBetween}</span> ({d.wishPrimosBetween.toLocaleString()} primos)
                </p>
                {d.cosmeticRecovered > 0 && (
                  <p className="text-slate-300">
                    Cosmetic spent: <span className="font-mono">+{d.cosmeticRecovered.toLocaleString()}</span>
                  </p>
                )}
                {d.purchasesExcluded > 0 && (
                  <p className="text-amber-300">
                    Purchases excluded: <span className="font-mono">−{d.purchasesExcluded.toLocaleString()}</span>
                  </p>
                )}
                <p className="text-slate-200 pt-0.5">
                  = <span className="font-mono">{d.spanIncome.toLocaleString()}</span> over {Math.round(d.spanDays)}d ({Math.round(d.spanRate)}/d)
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (trendData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
        No data available. Import wish history or add snapshots to see income trends.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setShowDebug(d => !d)}
          className="text-xs text-slate-400 hover:text-slate-200 underline"
          title="Dump per-period wish bucketing to the browser console"
        >
          {showDebug ? 'Hide' : 'Show'} bucketing debug (console)
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={excludePurchases}
            onChange={(e) => setExcludePurchases(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Exclude purchases (show earned income only)
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Average Daily Rate</p>
          <p className="text-xl font-bold text-primary-400">{averageRate}</p>
          <p className="text-xs text-slate-500">primos/day</p>
        </div>
        {trendDirection && (
          <>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400">Early Period Avg</p>
              <p className="text-xl font-bold text-slate-300">{trendDirection.earlyAvg}</p>
              <p className="text-xs text-slate-500">primos/day</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400">Recent Period Avg</p>
              <p className={`text-xl font-bold ${trendDirection.changePercent < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {trendDirection.lateAvg}
              </p>
              <p className={`text-xs ${trendDirection.changePercent < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {trendDirection.changePercent > 0 ? '+' : ''}{trendDirection.changePercent}% vs early
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Daily Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Average line */}
              <ReferenceLine
                y={averageRate}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ value: `Avg: ${averageRate}`, fill: '#f59e0b', fontSize: 11 }}
              />

              {/* Bars colored by data source */}
              <Bar
                dataKey="dailyRate"
                name="Daily Income Rate"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />

              {/* Trend line */}
              <Line
                type="monotone"
                dataKey="dailyRate"
                name="Trend"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <p>• Each bar represents average daily primogem income for that banner period (21 days)</p>
        <p>• Bars with snapshot data = calculated from actual resource changes (accurate)</p>
        <p>• Bars without snapshots = estimated from wish spending (assumes spending ≈ income)</p>
        <p>• Yellow dashed line = overall average daily rate</p>
        {trendDirection && trendDirection.changePercent < -10 && (
          <p className="text-amber-400">
            • Your income appears to be declining ({trendDirection.changePercent}%), which is normal as one-time rewards are exhausted
          </p>
        )}
      </div>
    </div>
  );
}

export default IncomeRateTrendChart;
