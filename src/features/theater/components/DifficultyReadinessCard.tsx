/**
 * Difficulty readiness card
 *
 * One card per Imaginarium Theatre difficulty: how many eligible characters
 * you have versus the requirement, where they came from, and — when short —
 * who is closest and what leveling them would cost.
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getDisplayName } from '@/lib/gameData';
import type { Character } from '@/types';
import {
  countByReason,
  DIFFICULTY_LABELS,
  getDifficultyRule,
  type DifficultyReadiness,
} from '../domain/readiness';
import LevelingPlanPanel from './LevelingPlanPanel';

interface DifficultyReadinessCardProps {
  readiness: DifficultyReadiness;
  characters: Character[];
}

const MAX_NEAR_MISS_SHOWN = 5;

export default function DifficultyReadinessCard({
  readiness,
  characters,
}: DifficultyReadinessCardProps) {
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const label = DIFFICULTY_LABELS[readiness.difficulty];
  const rule = getDifficultyRule(readiness.difficulty);
  const minLevel = rule?.minLevel ?? 70;
  const counts = countByReason(readiness);
  const shownNearMiss = readiness.nearMiss.slice(0, MAX_NEAR_MISS_SHOWN);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-100">{label}</h3>
          <Badge variant="outline" className="text-xs">
            Lv. {minLevel}+
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">
            {readiness.eligibleCount} / {readiness.required}
          </span>
          {readiness.ready ? (
            <span className="flex items-center gap-1 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {readiness.shortfall} short
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {readiness.blockedByUnlock && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Locked until you clear {DIFFICULTY_LABELS[rule?.requiresClear ?? 'hard']} this season.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Element</dt>
            <dd className="text-slate-200">{counts.element}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Openers owned</dt>
            <dd className="text-slate-200">{counts.openingOwned}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Opener trials</dt>
            <dd className="text-slate-200">{counts.openingTrial}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Special guests</dt>
            <dd className="text-slate-200">{counts.specialGuest}</dd>
          </div>
        </dl>

        {!readiness.ready && shownNearMiss.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-400">Closest to qualifying</p>
            <ul className="mt-1.5 space-y-1">
              {shownNearMiss.map((entry) => (
                <li key={entry.key} className="text-xs text-slate-300">
                  {getDisplayName(entry.key)} — Lv. {entry.level}, needs{' '}
                  {entry.levelsNeeded} more level{entry.levelsNeeded === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!readiness.ready && (
          <>
            <button
              type="button"
              onClick={() => setIsPlanOpen((open) => !open)}
              aria-expanded={isPlanOpen}
              className="flex items-center gap-1 text-xs font-medium text-primary-400 hover:text-primary-300"
            >
              {isPlanOpen ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isPlanOpen ? 'Hide' : 'Plan'} leveling for {label}
            </button>
            {isPlanOpen && (
              <LevelingPlanPanel
                readiness={readiness}
                minLevel={minLevel}
                characters={characters}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
