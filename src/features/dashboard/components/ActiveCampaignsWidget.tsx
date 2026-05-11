import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Flag, Sparkles, Target, UsersRound } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useCampaignPlanContext } from '@/features/campaigns/hooks/useCampaignPlanContext';
import { useCampaignPlans } from '@/features/campaigns/hooks/useCampaignPlans';
import { useCampaigns } from '@/features/campaigns/hooks/useCampaigns';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import AccountDataFreshnessCallout from '@/features/sync/components/AccountDataFreshnessCallout';
import { useAccountDataFreshness } from '@/features/sync';
import { getDisplayName } from '@/lib/gameData';
import { formatCampaignDate } from '@/features/campaigns/lib/campaignOrdering';
import type { Campaign } from '@/types';

function formatDeadline(campaign: Campaign): string {
  return formatCampaignDate(campaign.deadline);
}

function getCampaignSummary(campaign: Campaign): string {
  if (campaign.type === 'team-polish') {
    return campaign.teamTarget?.name ?? `${campaign.characterTargets.length} team targets`;
  }

  const target = campaign.characterTargets[0];
  if (!target) return 'No target selected';
  return getDisplayName(target.characterKey);
}

interface ActiveCampaignsWidgetViewProps {
  activeCampaigns: Campaign[];
  isLoading: boolean;
  plans: Record<string, CampaignPlan>;
  plansPending: boolean;
  showFreshnessCallout?: boolean;
}

export function ActiveCampaignsWidgetView({
  activeCampaigns,
  isLoading,
  plans,
  plansPending,
  showFreshnessCallout = true,
}: ActiveCampaignsWidgetViewProps) {
  const dataFreshness = useAccountDataFreshness();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-5 w-40 bg-slate-700 rounded animate-pulse mb-3" />
          <div className="h-12 bg-slate-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold">Active Campaigns</h3>
        </div>
        <Link
          to="/campaigns"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          Campaigns <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {activeCampaigns.length === 0 ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">No active campaign selected.</p>
              <p className="text-xs text-slate-500 mt-1">
                Start with a pull target or a team you want to polish.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Create
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {showFreshnessCallout && (
              <AccountDataFreshnessCallout
                freshness={dataFreshness}
                context="campaign"
                variant="compact"
              />
            )}
            {activeCampaigns.slice(0, 3).map((campaign) => {
              const Icon = campaign.type === 'team-polish'
                ? UsersRound
                : campaign.type === 'character-polish'
                  ? Target
                  : Sparkles;
              const nextAction = plans[campaign.id]?.nextActions[0];
              const readiness = plans[campaign.id]?.overallPercent;
              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 transition-colors hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-100 truncate">
                        {campaign.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {nextAction
                          ? nextAction.label
                          : plansPending
                            ? 'Calculating next action...'
                            : getCampaignSummary(campaign)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {readiness !== undefined ? (
                      <Badge variant={readiness >= 100 ? 'success' : readiness >= 50 ? 'warning' : 'danger'}>
                        {readiness}%
                      </Badge>
                    ) : plansPending ? (
                      <span
                        aria-label="Campaign readiness loading"
                        className="h-5 w-12 rounded-full bg-slate-800 animate-pulse"
                      />
                    ) : null}
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDeadline(campaign)}
                    </span>
                    <Badge variant="outline">P{campaign.priority}</Badge>
                  </div>
                </Link>
              );
            })}
            {activeCampaigns.length > 3 && (
              <Link
                to="/campaigns"
                className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
              >
                <span>+{activeCampaigns.length - 3} more active campaigns</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ActiveCampaignsWidget() {
  const { activeCampaigns, isLoading } = useCampaigns();
  const { context: campaignPlanContext, isLoading: campaignPlanContextLoading } = useCampaignPlanContext();
  const { plans, isLoading: plansLoading, isCalculating } = useCampaignPlans(
    activeCampaigns,
    campaignPlanContext,
    campaignPlanContextLoading
  );

  return (
    <ActiveCampaignsWidgetView
      activeCampaigns={activeCampaigns}
      isLoading={isLoading}
      plans={plans}
      plansPending={plansLoading || isCalculating}
    />
  );
}
