import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface ProbabilityChartProps {
  data: Array<{ pulls: number; cumulativeProbability: number }>;
}

export default function ProbabilityChart({ data }: ProbabilityChartProps) {
  // Format data for Recharts
  const chartData = data.map((point) => ({
    pulls: point.pulls,
    probability: point.cumulativeProbability * 100,
  }));

  // Custom tooltip
  interface TooltipPayload {
    payload: { pulls: number; probability: number };
    value: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm">
            <strong className="text-slate-100">{payload[0].payload.pulls} pulls:</strong>
          </p>
          <p className="text-primary-400 font-semibold">
            {payload[0].value.toFixed(2)}% chance
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-slate-900 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="pulls"
            stroke="#94a3b8"
            label={{ value: 'Number of Pulls', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            stroke="#94a3b8"
            label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="probability"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#colorProb)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
