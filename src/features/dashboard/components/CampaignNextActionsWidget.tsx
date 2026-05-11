import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  UserPlus,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAccountDataFreshness } from '@/features/sync';
import { getActionDestination } from '@/features/campaigns/lib/campaignActionLinks';
import type {
  CampaignActionCategory,
  CampaignNextAction,
  CampaignPlan,
  CampaignPlanStatus,
} from '@/features/campaigns/domain/campaignPlan';
import type { Campaign } from '@/types';

interface CampaignNextActionsWidgetProps {
  activeCampaigns: Campaign[];
  isLoading: boolean;
  plans: Record<string, CampaignPlan>;
  plansPending: boolean;
  error?: string | null;
}

interface CampaignDashboardAction {
  kind: 'campaign';
  campaign: Campaign;
  plan: CampaignPlan;
  action: CampaignNextAction;
  destination: { label: string; href: string };
  why: string;
}

interface FreshnessDashboardAction {
  kind: 'freshness';
  id: string;
  label: string;
  detail: string;
  priority: 1 | 2 | 3;
  destination: { label: string; href: string };
  why: string;
}

type DashboardAction = CampaignDashboardAction | FreshnessDashboardAction;

const CATEGORY_BADGE: Record<CampaignActionCategory, 'primary' | 'warning' | 'success' | 'danger' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'success',
  roster: 'danger',
  done: 'outline',
};

const FRESHNESS_BADGE = 'warning' as const;

const STATUS_WEIGHT: Record<CampaignPlanStatus, number> = {
  blocked: 0,
  attention: 1,
  ready: 2,
};

function getCategoryIcon(category: CampaignActionCategory | 'freshness') {
  switch (category) {
    case 'pulls':
      return Sparkles;
    case 'materials':
      return Package;
    case 'build':
      return Hammer;
    case 'roster':
      return UserPlus;
    case 'done':
      return CheckCircle2;
    case 'freshness':
      return RefreshCw;
  }
}

function getDeadlineTime(campaign: Campaign): number {
  if (!campaign.deadline) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(`${campaign.deadline}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getCampaignRank(campaign: Campaign, plan: CampaignPlan | undefined): number {
  const statusWeight = plan ? STATUS_WEIGHT[plan.status] * 100 : 300;
  return campaign.priority * 1000 + statusWeight + Math.min(getDeadlineTime(campaign) / 1000000000, 999);
}

function getActionWhy(action: CampaignNextAction, campaign: Campaign, plan: CampaignPlan): string {
  switch (action.category) {
    case 'pulls':
      return `This is the top pull blocker for ${campaign.name}: ${plan.pullReadiness.remainingPulls} pulls short.`;
    case 'materials':
      return `This material gap is keeping ${campaign.name} at ${plan.materialReadiness.percent}% materials.`;
    case 'build':
      return `This build step is one of the fastest ways to raise ${campaign.name}'s readiness.`;
    case 'roster':
      return `This target needs roster or wish data before the campaign plan can get more specific.`;
    case 'done':
      return `${campaign.name} has no current blockers, so the useful action is reviewing or completing it.`;
  }
}

function buildDashboardActions(
  activeCampaigns: Campaign[],
  plans: Record<string, CampaignPlan>
): CampaignDashboardAction[] {
  return activeCampaigns
    .flatMap((campaign) => {
      const plan = plans[campaign.id];
      if (!plan) return [];

      return plan.nextActions.slice(0, 2).map((action) => {
        const destination = getActionDestination(action, campaign, plan) ?? {
          label: 'Review',
          href: `/campaigns/${campaign.id}`,
        };

        return {
          kind: 'campaign' as const,
          campaign,
          plan,
          action,
          destination,
          why: getActionWhy(action, campaign, plan),
        };
      });
    })
    .sort((a, b) => {
      const actionDelta = a.action.priority - b.action.priority;
      if (actionDelta !== 0) return actionDelta;

      const campaignDelta = a.campaign.priority - b.campaign.priority;
      if (campaignDelta !== 0) return campaignDelta;

      const statusDelta = STATUS_WEIGHT[a.plan.status] - STATUS_WEIGHT[b.plan.status];
      if (statusDelta !== 0) return statusDelta;

      return a.plan.overallPercent - b.plan.overallPercent;
    });
}

