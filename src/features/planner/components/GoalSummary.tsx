import { Clock, Check } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { Character } from '@/types';
import type { AscensionGoal, AscensionSummary } from '../domain/ascensionCalculator';
import type { AggregatedMaterialSummary } from '../domain/multiCharacterCalculator';

interface SingleGoalSummaryProps {
  character: Character;
  goal: AscensionGoal;
  summary: AscensionSummary | null;
}

export function SingleGoalSummary({ character, goal, summary }: SingleGoalSummaryProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{character.key} - Goal</h2>
          {summary?.canAscend && (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Ready!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Level</div>
            <div className="text-lg font-bold text-slate-100">
              {goal.currentLevel} → {goal.targetLevel}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Ascension</div>
            <div className="text-lg font-bold text-slate-100">
              A{goal.currentAscension} → A{goal.targetAscension}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Talents</div>
            <div className="text-sm font-bold text-slate-100">
              {goal.currentTalents.auto}/{goal.currentTalents.skill}/{goal.currentTalents.burst}
              {' → '}
              {goal.targetTalents.auto}/{goal.targetTalents.skill}/{goal.targetTalents.burst}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Time
            </div>
            <div className="text-lg font-bold text-slate-100">
              {summary?.estimatedDays || 0} days
            </div>
            <div className="text-xs text-slate-500">
              ~{summary?.estimatedResin || 0} resin
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiGoalSummaryProps {
  selectedCount: number;
  selectedCharacters: Character[];
  summary: AggregatedMaterialSummary;
  onDeselectCharacter: (key: string) => void;
}

export function MultiGoalSummary({
  selectedCount,
  selectedCharacters,
  summary,
  onDeselectCharacter,
}: MultiGoalSummaryProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedCount} Characters - Combined Goal
          </h2>
          {summary.allCanAscend && (
            <Badge variant="success" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              All Ready!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Selected Character Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCharacters.map((char) => (
            <Badge key={char.id} variant="default" className="flex items-center gap-1">
              {char.key}
              <button
                className="ml-1 text-slate-400 hover:text-slate-200"
                onClick={() => onDeselectCharacter(char.key)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Total Mora</div>
            <div className="text-lg font-bold text-slate-100">
              {(summary.totalMora || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Hero's Wit</div>
            <div className="text-lg font-bold text-slate-100">
              {Math.ceil((summary.totalExp || 0) / 20000).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Total Resin</div>
            <div className="text-lg font-bold text-primary-400">
              {(summary.totalEstimatedResin || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Days
            </div>
            <div className="text-lg font-bold text-primary-400">
              {summary.totalEstimatedDays || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
