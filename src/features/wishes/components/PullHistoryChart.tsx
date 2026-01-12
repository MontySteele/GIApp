import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, addDays, addWeeks, addMonths, isBefore, isEqual } from 'date-fns';
import Select from '@/components/ui/Select';
import type { WishHistoryItem } from '../domain/wishAnalyzer';
import type { BannerType } from '@/types';

type GroupInterval = 'day' | 'week' | 'month';
type ChartMode = 'cumulative' | 'perPeriod';

interface PullHistoryChartProps {
  history: WishHistoryItem[];
  bannerType?: BannerType | 'all';
}

interface ChartDataPoint {
  label: string;
  date: Date;
  pulls: number;
  cumulativePulls: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
}

function getIntervalStart(date: Date, interval: GroupInterval): Date {
  switch (interval) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 });
    case 'month':
      return startOfMonth(date);
  }
}

function addInterval(date: Date, interval: GroupInterval): Date {
  switch (interval) {
    case 'day':
      return addDays(date, 1);
    case 'week':
      return addWeeks(date, 1);
    case 'month':
      return addMonths(date, 1);
  }
}

function formatLabel(date: Date, interval: GroupInterval): string {
  switch (interval) {
    case 'day':
      return format(date, 'yyyy-MM-dd');
    case 'week':
      return format(date, "'W'w yyyy");
    case 'month':
      return format(date, 'MMM yyyy');
  }
}

export function PullHistoryChart({ history, bannerType = 'all' }: PullHistoryChartProps) {
  const [interval, setInterval] = useState<GroupInterval>('week');
  const [chartMode, setChartMode] = useState<ChartMode>('cumulative');

  const chartData = useMemo(() => {
    // Filter by banner type if specified
    const filteredHistory =
      bannerType === 'all' ? history : history.filter((w) => w.banner === bannerType);

    if (filteredHistory.length === 0) return [];

    // Sort by time ascending
    const sorted = [...filteredHistory].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Find date range
    const firstItem = sorted[0];
    const lastItem = sorted[sorted.length - 1];
    if (!firstItem || !lastItem) return [];

    const firstDate = getIntervalStart(parseISO(firstItem.time), interval);
    const lastDate = getIntervalStart(parseISO(lastItem.time), interval);

    // Group wishes by interval
    const wishBuckets = new Map<string, { fiveStars: number; fourStars: number; threeStars: number }>();

    for (const wish of sorted) {
      const wishDate = parseISO(wish.time);
      const bucketStart = getIntervalStart(wishDate, interval);
      const bucketKey = bucketStart.toISOString();

      let bucket = wishBuckets.get(bucketKey);
      if (!bucket) {
        bucket = { fiveStars: 0, fourStars: 0, threeStars: 0 };
        wishBuckets.set(bucketKey, bucket);
      }

      if (wish.rarity === 5) bucket.fiveStars += 1;
      else if (wish.rarity === 4) bucket.fourStars += 1;
      else bucket.threeStars += 1;
    }

    // Generate all intervals between first and last date (including empty ones)
    const result: ChartDataPoint[] = [];
    let currentDate = firstDate;
    let cumulativeTotal = 0;

    while (isBefore(currentDate, lastDate) || isEqual(currentDate, lastDate)) {
      const bucketKey = currentDate.toISOString();
      const wishData = wishBuckets.get(bucketKey);

      const pulls = wishData ? wishData.fiveStars + wishData.fourStars + wishData.threeStars : 0;
      cumulativeTotal += pulls;

      result.push({
        label: formatLabel(currentDate, interval),
        date: new Date(currentDate),
        pulls,
        cumulativePulls: cumulativeTotal,
        fiveStars: wishData?.fiveStars ?? 0,
        fourStars: wishData?.fourStars ?? 0,
        threeStars: wishData?.threeStars ?? 0,
      });

      currentDate = addInterval(currentDate, interval);
    }

    return result;
  }, [history, bannerType, interval]);

  const lastDataPoint = chartData[chartData.length - 1];
  const totalPulls = lastDataPoint?.cumulativePulls ?? 0;
  const totalFiveStars = chartData.reduce((sum, p) => sum + p.fiveStars, 0);
  const totalFourStars = chartData.reduce((sum, p) => sum + p.fourStars, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
        No pull history available for the selected banner.
      </div>
    );
  }

  interface TooltipPayload {
    payload: ChartDataPoint;
    value: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-100 font-semibold mb-2">{data.label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-300">
              Pulls this period: <span className="text-primary-400 font-semibold">{data.pulls}</span>
            </p>
            <p className="text-slate-300">
              Cumulative: <span className="text-amber-400 font-semibold">{data.cumulativePulls}</span>
            </p>
            {data.fiveStars > 0 && (
              <p className="text-amber-300">5★: {data.fiveStars}</p>
            )}
            {data.fourStars > 0 && (
              <p className="text-purple-300">4★: {data.fourStars}</p>
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
          label="Group by"
          value={interval}
          onChange={(e) => setInterval(e.target.value as GroupInterval)}
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
          ]}
        />
        <Select
          label="Chart type"
          value={chartMode}
          onChange={(e) => setChartMode(e.target.value as ChartMode)}
          options={[
            { value: 'cumulative', label: 'Cumulative' },
            { value: 'perPeriod', label: 'Per Period' },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Total Pulls</p>
          <p className="text-2xl font-bold text-primary-400">{totalPulls}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">5★ Pulls</p>
          <p className="text-2xl font-bold text-amber-400">{totalFiveStars}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">4★ Pulls</p>
          <p className="text-2xl font-bold text-purple-400">{totalFourStars}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'cumulative' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPulls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulativePulls"
                  name="Cumulative Pulls"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#colorPulls)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="threeStars" name="3★" stackId="rarity" fill="#64748b" />
                <Bar dataKey="fourStars" name="4★" stackId="rarity" fill="#a855f7" />
                <Bar dataKey="fiveStars" name="5★" stackId="rarity" fill="#f59e0b" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default PullHistoryChart;
