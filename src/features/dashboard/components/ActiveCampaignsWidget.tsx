import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Flag, RefreshCw, Sparkles, UsersRound } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useCampaignPlans, useCampaigns } from '@/features/campaigns';
import { useAccountDataFreshness } from '@/features/sync';
import { getDisplayName } from '@/lib/gameData';
import type { Campaign } from '@/types';

function formatDeadline(campaign: Campaign): string {
  if (!campaign.deadline) return 'No deadline';
  return new Date(`${campaign.deadline}T00:00:00`).toLocaleDateString();
}

function getCampaignSummary(campaign: Campaign): string {
  if (campaign.type === 'team-polish') {
    return campaign.teamTarget?.name ?? `${campaign.characterTargets.length} team targets`;
  }

  const target = campaign.characterTargets[0];
  if (!target) return 'No target selected';
  return getDisplayName(target.characterKey);
}

export default function ActiveCampaignsWidget() {
  const { activeCampaigns, isLoading } = useCampaigns();
  const { plans, isLoading: plansLoading } = useCampaignPlans(activeCampaigns);
  const dataFreshness = useAccountDataFreshness();

  if (isLoading || plansLoading) {
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
            {dataFreshness.status !== 'fresh' && (
              <Link
                to="/roster?import=irminsul"
                className="flex items-center justify-between gap-3 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm transition-colors hover:bg-amber-950/40"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-amber-200">{dataFreshness.label}</span>
                  <span className="block truncate text-xs text-amber-200/70">
                    {dataFreshness.status === 'missing'
                      ? 'Campaign gaps improve after an Irminsul refresh.'
                      : dataFreshness.detail}
                  </span>
                </span>
                <RefreshCw className="h-4 w-4 flex-shrink-0 text-amber-300" />
              </Link>
            )}
            {activeCampaigns.slice(0, 3).map((campaign) => {
              const Icon = campaign.type === 'team-polish' ? UsersRound : Sparkles;
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
                        {nextAction ? nextAction.label : getCampaignSummary(campaign)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {readiness !== undefined && <Badge variant="success">{readiness}%</Badge>}
                    <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDeadline(campaign)}
                    </span>
                    <Badge variant="outline">P{campaign.priority}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
