/**
 * Today's Farming Widget
 *
 * Shows which domains and materials are available to farm today
 * based on the game's domain schedule.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  DOMAIN_SCHEDULE,
  TALENT_BOOK_REGIONS,
} from '@/features/planner/domain/materialConstants';
import { getTodayName, type DayName } from '@/features/planner/domain/farmingSchedule';

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
  const today = useMemo(() => getTodayName(), []);
  const availableDomains = useMemo(() => getAvailableDomains(today), [today]);
  const groupedDomains = useMemo(() => groupByRegion(availableDomains), [availableDomains]);

  const isSunday = today === 'Sunday';

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
        <Link
          to="/teams/planner"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          Planner <ArrowRight className="w-3 h-3" />
        </Link>
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

        {!isSunday && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              Talent book domains rotate daily. Check the planner for your character needs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
