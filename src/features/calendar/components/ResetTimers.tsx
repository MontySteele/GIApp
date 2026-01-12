import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Swords, ShoppingBag, Calendar, Theater, Sparkles } from 'lucide-react';
import {
  getAllResetTimers,
  formatTimeUntil,
  formatResetDate,
  type ResetInfo,
} from '../domain/resetTimers';

const TIMER_ICONS = {
  'Daily Reset': Clock,
  'Weekly Reset': RefreshCw,
  'Spiral Abyss': Swords,
  'Imaginarium Theatre': Theater,
  'Next Patch': Sparkles,
  'Monthly Shop': ShoppingBag,
};

function TimerCard({ timer }: { timer: ResetInfo }) {
  const Icon = TIMER_ICONS[timer.name as keyof typeof TIMER_ICONS] || Calendar;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-500/20 rounded-lg">
          <Icon className="w-5 h-5 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-200">{timer.name}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{timer.description}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary-400">{timer.timeUntil}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{formatResetDate(timer.nextReset)}</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetTimers() {
  const [timers, setTimers] = useState<ResetInfo[]>(getAllResetTimers());

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(
        timers.map((timer) => ({
          ...timer,
          timeUntil: formatTimeUntil(timer.nextReset),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  // Refresh timer targets every minute (in case we cross a reset boundary)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(getAllResetTimers());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">Reset Timers</h2>
        <span className="text-xs text-slate-500">US Server (UTC-5)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {timers.map((timer) => (
          <TimerCard key={timer.name} timer={timer} />
        ))}
      </div>
    </div>
  );
}
