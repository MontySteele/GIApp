import { useMemo } from 'react';
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
import type { ResourceSnapshot, WishRecord } from '@/types';
import {
  calculateIncomeRateTrend,
  type IncomeRateDataPoint,
} from '../domain/historicalReconstruction';

interface IncomeRateTrendChartProps {
  snapshots: ResourceSnapshot[];
  wishes: WishRecord[];
}

export function IncomeRateTrendChart({ snapshots, wishes }: IncomeRateTrendChartProps) {
  const trendData = useMemo(
    () => calculateIncomeRateTrend(snapshots, wishes),
    [snapshots, wishes]
  );

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
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
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
              {data.days} days in period
            </p>
            {!data.hasSnapshotData && (
              <p className="text-amber-400 text-xs">
                * Estimated from wish spending
              </p>
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
