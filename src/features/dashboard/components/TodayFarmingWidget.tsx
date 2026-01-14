/**
 * Today's Farming Widget
 *
 * Shows which domains and materials are available to farm today
 * and which characters in the roster need them.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Sparkles, Users, Clock, Star, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  DOMAIN_SCHEDULE,
  TALENT_BOOK_REGIONS,
} from '@/features/planner/domain/materialConstants';
import { getTodayName, type DayName } from '@/features/planner/domain/farmingSchedule';
import { useTodayFarming, type FarmingScope } from '../hooks/useTodayFarming';

const SCOPE_OPTIONS: { value: FarmingScope; label: string; icon: React.ReactNode }[] = [
  { value: 'team', label: 'Teams', icon: <UserCheck className="w-3 h-3" /> },
  { value: 'priority', label: 'Priority', icon: <Star className="w-3 h-3" /> },
  { value: 'all', label: 'All', icon: <Users className="w-3 h-3" /> },
];

interface DomainInfo {
  series: string;
  region: string;
  days: string[];
}

/**
 * Get available talent book domains for a given day
 */
function getAvailableDomains(day: DayName): DomainInfo[] {
  const available: DomainInfo[] = [];

  for (const [series, days] of Object.entries(DOMAIN_SCHEDULE)) {
    if (days.includes(day)) {
      // Find which region this series belongs to
      let region = 'Unknown';
      for (const [regionName, seriesList] of Object.entries(TALENT_BOOK_REGIONS)) {
        if (seriesList.includes(series)) {
          region = regionName;
          break;
        }
      }
      available.push({ series, region, days });
    }
  }

  return available;
}

/**
 * Group domains by region for cleaner display
 */
function groupByRegion(domains: DomainInfo[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const domain of domains) {
    if (!grouped[domain.region]) {
      grouped[domain.region] = [];
    }
    grouped[domain.region]!.push(domain.series);
  }

  return grouped;
}

// Region colors for badges
const REGION_COLORS: Record<string, 'primary' | 'default' | 'success' | 'warning' | 'danger'> = {
  'Mondstadt': 'primary',
  'Liyue': 'warning',
  'Inazuma': 'default',
  'Sumeru': 'success',
  'Fontaine': 'primary',
  'Natlan': 'danger',
};

export default function TodayFarmingWidget() {
  const [scope, setScope] = useState<FarmingScope>('team');
  const today = useMemo(() => getTodayName(), []);
  const availableDomains = useMemo(() => getAvailableDomains(today), [today]);
  const groupedDomains = useMemo(() => groupByRegion(availableDomains), [availableDomains]);

  const {
    isLoading,
    availableTodayWithCharacters,
    notAvailableToday,
    totalCharactersProcessed,
  } = useTodayFarming({ scope });

  const isSunday = today === 'Sunday';

  // Check if user has characters and material data
  const hasCharacterData = totalCharactersProcessed > 0;
  const hasRecommendations = availableTodayWithCharacters.length > 0;

  const scopeLabel = scope === 'team' ? 'team members' : scope === 'priority' ? 'priority characters' : 'characters';

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold">Today's Farming</h3>
          <Badge variant="default" className="text-xs">
            {today}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Scope Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setScope(option.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  scope === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Show ${option.label.toLowerCase()}`}
              >
                {option.icon}
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
          <Link
            to="/teams/planner"
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isSunday ? (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">
              All domains are available today!
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Farm any talent books or weapon materials you need.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Character-specific recommendations */}
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
                <div className="h-8 bg-slate-800 rounded animate-pulse" />
              </div>
            ) : hasCharacterData && hasRecommendations ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>Your characters need</span>
                </div>
                <div className="space-y-2">
                  {availableTodayWithCharacters.slice(0, 3).map(({ series, region, characters }) => (
                    <div
                      key={series}
                      className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={REGION_COLORS[region] ?? 'default'}
                          className="text-xs"
                        >
                          {series}
                        </Badge>
                        <span className="text-xs text-slate-500">({region})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">
                          {characters.slice(0, 2).map((c) => c.characterKey).join(', ')}
                          {characters.length > 2 && ` +${characters.length - 2}`}
                        </span>
                        <Badge variant="success" className="text-xs py-0">
                          {characters.length}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coming up (not available today) */}
                {notAvailableToday.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Wait for</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {notAvailableToday.slice(0, 2).map(({ series, nextAvailableDay, characters }) => (
                        <span
                          key={series}
                          className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded"
                        >
                          {series} ({nextAvailableDay.slice(0, 3)}) - {characters.length} chars
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : hasCharacterData && !hasRecommendations ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>None of your {scopeLabel} need today's books</span>
                </div>
                {notAvailableToday.length > 0 && (
                  <div className="text-xs text-slate-500">
                    Next farming day: {notAvailableToday[0]?.nextAvailableDay} for {notAvailableToday[0]?.series}
                  </div>
                )}
              </div>
            ) : (
              /* Fallback to generic domain list when no character data */
              <div className="space-y-3">
                {Object.entries(groupedDomains).map(([region, series]) => (
                  <div key={region} className="flex items-start gap-3">
                    <Badge
                      variant={REGION_COLORS[region] ?? 'default'}
                      className="text-xs min-w-[80px] justify-center"
                    >
                      {region}
                    </Badge>
                    <div className="flex flex-wrap gap-1.5">
                      {series.map((s) => (
                        <span
                          key={s}
                          className="text-sm text-slate-300 bg-slate-800 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isSunday && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              {hasCharacterData
                ? `${totalCharactersProcessed} ${scopeLabel} analyzed • Talent book domains rotate daily`
                : `Add characters to see personalized recommendations`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