function getFocusedCampaign(
  activeCampaigns: Campaign[],
  plans: Record<string, CampaignPlan>,
  focusAction: DashboardAction | undefined
): Campaign | undefined {
  if (focusAction?.kind === 'campaign') return focusAction.campaign;

  return [...activeCampaigns].sort((a, b) => {
    const rankDelta = getCampaignRank(a, plans[a.id]) - getCampaignRank(b, plans[b.id]);
    if (rankDelta !== 0) return rankDelta;
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0];
}

export default function CampaignNextActionsWidget({
  activeCampaigns,
  isLoading,
  plans,
  plansPending,
  error,
}: CampaignNextActionsWidgetProps) {
  const dataFreshness = useAccountDataFreshness();
  const campaignActions = buildDashboardActions(activeCampaigns, plans);
  const freshnessAction: FreshnessDashboardAction | null =
    activeCampaigns.length > 0 && !dataFreshness.isLoading && dataFreshness.status !== 'fresh'
      ? {
          kind: 'freshness',
          id: 'account-data-refresh',
          label: dataFreshness.label,
          detail: dataFreshness.detail,
          priority: dataFreshness.status === 'missing' ? 1 : 2,
          destination: {
            label: dataFreshness.status === 'missing' ? 'Import Data' : 'Refresh Import',
            href: '/roster?import=irminsul',
          },
          why: 'Campaign plans depend on current roster, artifact, weapon, material, and wish data.',
        }
      : null;
  const actions = freshnessAction
    ? [...campaignActions, freshnessAction].sort((a, b) => a.priority - b.priority)
    : campaignActions;
  const [focusAction, ...secondaryActions] = actions;
  const focusedCampaign = getFocusedCampaign(activeCampaigns, plans, focusAction);
  const focusedPlan = focusedCampaign ? plans[focusedCampaign.id] : undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="mb-3 h-5 w-36 animate-pulse rounded bg-slate-700" />
          <div className="h-20 animate-pulse rounded bg-slate-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary-900/50 bg-primary-950/10">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary-400" />
          <h3 className="font-semibold">Today's Plan</h3>
        </div>
        <Link
          to="/campaigns"
          className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
        >
          Campaigns <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {activeCampaigns.length === 0 ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">No campaign focus yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Create a pull, build, or team campaign so the dashboard can choose your next action.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Target className="h-4 w-4" />
              Create Campaign
            </Link>
          </div>
        ) : error && !plansPending && actions.length === 0 ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3">
            <p className="text-sm font-medium text-red-100">Unable to calculate today's plan.</p>
            <p className="mt-1 text-xs text-red-200/80">{error}</p>
          </div>
        ) : plansPending && actions.length === 0 ? (
          <div className="space-y-3">
            <div className="h-5 w-44 animate-pulse rounded bg-slate-700" />
            <div
              aria-label="Campaign action loading"
              className="h-20 animate-pulse rounded-lg bg-slate-900"
            />
          </div>
        ) : focusAction ? (
          <div className="space-y-3">
            {focusedCampaign && (
              <Link
                to={`/campaigns/${focusedCampaign.id}`}
                className="flex flex-col gap-3 rounded-lg border border-primary-900/50 bg-slate-950/50 p-3 transition-colors hover:border-primary-700/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="primary">Current focus</Badge>
                    {focusedPlan && (
                      <Badge variant={focusedPlan.status === 'ready' ? 'success' : focusedPlan.status === 'attention' ? 'warning' : 'danger'}>
                        {focusedPlan.overallPercent}% ready
                      </Badge>
                    )}
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-100">
                    {focusedCampaign.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    P{focusedCampaign.priority}
                    {focusedCampaign.deadline ? `, deadline ${new Date(`${focusedCampaign.deadline}T00:00:00`).toLocaleDateString()}` : ', no deadline'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-300">
                  Open campaign
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}
            <ActionCard item={focusAction} prominent />
            {secondaryActions.slice(0, 2).map((item) => (
              <ActionCard key={getActionKey(item)} item={item} />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
              <span>
                Ranked by blocker severity, campaign priority, deadline, and data freshness.
              </span>
              {actions.length > 3 && (
                <Link to="/campaigns" className="text-primary-400 hover:text-primary-300">
                  {actions.length - 3} more actions
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-sm font-medium text-slate-200">Campaigns are ready for review.</p>
            <p className="mt-1 text-xs text-slate-500">
              Open your active campaigns and mark completed goals when you are happy with them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getActionKey(item: DashboardAction): string {
  if (item.kind === 'freshness') return item.id;
  return `${item.campaign.id}-${item.action.id}`;
}

function getActionCategory(item: DashboardAction): CampaignActionCategory | 'freshness' {
  return item.kind === 'freshness' ? 'freshness' : item.action.category;
}

function getActionBadge(item: DashboardAction): 'primary' | 'warning' | 'success' | 'danger' | 'outline' {
  if (item.kind === 'freshness') return FRESHNESS_BADGE;
  return CATEGORY_BADGE[item.action.category];
}

function getActionLabel(item: DashboardAction): string {
  return item.kind === 'freshness' ? item.label : item.action.label;
}

function getActionDetail(item: DashboardAction): string {
  return item.kind === 'freshness' ? item.detail : item.action.detail;
}

function getActionCampaignName(item: DashboardAction): string {
  return item.kind === 'freshness' ? 'Account data' : item.campaign.name;
}

function ActionCard({ item, prominent = false }: { item: DashboardAction; prominent?: boolean }) {
  const category = getActionCategory(item);
  const Icon = getCategoryIcon(category);
  const label = getActionLabel(item);
  const detail = getActionDetail(item);
  const badge = getActionBadge(item);
  const campaignName = getActionCampaignName(item);

  if (prominent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={badge}>{category === 'freshness' ? 'refresh' : category}</Badge>
            <span className="text-xs text-slate-500">{campaignName}</span>
            {item.kind === 'campaign' && (
              <span className="text-xs text-slate-600">{item.plan.overallPercent}% ready</span>
            )}
          </div>
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-slate-100">{label}</h4>
              <p className="mt-1 text-sm text-slate-400">{detail}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Why this?</span> {item.why}
              </p>
            </div>
          </div>
        </div>
        <Link
          to={item.destination.href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {item.destination.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={item.destination.href}
      className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/70 px-3 py-2 transition-colors hover:bg-slate-800"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-200">{label}</div>
          <div className="truncate text-xs text-slate-500">{campaignName} - {item.why}</div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge variant={badge}>{category === 'freshness' ? 'refresh' : category}</Badge>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
      </div>
    </Link>
  );
}
