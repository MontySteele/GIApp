import { useState, useEffect, useMemo } from 'react';
import { Zap, Clock, Plus, Minus, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  calculateCurrentResin,
  timeUntilFull,
  formatTime,
  DAILY_RESIN_REGEN,
  type ResinBudget,
  DEFAULT_RESIN_BUDGET,
} from '../domain/resinCalculator';
import { RESIN_REGEN } from '../domain/materialConstants';

interface ResinTrackerProps {
  onResinChange?: (budget: ResinBudget) => void;
}

export default function ResinTracker({ onResinChange }: ResinTrackerProps) {
  // Load from localStorage or use defaults
  const [budget, setBudget] = useState<ResinBudget>(() => {
    const saved = localStorage.getItem('resinBudget');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_RESIN_BUDGET;
      }
    }
    return DEFAULT_RESIN_BUDGET;
  });

  const [currentResin, setCurrentResin] = useState(() => calculateCurrentResin(budget));
  const [showEdit, setShowEdit] = useState(false);

  // Update current resin every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentResin(calculateCurrentResin(budget));
    }, 60000);

    return () => clearInterval(interval);
  }, [budget]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('resinBudget', JSON.stringify(budget));
    onResinChange?.(budget);
  }, [budget, onResinChange]);

  const minutesUntilFull = useMemo(
    () => timeUntilFull(currentResin, budget.maxResin),
    [currentResin, budget.maxResin]
  );

  const resinProgress = (currentResin / budget.maxResin) * 100;

  const handleSetResin = (value: number) => {
    const newBudget = {
      ...budget,
      currentResin: Math.max(0, Math.min(budget.maxResin, value)),
      lastUpdated: new Date().toISOString(),
    };
    setBudget(newBudget);
    setCurrentResin(newBudget.currentResin);
  };

  const handleSetFragile = (value: number) => {
    setBudget({
      ...budget,
      fragileResin: Math.max(0, value),
    });
  };

  const handleSetCondensed = (value: number) => {
    setBudget({
      ...budget,
      condensedResin: Math.max(0, Math.min(5, value)),
    });
  };

  const handleUseFragile = () => {
    if (budget.fragileResin > 0) {
      const newResin = Math.min(budget.maxResin, currentResin + RESIN_REGEN.fragileResin);
      setBudget({
        ...budget,
        fragileResin: budget.fragileResin - 1,
        currentResin: newResin,
        lastUpdated: new Date().toISOString(),
      });
      setCurrentResin(newResin);
    }
  };

  const handleRefresh = () => {
    setCurrentResin(calculateCurrentResin(budget));
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-slate-200">Resin Tracker</h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 text-slate-400 hover:text-slate-200"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Resin */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-400">{currentResin}</span>
            <span className="text-slate-500">/ {budget.maxResin}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${resinProgress}%` }}
            />
          </div>

          {/* Time until full */}
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            {currentResin >= budget.maxResin ? (
              <span className="text-green-400">Full!</span>
            ) : (
              <span>Full in {formatTime(minutesUntilFull)}</span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSetResin(currentResin - 20)}
            disabled={currentResin < 20}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-slate-200"
          >
            <Minus className="w-4 h-4" />
            20
          </button>
          <button
            onClick={() => handleSetResin(currentResin - 40)}
            disabled={currentResin < 40}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm text-slate-200"
          >
            <Minus className="w-4 h-4" />
            40
          </button>
          <button
            onClick={() => setShowEdit(!showEdit)}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-200"
          >
            Edit
          </button>
        </div>

        {/* Edit Mode */}
        {showEdit && (
          <div className="space-y-3 pt-3 border-t border-slate-700">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Current Resin</label>
              <input
                type="number"
                value={currentResin}
                onChange={(e) => handleSetResin(Number(e.target.value))}
                min={0}
                max={budget.maxResin}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Fragile Resin</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetFragile(budget.fragileResin - 1)}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <Minus className="w-4 h-4 text-slate-300" />
                  </button>
                  <span className="flex-1 text-center text-slate-200">{budget.fragileResin}</span>
                  <button
                    onClick={() => handleSetFragile(budget.fragileResin + 1)}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <Plus className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Condensed Resin</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetCondensed(budget.condensedResin - 1)}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <Minus className="w-4 h-4 text-slate-300" />
                  </button>
                  <span className="flex-1 text-center text-slate-200">{budget.condensedResin}</span>
                  <button
                    onClick={() => handleSetCondensed(budget.condensedResin + 1)}
                    className="p-1 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <Plus className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>

            {budget.fragileResin > 0 && (
              <button
                onClick={handleUseFragile}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white"
              >
                Use Fragile Resin (+{RESIN_REGEN.fragileResin})
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-500">Daily Regen</p>
            <p className="text-sm font-medium text-slate-300">{DAILY_RESIN_REGEN}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500">Resin/Hour</p>
            <p className="text-sm font-medium text-slate-300">
              {Math.round(60 / RESIN_REGEN.minutesPerResin)}
            </p>
          </div>
        </div>

        {/* Fragile Resin Value */}
        {budget.fragileResin > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Fragile Resin Value:</span>
            <Badge variant="primary">
              +{budget.fragileResin * RESIN_REGEN.fragileResin} resin
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
