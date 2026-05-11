import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PRIMOS_PER_PULL } from '@/lib/constants';
import type { SimulationResult } from '@/workers/montecarlo.worker';

interface CampaignPullDecisionPrefill {
  campaignName: string | null;
  deadline: string | null;
  targetPulls: number;
  shortfall: number;
}

interface CampaignPullDecisionCardProps {
  prefill: CampaignPullDecisionPrefill;
  availablePulls: number;
  dailyPrimogems: number;
  results: SimulationResult | null;
}

function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  const msUntilDeadline = deadlineDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(msUntilDeadline / (1000 * 60 * 60 * 24)));
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No campaign deadline';
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  return Number.isNaN(deadlineDate.getTime())
    ? 'No campaign deadline'
    : deadlineDate.toLocaleDateString();
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function CampaignPullDecisionCard({
  prefill,
  availablePulls,
  dailyPrimogems,
  results,
}: CampaignPullDecisionCardProps) {
  const daysUntilDeadline = getDaysUntilDeadline(prefill.deadline);
  const projectedIncomePulls = daysUntilDeadline === null
    ? 0
    : Math.floor((dailyPrimogems * daysUntilDeadline) / PRIMOS_PER_PULL);
  const projectedPulls = availablePulls + projectedIncomePulls;
  const targetPulls = prefill.targetPulls || availablePulls + prefill.shortfall;
  const currentShortfall = Math.max(0, targetPulls - availablePulls);
  const projectedShortfall = Math.max(0, targetPulls - projectedPulls);
  const isOnTrack = targetPulls > 0 && projectedShortfall === 0;

  return (
    <Card className="border-slate-700 bg-slate-900/50">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Campaign Pull Decision</h3>
            <p className="mt-1 text-sm text-slate-400">
              {prefill.campaignName ?? 'Campaign'} budget, pity, and odds in one place.
            </p>
          </div>
          <Badge variant={isOnTrack ? 'success' : projectedShortfall > 0 ? 'warning' : 'outline'}>
            {isOnTrack ? 'On track' : projectedShortfall > 0 ? `${projectedShortfall} short` : 'Needs target'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <DecisionStat label="Current event pulls" value={availablePulls.toLocaleString()} />
          <DecisionStat
            label="Projected by deadline"
            value={projectedPulls.toLocaleString()}
            detail={
              daysUntilDeadline === null
                ? 'Set a campaign deadline'
                : `+${projectedIncomePulls.toLocaleString()} in ${daysUntilDeadline}d`
            }
          />
          <DecisionStat
            label="Campaign target"
            value={targetPulls > 0 ? targetPulls.toLocaleString() : '-'}
            detail={formatDeadline(prefill.deadline)}
          />
          <DecisionStat
            label="Shortfall now"
            value={currentShortfall.toLocaleString()}
            detail={currentShortfall === 0 ? 'Ready on current pulls' : 'Before future income'}
          />
          <DecisionStat
            label="Chance to hit target"
            value={results ? formatPercent(results.allMustHavesProbability) : 'Run calc'}
            detail={results ? 'Based on current pity settings' : 'Apply pity, then calculate'}
          />
        </div>
        <p className="text-xs text-slate-500">
          Projection uses your current event pulls plus the tracker income rate. Standard wishes are intentionally excluded from event banner decisions.
        </p>
      </CardContent>
    </Card>
  );
}

function DecisionStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
      {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
    </div>
  );
}
