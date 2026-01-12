import { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Skull, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  WEEKLY_BOSSES,
  MAX_DISCOUNTED_CLAIMS,
  DISCOUNTED_RESIN_COST,
  REGULAR_RESIN_COST,
  getNextWeeklyReset,
  getCurrentWeekStart,
  formatTimeUntilReset,
} from '../domain/weeklyBossData';

interface WeeklyBossState {
  weekStart: string; // ISO date of week start
  completed: string[]; // Boss keys
}

const STORAGE_KEY = 'weeklyBossState';

function loadState(): WeeklyBossState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveState(state: WeeklyBossState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface WeeklyBossTrackerProps {
  compact?: boolean;
}

export default function WeeklyBossTracker({ compact = false }: WeeklyBossTrackerProps) {
  const [state, setState] = useState<WeeklyBossState>(() => {
    const stored = loadState();
    const currentWeekStart = getCurrentWeekStart().toISOString();

    // Reset if it's a new week
    if (!stored || stored.weekStart !== currentWeekStart) {
      return { weekStart: currentWeekStart, completed: [] };
    }
    return stored;
  });

  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Update time until reset every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeUntilReset(formatTimeUntilReset(getNextWeeklyReset()));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for weekly reset
  useEffect(() => {
    const currentWeekStart = getCurrentWeekStart().toISOString();
    if (state.weekStart !== currentWeekStart) {
      const newState = { weekStart: currentWeekStart, completed: [] };
      setState(newState);
      saveState(newState);
    }
  }, [state.weekStart]);

  // Save state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const toggleBoss = (bossKey: string) => {
    setState((prev) => ({
      ...prev,
      completed: prev.completed.includes(bossKey)
        ? prev.completed.filter((k) => k !== bossKey)
        : [...prev.completed, bossKey],
    }));
  };

  const resetAll = () => {
    setState((prev) => ({ ...prev, completed: [] }));
  };

  const stats = useMemo(() => {
    const completedCount = state.completed.length;
    const discountedUsed = Math.min(completedCount, MAX_DISCOUNTED_CLAIMS);
    const regularUsed = Math.max(0, completedCount - MAX_DISCOUNTED_CLAIMS);
    const discountedRemaining = MAX_DISCOUNTED_CLAIMS - discountedUsed;

    const resinSpent = discountedUsed * DISCOUNTED_RESIN_COST + regularUsed * REGULAR_RESIN_COST;

    return {
      completedCount,
      totalBosses: WEEKLY_BOSSES.length,
      discountedRemaining,
      resinSpent,
    };
  }, [state.completed]);

  if (compact) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-slate-200">Weekly Bosses</span>
            </div>
            <Badge className="bg-slate-700 text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeUntilReset}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {stats.completedCount}/{stats.totalBosses} completed
            </span>
            <span className="text-primary-400">
              {stats.discountedRemaining} discounts left
            </span>
          </div>

          <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${(stats.completedCount / stats.totalBosses) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skull className="w-6 h-6 text-slate-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Weekly Bosses</h3>
              <p className="text-sm text-slate-400">
                {stats.completedCount}/{stats.totalBosses} completed this week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-700 text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Reset: {timeUntilReset}
            </Badge>
            <button
              onClick={resetAll}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary-400">
              {stats.discountedRemaining}
            </div>
            <div className="text-xs text-slate-400">Discounts Left</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-100">{stats.resinSpent}</div>
            <div className="text-xs text-slate-400">Resin Spent</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-100">
              {WEEKLY_BOSSES.length - stats.completedCount}
            </div>
            <div className="text-xs text-slate-400">Remaining</div>
          </div>
        </div>

        {/* Boss List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {WEEKLY_BOSSES.map((boss, index) => {
            const isCompleted = state.completed.includes(boss.key);
            const isDiscounted = index < MAX_DISCOUNTED_CLAIMS && !isCompleted
              ? state.completed.length < MAX_DISCOUNTED_CLAIMS
              : index < MAX_DISCOUNTED_CLAIMS;

            return (
              <button
                key={boss.key}
                onClick={() => toggleBoss(boss.key)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  isCompleted
                    ? 'bg-green-900/30 border-green-700/50 text-green-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-medium line-clamp-1">{boss.name}</span>
                  {isCompleted && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                </div>
                <div className="text-xs text-slate-500">{boss.region}</div>
                {!isCompleted && isDiscounted && (
                  <div className="text-xs text-primary-400 mt-1">30 Resin</div>
                )}
                {!isCompleted && !isDiscounted && (
                  <div className="text-xs text-slate-500 mt-1">60 Resin</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>Click a boss to mark as completed</span>
          <span>
            Discounted: {DISCOUNTED_RESIN_COST} Resin | Regular: {REGULAR_RESIN_COST} Resin
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
