import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import MaterialItem from '@/features/planner/components/MaterialItem';
import {
  calculateAscensionSummary,
  createGoalFromCharacter,
  createComfortableBuildGoal,
  createFunctionalBuildGoal,
  createNextAscensionGoal,
  type AscensionGoal,
  type AscensionSummary,
} from '@/features/planner/domain/ascensionCalculator';
import { useMaterials } from '@/features/planner/hooks/useMaterials';
import type { Character } from '@/types';

type GoalPreset = 'next' | 'functional' | 'comfortable' | 'full';

const GOAL_LABELS: Record<GoalPreset, { label: string; desc: string }> = {
  next: { label: 'Next Ascension', desc: 'Next level cap' },
  functional: { label: 'Functional', desc: 'Lv.80 / 1-6-6' },
  comfortable: { label: 'Comfortable', desc: 'Lv.80 / 8-8-8' },
  full: { label: 'Full Build', desc: 'Lv.90 / 10-10-10' },
};

interface CharacterProgressionProps {
  character: Character;
}

export default function CharacterProgression({ character }: CharacterProgressionProps) {
  const [goalPreset, setGoalPreset] = useState<GoalPreset>('comfortable');
  const [summary, setSummary] = useState<AscensionSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { materials } = useMaterials();

  const goal = useMemo<AscensionGoal>(() => {
    switch (goalPreset) {
      case 'full':
        return createGoalFromCharacter(character);
      case 'comfortable':
        return createComfortableBuildGoal(character);
      case 'functional':
        return createFunctionalBuildGoal(character);
      case 'next':
      default:
        return createNextAscensionGoal(character);
    }
  }, [character, goalPreset]);

  // Check if character is already at or past the goal
  const isAtGoal = goal.currentLevel >= goal.targetLevel
    && goal.currentAscension >= goal.targetAscension
    && goal.currentTalents.auto >= goal.targetTalents.auto
    && goal.currentTalents.skill >= goal.targetTalents.skill
    && goal.currentTalents.burst >= goal.targetTalents.burst;

  useEffect(() => {
    if (isAtGoal) {
      setSummary(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const calculate = async () => {
      setIsCalculating(true);
      setError(null);
      try {
        const result = await calculateAscensionSummary(goal, materials);
        if (!cancelled) {
          setSummary(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Calculation failed');
          setSummary(null);
        }
      } finally {
        if (!cancelled) setIsCalculating(false);
      }
    };

    void calculate();
    return () => { cancelled = true; };
  }, [goal, materials, isAtGoal]);

  // Group materials by category for cleaner display
  const groupedMaterials = useMemo(() => {
    if (!summary) return null;
    const groups: Record<string, typeof summary.materials> = {};
    for (const mat of summary.materials) {
      if (mat.required === 0) continue;
      const cat = mat.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mat);
    }
    return groups;
  }, [summary]);

  const categoryOrder = ['talent', 'boss', 'weekly', 'gem', 'localSpecialty', 'common', 'exp', 'mora', 'crown'];
  const categoryLabels: Record<string, string> = {
    mora: 'Mora',
    exp: 'EXP Materials',
    boss: 'Boss Materials',
    gem: 'Elemental Gems',
    localSpecialty: 'Local Specialties',
    common: 'Common Materials',
    talent: 'Talent Books',
    weekly: 'Weekly Boss Materials',
    crown: 'Crowns',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Progression
          </h2>
          <Link
            to={`/planner?character=${encodeURIComponent(character.key)}`}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            Open in Planner <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Goal Preset Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(GOAL_LABELS) as [GoalPreset, { label: string; desc: string }][]).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setGoalPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                goalPreset === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Target State Summary */}
        <div className="bg-slate-900 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">
              Lv.{goal.currentLevel} → Lv.{goal.targetLevel}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Talents {goal.currentTalents.auto}/{goal.currentTalents.skill}/{goal.currentTalents.burst}
              {' → '}
              {goal.targetTalents.auto}/{goal.targetTalents.skill}/{goal.targetTalents.burst}
            </span>
          </div>
        </div>

        {/* At Goal State */}
        {isAtGoal && (
          <div className="text-center py-6">
            <Badge variant="success">Complete</Badge>
            <p className="text-sm text-slate-400 mt-2">
              {character.key} already meets this goal!
            </p>
          </div>
        )}

        {/* Loading */}
        {isCalculating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400 mr-2" />
            <span className="text-sm text-slate-400">Calculating materials...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Materials */}
        {!isCalculating && !isAtGoal && summary && groupedMaterials && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-400">
                  {summary.estimatedResin.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Resin</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">
                  {summary.estimatedDays}
                </div>
                <div className="text-xs text-slate-400">Days</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {(summary.totalMora / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-slate-400">Mora</div>
              </div>
            </div>

            {/* Material Groups */}
            <div className="space-y-4">
              {categoryOrder.map((cat) => {
                const mats = groupedMaterials[cat];
                if (!mats || mats.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                      {categoryLabels[cat] ?? cat}
                    </h3>
                    <div className="space-y-2">
                      {mats.map((mat) => (
                        <MaterialItem key={`${mat.key}-${mat.tier ?? 0}`} mat={mat} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stale data warning */}
            {summary.isStale && (
              <p className="text-xs text-yellow-500 mt-3">
                Material data may be outdated. Check your connection for accurate results.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
