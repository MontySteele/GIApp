/**
 * Leveling plan panel
 *
 * Lets the player pick which underleveled characters to raise to a
 * difficulty's floor, and shows the resin/mora/EXP/days that would cost.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getDisplayName } from '@/lib/gameData';
import { DAILY_RESIN_REGEN } from '@/features/planner/domain/resinCalculator';
import type { Character } from '@/types';
import {
  computeLevelingPlan,
  defaultSelection,
  selectLevelingCandidates,
  type LevelingPlan,
} from '../domain/levelingPlan';
import type { DifficultyReadiness } from '../domain/readiness';

interface LevelingPlanPanelProps {
  readiness: DifficultyReadiness;
  minLevel: number;
  characters: Character[];
}

const numberFormatter = new Intl.NumberFormat('en-US');

export default function LevelingPlanPanel({
  readiness,
  minLevel,
  characters,
}: LevelingPlanPanelProps) {
  const candidates = useMemo(() => selectLevelingCandidates(readiness), [readiness]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    defaultSelection(candidates, readiness.shortfall)
  );
  const [plan, setPlan] = useState<LevelingPlan | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setSelectedKeys(defaultSelection(candidates, readiness.shortfall));
  }, [candidates, readiness.shortfall]);

  useEffect(() => {
    let cancelled = false;
    setIsCalculating(true);

    computeLevelingPlan({
      characters,
      selectedKeys,
      minLevel,
      shortfall: readiness.shortfall,
    })
      .then((result) => {
        if (!cancelled) setPlan(result);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      })
      .finally(() => {
        if (!cancelled) setIsCalculating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characters, selectedKeys, minLevel, readiness.shortfall]);

  const toggleKey = (key: string) => {
    setSelectedKeys((previous) =>
      previous.includes(key)
        ? previous.filter((entry) => entry !== key)
        : [...previous, key]
    );
  };

  const cannotCover = candidates.length < readiness.shortfall;

  return (
    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
      <h4 className="text-sm font-semibold text-slate-200">
        Plan leveling to Lv. {minLevel}
      </h4>

      {cannotCover && (
        <p className="mt-2 flex items-start gap-2 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Leveling alone cannot reach the minimum — only {candidates.length} of your
            characters qualify on element or guest status. You need{' '}
            {readiness.shortfall - candidates.length} more character
            {readiness.shortfall - candidates.length === 1 ? '' : 's'}.
          </span>
        </p>
      )}

      {candidates.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">
          No owned characters are close enough to level into this difficulty.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {candidates.map((candidate) => {
            const checkboxId = `theater-level-${readiness.difficulty}-${candidate.key}`;
            return (
              <li key={candidate.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={checkboxId}
                  checked={selectedKeys.includes(candidate.key)}
                  onChange={() => toggleKey(candidate.key)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800"
                />
                <label htmlFor={checkboxId} className="text-xs text-slate-300">
                  {getDisplayName(candidate.key)} — Lv. {candidate.level} (+
                  {candidate.levelsNeeded} to Lv. {minLevel})
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 border-t border-slate-700/60 pt-3">
        {isCalculating ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Calculating leveling cost…
          </p>
        ) : plan ? (
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Resin</dt>
              <dd className="text-slate-200">{numberFormatter.format(plan.totalResin)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Mora</dt>
              <dd className="text-slate-200">{numberFormatter.format(plan.totalMora)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">EXP</dt>
              <dd className="text-slate-200">{numberFormatter.format(plan.totalExp)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Days at {DAILY_RESIN_REGEN} resin/day</dt>
              <dd className="text-slate-200">{plan.daysNeeded}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-slate-400">Leveling cost is unavailable right now.</p>
        )}
      </div>
    </div>
  );
}
