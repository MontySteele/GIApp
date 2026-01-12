/**
 * Today's Farming Recommendations Component
 *
 * Shows what talent materials can be farmed today based on
 * selected characters' needs and the domain schedule
 */

import { useMemo } from 'react';
import { Calendar, Clock, AlertCircle, Check, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { MaterialRequirement } from '../domain/ascensionCalculator';
import {
  analyzeFarmingSchedule,
  type FarmingScheduleSummary,
  type FarmingRecommendation,
  type DayName,
} from '../domain/farmingSchedule';

interface TodaysFarmingRecommendationsProps {
  talentMaterials: MaterialRequirement[];
  compact?: boolean;
}

export default function TodaysFarmingRecommendations({
  talentMaterials,
  compact = false,
}: TodaysFarmingRecommendationsProps) {
  const schedule = useMemo(() => {
    return analyzeFarmingSchedule(talentMaterials);
  }, [talentMaterials]);

  // No materials with deficit
  if (schedule.totalDeficit === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Farming Recommendations
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="text-sm">All talent materials collected!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return <CompactView schedule={schedule} />;
  }

  return <FullView schedule={schedule} />;
}

function CompactView({ schedule }: { schedule: FarmingScheduleSummary }) {
  const uniqueSeries = [...new Set(schedule.farmToday.map((r) => r.series))];
  const waitDays = (Object.entries(schedule.waitFor) as [DayName, FarmingRecommendation[]][])
    .filter(([, recs]) => recs.length > 0)
    .sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]);
    });

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Farming
        </h3>
        <div className="text-xs text-slate-400">{schedule.dayName}</div>
      </CardHeader>
      <CardContent>
        {schedule.farmToday.length > 0 ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-green-400 font-medium mb-2">Farm Today</div>
              <div className="flex flex-wrap gap-1">
                {uniqueSeries.map((series) => (
                  <Badge key={series} variant="success" className="text-xs">
                    {series}
                  </Badge>
                ))}
              </div>
            </div>

            {waitDays.length > 0 && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-2">Coming up</div>
                {waitDays.slice(0, 2).map(([day, recs]) => {
                  const series = [...new Set(recs.map((r) => r.series))];
                  return (
                    <div key={day} className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="text-slate-400">{day}:</span>
                      <span>{series.join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              <span>No needed materials available today</span>
            </div>
            {waitDays.length > 0 && (
              <div className="text-xs">
                Next: {waitDays[0]?.[0]} ({[...new Set(waitDays[0]?.[1]?.map((r) => r.series))].join(', ')})
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FullView({ schedule }: { schedule: FarmingScheduleSummary }) {
  const waitDays = (Object.entries(schedule.waitFor) as [DayName, FarmingRecommendation[]][])
    .filter(([, recs]) => recs.length > 0)
    .sort((a, b) => {
      // Sort by days until available
      if (a[1][0] && b[1][0]) {
        return a[1][0].daysUntilAvailable - b[1][0].daysUntilAvailable;
      }
      return 0;
    });

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Farming Recommendations
        </h3>
        <div className="text-xs text-slate-400">{schedule.dayName}</div>
      </CardHeader>
      <CardContent>
        {/* Farm Today Section */}
        {schedule.farmToday.length > 0 ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Available Today</span>
            </div>
            <div className="space-y-2">
              {schedule.farmToday.map((rec, idx) => (
                <RecommendationItem key={`${rec.series}-${rec.material.tier}-${idx}`} rec={rec} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">No needed talent materials available today</span>
            </div>
          </div>
        )}

        {/* Wait For Section */}
        {waitDays.length > 0 && (
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-400">Wait Until</span>
            </div>
            <div className="space-y-3">
              {waitDays.map(([day, recs]) => (
                <DayGroup key={day} day={day} recommendations={recs} />
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total talent books needed: {schedule.totalDeficit}</span>
            <span className="flex items-center gap-1">
              {schedule.farmToday.length > 0 ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Can make progress today</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Check back {waitDays[0]?.[0]}</span>
                </>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationItem({ rec }: { rec: FarmingRecommendation }) {
  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400',
  };

  const tierNames = ['Teachings', 'Guide', 'Philosophies'];
  const tierLabel = rec.material.tier ? tierNames[rec.material.tier - 1] : null;

  return (
    <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-8 rounded-full ${rec.availableToday ? 'bg-green-500' : 'bg-slate-600'}`} />
        <div>
          <div className="text-sm font-medium text-slate-200">
            {tierLabel && <span className="text-slate-400">{tierLabel} of </span>}
            {rec.series}
          </div>
          <div className="text-xs text-slate-500">{rec.region}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`text-sm font-medium ${priorityColors[rec.priority]}`}>
            {rec.material.deficit} needed
          </div>
          <div className="text-xs text-slate-500">
            {rec.material.owned}/{rec.material.required}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </div>
    </div>
  );
}

function DayGroup({ day, recommendations }: { day: DayName; recommendations: FarmingRecommendation[] }) {
  // Group by series
  const bySeries: Record<string, FarmingRecommendation[]> = {};
  for (const rec of recommendations) {
    const seriesArray = bySeries[rec.series];
    if (seriesArray) {
      seriesArray.push(rec);
    } else {
      bySeries[rec.series] = [rec];
    }
  }

  const daysUntil = recommendations[0]?.daysUntilAvailable ?? 0;

  return (
    <div className="p-3 bg-slate-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{day}</span>
        </div>
        <Badge variant="default" className="text-xs">
          {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(bySeries).map(([series, recs]) => {
          const totalDeficit = recs.reduce((sum, r) => sum + r.material.deficit, 0);
          const region = recs[0]?.region ?? 'Unknown';
          return (
            <div
              key={series}
              className="flex items-center gap-2 px-2 py-1 bg-slate-800 rounded text-xs"
            >
              <span className="text-slate-300">{series}</span>
              <span className="text-slate-500">({region})</span>
              <Badge variant="warning" className="text-xs py-0">
                {totalDeficit}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
