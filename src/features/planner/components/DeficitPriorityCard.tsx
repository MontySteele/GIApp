/**
 * Deficit Priority Card Component
 *
 * Shows prioritized material deficits based on which materials
 * are blocking the most progress
 */

import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, MapPin, Swords, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { GroupedMaterials } from '../domain/multiCharacterCalculator';
import {
  analyzeSimpleDeficitPriority,
  type MaterialPriority,
  type DeficitPrioritySummary,
} from '../domain/deficitPriority';

interface DeficitPriorityCardProps {
  groupedMaterials: GroupedMaterials;
  compact?: boolean;
}

const FARMING_TYPE_ICONS: Record<MaterialPriority['farmingType'], React.ReactNode> = {
  domain: <Clock className="w-3 h-3" />,
  boss: <Swords className="w-3 h-3" />,
  weekly: <Clock className="w-3 h-3" />,
  overworld: <MapPin className="w-3 h-3" />,
  leyline: <TrendingUp className="w-3 h-3" />,
  other: <AlertTriangle className="w-3 h-3" />,
};

const FARMING_TYPE_LABELS: Record<MaterialPriority['farmingType'], string> = {
  domain: 'Domain',
  boss: 'Boss',
  weekly: 'Weekly',
  overworld: 'Overworld',
  leyline: 'Ley Line',
  other: 'Special',
};

export default function DeficitPriorityCard({
  groupedMaterials,
  compact = false,
}: DeficitPriorityCardProps) {
  const summary = useMemo(() => {
    return analyzeSimpleDeficitPriority(groupedMaterials);
  }, [groupedMaterials]);

  if (summary.priorities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Farming Priority
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-sm">All materials collected!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return <CompactView summary={summary} />;
  }

  return <FullView summary={summary} />;
}

function CompactView({ summary }: { summary: DeficitPrioritySummary }) {
  const topPriorities = summary.highPriority.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Farming Priority
        </h3>
        <div className="text-xs text-slate-400">
          {summary.priorities.length} materials needed
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topPriorities.map((priority, idx) => (
            <CompactPriorityItem key={`${priority.material.key}-${idx}`} priority={priority} rank={idx + 1} />
          ))}
          {summary.priorities.length > 3 && (
            <div className="text-xs text-slate-500 pt-1">
              +{summary.priorities.length - 3} more materials...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompactPriorityItem({ priority, rank }: { priority: MaterialPriority; rank: number }) {
  const priorityColors = {
    1: 'text-red-400',
    2: 'text-orange-400',
    3: 'text-yellow-400',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold ${priorityColors[rank as 1 | 2 | 3] ?? 'text-slate-400'}`}>
        #{rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 truncate">{priority.material.name}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {FARMING_TYPE_ICONS[priority.farmingType]}
          <span>{FARMING_TYPE_LABELS[priority.farmingType]}</span>
          <span>•</span>
          <span className="text-red-400">{priority.totalDeficit} needed</span>
        </div>
      </div>
    </div>
  );
}

function FullView({ summary }: { summary: DeficitPrioritySummary }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Farming Priority
        </h3>
        <div className="text-xs text-slate-400">
          {summary.priorities.length} materials with deficits
        </div>
      </CardHeader>
      <CardContent>
        {/* High Priority Section */}
        {summary.highPriority.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">High Priority</span>
            </div>
            <div className="space-y-2">
              {summary.highPriority.map((priority, idx) => (
                <PriorityItem key={`high-${priority.material.key}-${idx}`} priority={priority} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority Section */}
        {summary.mediumPriority.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Medium Priority</span>
            </div>
            <div className="space-y-2">
              {summary.mediumPriority.slice(0, 5).map((priority, idx) => (
                <PriorityItem key={`med-${priority.material.key}-${idx}`} priority={priority} />
              ))}
              {summary.mediumPriority.length > 5 && (
                <div className="text-xs text-slate-500 pl-2">
                  +{summary.mediumPriority.length - 5} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Low Priority Section */}
        {summary.lowPriority.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-400">Low Priority</span>
              <Badge variant="default" className="text-xs">
                {summary.lowPriority.length}
              </Badge>
            </div>
            <div className="text-xs text-slate-500">
              {summary.lowPriority
                .slice(0, 3)
                .map((p) => p.material.name)
                .join(', ')}
              {summary.lowPriority.length > 3 && ` +${summary.lowPriority.length - 3} more`}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total deficit materials</span>
            <span className="text-slate-300 font-medium">{summary.priorities.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityItem({ priority }: { priority: MaterialPriority }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-800">
          {FARMING_TYPE_ICONS[priority.farmingType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">
            {priority.material.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{FARMING_TYPE_LABELS[priority.farmingType]}</span>
            {priority.blockedCharacters.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {priority.blockedCharacters.length} chars
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-red-400">{priority.totalDeficit}</div>
        <div className="text-xs text-slate-500">needed</div>
      </div>
    </div>
  );
}
