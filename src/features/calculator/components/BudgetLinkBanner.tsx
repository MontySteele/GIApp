/**
 * Budget Link Banner
 *
 * Displays current primogem budget and projected income with
 * a button to use the budget in the calculator.
 */

import { Wallet, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useBudgetLink } from '../hooks/useBudgetLink';
import { PRIMOS_PER_PULL } from '@/lib/constants';

interface BudgetLinkBannerProps {
  onUseBudget: (pulls: number) => void;
  projectionDays?: number;
}

export default function BudgetLinkBanner({
  onUseBudget,
  projectionDays = 42,
}: BudgetLinkBannerProps) {
  const budget = useBudgetLink(30);

  if (budget.isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budget.hasData) {
    return (
      <Card className="mb-6 border-slate-700">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 text-slate-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">
                No budget data available. Add a resource snapshot in the{' '}
                <span className="text-primary-400">Wishes → Budget</span> tab to link your
                primogem income.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate projection based on days (default to 42 days for typical banner)
  const daysProjection = projectionDays;
  const projectedIncome = Math.floor(budget.dailyRate * daysProjection);
  const projectedPulls = Math.floor(projectedIncome / PRIMOS_PER_PULL);
  const totalProjectedPulls = budget.currentPulls + projectedPulls;

  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <Card className="mb-6 border-primary-700/30 bg-primary-900/10">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Current Resources */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-100">
                  {formatNumber(budget.currentPrimogems)}
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">+</span>
                <span className="text-lg font-semibold text-slate-100">
                  {budget.currentFates}
                </span>
                <span className="text-sm text-slate-400">fates</span>
              </div>
              <p className="text-sm text-slate-400">
                <span className="text-primary-400 font-medium">{budget.currentPulls}</span> pulls
                available now
              </p>
            </div>
          </div>

          {/* Projection */}
          {budget.dailyRate > 0 && (
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-100">
                    +{formatNumber(projectedIncome)}
                  </span>
                  <Badge variant="default" className="text-xs">
                    {daysProjection}d
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  ~{Math.round(budget.dailyRate)} primos/day →{' '}
                  <span className="text-green-400 font-medium">+{projectedPulls}</span> pulls
                </p>
              </div>
            </div>
          )}

          {/* Use Budget Button */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUseBudget(budget.currentPulls)}
              className="whitespace-nowrap"
            >
              Use Current ({budget.currentPulls})
            </Button>
            {budget.dailyRate > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onUseBudget(totalProjectedPulls)}
                className="whitespace-nowrap"
              >
                Use Projected ({totalProjectedPulls})
              </Button>
            )}
          </div>
        </div>

        {/* Info footer */}
        {budget.lastUpdated && (
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700/50">
            Based on snapshot from{' '}
            {new Date(budget.lastUpdated).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
            {budget.dailyRate > 0 && ' • Income rate calculated from last 30 days of wishes'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
