import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Hammer,
  Package,
  Sparkles,
  Target,
  UserPlus,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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

interface DashboardAction {
  campaign: Campaign;
  plan: CampaignPlan;
  action: CampaignNextAction;
  destination: { label: string; href: string };
}

const CATEGORY_BADGE: Record<CampaignActionCategory, 'primary' | 'warning' | 'success' | 'danger' | 'outline'> = {
  pulls: 'primary',
  materials: 'warning',
  build: 'success',
  roster: 'danger',
  done: 'outline',
};

const STATUS_WEIGHT: Record<CampaignPlanStatus, number> = {
  blocked: 0,
  attention: 1,
  ready: 2,
};

function getCategoryIcon(category: CampaignActionCategory) {
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
  }
}

function buildDashboardActions(
  activeCampaigns: Campaign[],
  plans: Record<string, CampaignPlan>
): DashboardAction[] {
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
          campaign,
          plan,
          action,
          destination,
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

export default function CampaignNextActionsWidget({
  activeCampaigns,
  isLoading,
  plans,
  plansPending,
  error,
}: CampaignNextActionsWidgetProps) {
  const actions = buildDashboardActions(activeCampaigns, plans);
  const [focusAction, ...secondaryActions] = actions;

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
            <ActionCard item={focusAction} prominent />
            {secondaryActions.slice(0, 2).map((item) => (
              <ActionCard key={`${item.campaign.id}-${item.action.id}`} item={item} />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-500">
              <span>
                Based on {activeCampaigns.length} active campaign{activeCampaigns.length === 1 ? '' : 's'}.
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

function ActionCard({ item, prominent = false }: { item: DashboardAction; prominent?: boolean }) {
  const Icon = getCategoryIcon(item.action.category);

  if (prominent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={CATEGORY_BADGE[item.action.category]}>{item.action.category}</Badge>
            <span className="text-xs text-slate-500">{item.campaign.name}</span>
            <span className="text-xs text-slate-600">{item.plan.overallPercent}% ready</span>
          </div>
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-400" />
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-slate-100">{item.action.label}</h4>
              <p className="mt-1 text-sm text-slate-400">{item.action.detail}</p>
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
          <div className="truncate text-sm font-medium text-slate-200">{item.action.label}</div>
          <div className="truncate text-xs text-slate-500">{item.campaign.name}</div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Badge variant={CATEGORY_BADGE[item.action.category]}>{item.action.category}</Badge>
        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
      </div>
    </Link>
  );
}
