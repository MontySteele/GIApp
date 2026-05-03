import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  Package,
  Sparkles,
  Target,
  UsersRound,
  Wallet,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getDisplayName } from '@/lib/gameData';
import type { CampaignNextAction, CampaignPlan } from '../domain/campaignPlan';
import { useCampaigns } from '../hooks/useCampaigns';
import { useCampaignPlans } from '../hooks/useCampaignPlans';
import type { Campaign, CampaignStatus } from '@/types';

const ACTION_BADGE: Record<CampaignNextAction['category'], 'primary' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'secondary',
  roster: 'outline',
  done: 'success',
};

const PLAN_STATUS_BADGE: Record<CampaignPlan['status'], 'success' | 'warning' | 'danger'> = {
  ready: 'success',
  attention: 'warning',
  blocked: 'danger',
};

function formatDate(value: string | undefined): string {
  if (!value) return 'No deadline';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function getStatusAction(campaign: Campaign): { label: string; status: CampaignStatus; icon: typeof CirclePause } {
  if (campaign.status === 'active') {
    return { label: 'Pause', status: 'paused', icon: CirclePause };
  }
  return { label: 'Activate', status: 'active', icon: CirclePlay };
}

function getActionDestination(
  action: CampaignNextAction,
  campaign: Campaign,
  plan: CampaignPlan
): { label: string; href: string } | null {
  switch (action.category) {
    case 'pulls':
      return { label: 'Open Pulls', href: '/pulls' };
    case 'materials':
      return { label: 'Open Materials', href: '/planner/materials' };
    case 'build': {
      const target = plan.buildReadiness.characters.find(
        (character) => character.characterKey === action.characterKey
      );
      return {
        label: target?.characterId ? 'Open Character' : 'Open Roster',
        href: target?.characterId ? `/roster/${target.characterId}` : '/roster',
      };
    }
    case 'roster':
      return campaign.pullTargets.length > 0
        ? { label: 'Open Pulls', href: '/pulls' }
        : { label: 'Open Roster', href: '/roster' };
    case 'done':
      return null;
  }
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, updateCampaign, isLoading } = useCampaigns();
  const campaign = useMemo(
    () => campaigns.find((candidate) => candidate.id === id),
    [campaigns, id]
  );
  const campaignList = useMemo(() => (campaign ? [campaign] : []), [campaign]);
  const { plans, isLoading: plansLoading, isCalculating } = useCampaignPlans(campaignList);
  const plan = campaign ? plans[campaign.id] : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Target className="w-14 h-14 text-slate-600 mb-4" />
        <p className="text-slate-400 mb-4">Campaign not found</p>
        <Button onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const CampaignIcon = campaign.type === 'team-polish' ? UsersRound : Sparkles;
  const statusAction = getStatusAction(campaign);
  const StatusActionIcon = statusAction.icon;
  const materialRows = plan?.materialReadiness.summary?.aggregatedMaterials ?? [];
  const sortedMaterials = [...materialRows].sort(
    (a, b) => b.deficit - a.deficit || b.required - a.required || a.name.localeCompare(b.name)
  );
  const deficitMaterials = sortedMaterials.filter((material) => material.deficit > 0);
  const focusAction = plan?.nextActions[0];

  const updateStatus = async (status: CampaignStatus) => {
    await updateCampaign(campaign.id, { status });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Campaigns', path: '/campaigns' },
          { label: campaign.name, path: `/campaigns/${campaign.id}` },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-3 rounded-lg bg-primary-500/20">
            <CampaignIcon className="w-6 h-6 text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold truncate">{campaign.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'outline'}>
                {campaign.status}
              </Badge>
              {plan && <Badge variant={PLAN_STATUS_BADGE[plan.status]}>{plan.overallPercent}% ready</Badge>}
              <Badge variant="outline">P{campaign.priority}</Badge>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(campaign.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => updateStatus(statusAction.status)}>
            <StatusActionIcon className="w-4 h-4" />
            {statusAction.label}
          </Button>
          <Button variant="secondary" onClick={() => updateStatus('completed')}>
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </Button>
          <Link
            to="/campaigns"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            All Campaigns
          </Link>
        </div>
      </div>

      {(plansLoading || isCalculating || !plan) && (
        <Card>
          <CardContent className="py-6">
            <div className="h-5 w-44 bg-slate-700 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="h-20 bg-slate-900 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-900 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-900 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-900 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {plan && focusAction && (
        <Card className="border-primary-900/60 bg-primary-950/20">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={ACTION_BADGE[focusAction.category]}>Focus</Badge>
                <span className="text-xs font-medium uppercase text-slate-500">
                  P{focusAction.priority} next action
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100">{focusAction.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{focusAction.detail}</p>
            </div>
            {focusAction.category === 'done' ? (
              <Button variant="primary" onClick={() => updateStatus('completed')}>
                <CheckCircle2 className="w-4 h-4" />
                Mark Complete
              </Button>
            ) : (
              <ActionCta action={focusAction} campaign={campaign} plan={plan} prominent />
            )}
          </CardContent>
        </Card>
      )}

      {plan && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ReadinessCard label="Overall" value={`${plan.overallPercent}%`} detail={plan.status} />
            <ReadinessCard
              label="Pulls"
              value={`${plan.pullReadiness.percent}%`}
              detail={
                plan.pullReadiness.hasTargets
                  ? `${formatCount(plan.pullReadiness.remainingPulls)} pulls short`
                  : 'No pull target'
              }
            />
            <ReadinessCard
              label="Build"
              value={`${plan.buildReadiness.percent}%`}
              detail={`${plan.buildReadiness.ownedCount}/${plan.buildReadiness.targetCount} owned`}
            />
            <ReadinessCard
              label="Materials"
              value={`${plan.materialReadiness.percent}%`}
              detail={`${plan.materialReadiness.deficitMaterials} deficits`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-semibold">Next Actions</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.nextActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-col gap-3 rounded-lg bg-slate-900/70 p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-200">{action.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{action.detail}</div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Badge variant={ACTION_BADGE[action.category]}>{action.category}</Badge>
                        {action.category === 'done' ? (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus('completed')}>
                            Complete
                          </Button>
                        ) : (
                          <ActionCta action={action} campaign={campaign} plan={plan} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-semibold">Pull Plan</h2>
                </div>
              </CardHeader>
              <CardContent>
                {plan.pullReadiness.hasTargets ? (
                  <div className="space-y-3">
                    <PullRow label="Available" value={formatCount(plan.pullReadiness.availablePulls)} />
                    <PullRow label="Target" value={formatCount(plan.pullReadiness.targetPulls)} />
                    <PullRow label="Remaining" value={formatCount(plan.pullReadiness.remainingPulls)} />
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${plan.pullReadiness.percent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">This campaign is not tied to a pull target.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-semibold">Build Targets</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.buildReadiness.characters.map((target) => (
                  <div key={target.characterKey} className="rounded-lg bg-slate-900/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{getDisplayName(target.characterKey)}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={target.owned ? 'secondary' : 'primary'}>
                            {target.owned ? 'owned' : 'wishlist'}
                          </Badge>
                          <Badge variant="outline">{target.buildGoal}</Badge>
                        </div>
                      </div>
                      <Badge variant={target.percent >= 100 ? 'success' : target.percent >= 50 ? 'warning' : 'danger'}>
                        {target.percent}%
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={target.percent >= 100 ? 'h-full bg-green-500' : 'h-full bg-yellow-500'}
                        style={{ width: `${target.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {target.missing.length > 0 ? target.missing.join(', ') : 'Build target reached.'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-semibold">Material Deficits</h2>
                </div>
                <div className="text-xs text-slate-500">
                  {formatCount(plan.materialReadiness.totalEstimatedResin)} resin / {plan.materialReadiness.totalEstimatedDays} days
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {plan.materialReadiness.errors.length > 0 && (
                <div className="mb-3 rounded-lg border border-yellow-700 bg-yellow-950/30 p-3 text-sm text-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Some material data used fallbacks.
                  </div>
                </div>
              )}

              {deficitMaterials.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No material deficits for this campaign target.
                </p>
              ) : (
                <div className="space-y-2">
                  {deficitMaterials.slice(0, 12).map((material) => (
                    <div
                      key={`${material.key}-${material.tier ?? 'base'}`}
                      className="rounded-lg border border-red-900/30 bg-red-950/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-100 truncate">{material.name}</div>
                          <div className="text-xs text-slate-500 capitalize">
                            {material.category}
                            {material.source ? ` - ${material.source}` : ''}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-red-300">{formatCount(material.deficit)} short</div>
                          <div className="text-xs text-slate-500">
                            {formatCount(material.owned)} / {formatCount(material.required)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500/70 rounded-full"
                          style={{
                            width: `${material.required > 0 ? Math.min(100, (material.owned / material.required) * 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {deficitMaterials.length > 12 && (
                    <p className="text-xs text-slate-500">
                      {deficitMaterials.length - 12} more deficit materials are included in the readiness calculation.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ReadinessCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-semibold text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 mt-1 capitalize">{detail}</div>
      </CardContent>
    </Card>
  );
}

function PullRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}

function ActionCta({
  action,
  campaign,
  plan,
  prominent = false,
}: {
  action: CampaignNextAction;
  campaign: Campaign;
  plan: CampaignPlan;
  prominent?: boolean;
}) {
  const destination = getActionDestination(action, campaign, plan);
  if (!destination) return null;

  return (
    <Link
      to={destination.href}
      className={
        prominent
          ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700'
          : 'inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700'
      }
    >
      {destination.label}
      <ArrowRight className={prominent ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
    </Link>
  );
}
