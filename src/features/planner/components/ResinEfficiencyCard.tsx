/**
 * Resin Efficiency Card Component
 *
 * Shows resin efficiency analysis and recommendations
 * for optimal daily resin usage
 */

import { useMemo } from 'react';
import { Zap, Clock, TrendingUp, ChevronRight, Droplets } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { GroupedMaterials } from '../domain/multiCharacterCalculator';
import {
  analyzeResinEfficiency,
  type ResinEfficiencySummary,
  type FarmingActivity,
} from '../domain/resinEfficiency';
import { RESIN_REGEN } from '../domain/materialConstants';

interface ResinEfficiencyCardProps {
  groupedMaterials: GroupedMaterials;
  compact?: boolean;
}

const ACTIVITY_COLORS: Record<FarmingActivity['type'], string> = {
  talent: 'text-blue-400',
  weapon: 'text-purple-400',
  artifact: 'text-amber-400',
  boss: 'text-red-400',
  weekly: 'text-orange-400',
  exp: 'text-green-400',
  mora: 'text-yellow-400',
};

export default function ResinEfficiencyCard({
  groupedMaterials,
  compact = false,
}: ResinEfficiencyCardProps) {
  const summary = useMemo(() => {
    return analyzeResinEfficiency(groupedMaterials);
  }, [groupedMaterials]);

  if (summary.activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Resin Efficiency
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-400">
            <span className="text-sm">No resin-based farming needed!</span>
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

function CompactView({ summary }: { summary: ResinEfficiencySummary }) {
  const topRec = summary.recommendations[0];

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Resin Planner
        </h3>
        <div className="text-xs text-slate-400">
          {summary.totalDaysNeeded} days total
        </div>
      </CardHeader>
      <CardContent>
        {topRec && (
          <div className="mb-3">
            <div className="text-xs text-slate-400 mb-1">Today's Priority</div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-200">
                {topRec.activity.name}
              </span>
              <Badge variant="primary" className="text-xs">
                {topRec.resinToSpend} resin
              </Badge>
            </div>
            <div className="text-xs text-slate-500 mt-1">{topRec.reason}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/50 rounded p-2">
            <div className="text-slate-400">Daily Resin</div>
            <div className="text-slate-200 font-medium">{RESIN_REGEN.perDay}</div>
          </div>
          <div className="bg-slate-900/50 rounded p-2">
            <div className="text-slate-400">Total Needed</div>
            <div className="text-slate-200 font-medium">{summary.totalResinNeeded.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FullView({ summary }: { summary: ResinEfficiencySummary }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Resin Efficiency Calculator
        </h3>
        <div className="text-xs text-slate-400">
          Optimize your daily resin usage
        </div>
      </CardHeader>
      <CardContent>
        {/* Today's Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Today's Plan</span>
            </div>
            <div className="space-y-2">
              {summary.recommendations.map((rec, idx) => (
                <RecommendationItem key={`rec-${idx}`} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Activity Breakdown */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-400">All Activities</span>
          </div>
          <div className="space-y-2">
            {summary.activities.map((activity, idx) => (
              <ActivityItem key={`activity-${idx}`} activity={activity} />
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-3 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">
                {RESIN_REGEN.perDay}
              </div>
              <div className="text-xs text-slate-500">Daily Resin</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary-400">
                {summary.totalResinNeeded.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Total Needed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">
                {summary.totalDaysNeeded}
              </div>
              <div className="text-xs text-slate-500">Days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationItem({ recommendation }: { recommendation: { activity: FarmingActivity; suggestedRuns: number; resinToSpend: number; reason: string } }) {
  const color = ACTIVITY_COLORS[recommendation.activity.type];

  return (
    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-2">
        <ChevronRight className={`w-4 h-4 ${color}`} />
        <div>
          <div className="text-sm font-medium text-slate-200">
            {recommendation.activity.name}
          </div>
          <div className="text-xs text-slate-500">{recommendation.reason}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-slate-200">
          {recommendation.suggestedRuns}x
        </div>
        <div className="text-xs text-slate-500">{recommendation.resinToSpend} resin</div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: FarmingActivity }) {
  const color = ACTIVITY_COLORS[activity.type];

  return (
    <div className="p-2 bg-slate-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${color}`}>{activity.name}</span>
          <Badge variant="default" className="text-xs">
            {activity.resinCost} resin
          </Badge>
        </div>
        <div className="text-sm text-slate-300">
          {activity.runsNeeded} runs
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{activity.dropsPerRun}</span>
        <span>{activity.daysNeeded} days</span>
      </div>
      {activity.relevantDeficit > 0 && (
        <div className="mt-1 text-xs text-red-400">
          Deficit: {activity.relevantDeficit}
        </div>
      )}
    </div>
  );
}
