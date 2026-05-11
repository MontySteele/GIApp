import type {
  CampaignActionCategory,
  CampaignNextAction,
  CampaignPlan,
  CampaignPlanStatus,
} from './campaignPlan';
import { getActionDestination } from '../lib/campaignActionLinks';
import {
  compareCampaignPriority,
  getCampaignDeadlineTime,
} from '../lib/campaignOrdering';
import type { Campaign } from '@/types';

export interface CampaignDashboardAction {
  kind: 'campaign';
  campaign: Campaign;
  plan: CampaignPlan;
  action: CampaignNextAction;
  destination: { label: string; href: string };
  why: string;
}

export interface FreshnessDashboardAction {
  kind: 'freshness';
  id: string;
  label: string;
  detail: string;
  priority: 1 | 2 | 3;
  destination: { label: string; href: string };
  why: string;
}

export interface CampaignDashboardFreshness {
  status: 'fresh' | 'stale' | 'missing';
  isLoading?: boolean;
  label: string;
  detail: string;
}

export type DashboardAction = CampaignDashboardAction | FreshnessDashboardAction;

const STATUS_WEIGHT: Record<CampaignPlanStatus, number> = {
  blocked: 0,
  attention: 1,
  ready: 2,
};
const FRESHNESS_ACTION_SORT_PRIORITY = -1;

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

export function buildCampaignDashboardActions(
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

      const deadlineDelta =
        getCampaignDeadlineTime(a.campaign.deadline) -
        getCampaignDeadlineTime(b.campaign.deadline);
      if (deadlineDelta !== 0) return deadlineDelta;

      const statusDelta = STATUS_WEIGHT[a.plan.status] - STATUS_WEIGHT[b.plan.status];
      if (statusDelta !== 0) return statusDelta;

      return a.plan.overallPercent - b.plan.overallPercent;
    });
}

export function buildFreshnessDashboardAction(
  activeCampaignCount: number,
  dataFreshness: CampaignDashboardFreshness
): FreshnessDashboardAction | null {
  if (activeCampaignCount === 0 || dataFreshness.isLoading || dataFreshness.status === 'fresh') {
    return null;
  }

  return {
    kind: 'freshness',
    id: 'account-data-refresh',
    label: dataFreshness.label,
    detail: dataFreshness.detail,
    priority: dataFreshness.status === 'missing' ? 1 : 2,
    destination: {
      label: dataFreshness.status === 'missing' ? 'Open Import Hub' : 'Refresh Import',
      href: '/imports',
    },
    why: 'Campaign plans depend on current roster, artifact, weapon, material, and wish data.',
  };
}

export function getRankedDashboardActions(
  campaignActions: CampaignDashboardAction[],
  freshnessAction: FreshnessDashboardAction | null
): DashboardAction[] {
  return freshnessAction
    ? [...campaignActions, freshnessAction].sort(
        (a, b) => getDashboardActionPriority(a) - getDashboardActionPriority(b)
      )
    : campaignActions;
}

export function getFocusedCampaign(
  activeCampaigns: Campaign[],
  plans: Record<string, CampaignPlan>,
  focusAction: DashboardAction | undefined
): Campaign | undefined {
  if (focusAction?.kind === 'campaign') return focusAction.campaign;

  return [...activeCampaigns].sort((a, b) => {
    const statusDelta =
      (plans[a.id] ? STATUS_WEIGHT[plans[a.id]!.status] : 3) -
      (plans[b.id] ? STATUS_WEIGHT[plans[b.id]!.status] : 3);
    if (statusDelta !== 0) return statusDelta;
    return compareCampaignPriority(a, b);
  })[0];
}

export function getActionKey(item: DashboardAction): string {
  if (item.kind === 'freshness') return item.id;
  return `${item.campaign.id}-${item.action.id}`;
}

export function getDashboardActionPriority(item: DashboardAction): number {
  return item.kind === 'freshness' ? FRESHNESS_ACTION_SORT_PRIORITY : item.action.priority;
}

export function getActionCategory(item: DashboardAction): CampaignActionCategory | 'freshness' {
  return item.kind === 'freshness' ? 'freshness' : item.action.category;
}

export function getActionLabel(item: DashboardAction): string {
  return item.kind === 'freshness' ? item.label : item.action.label;
}

export function getActionDetail(item: DashboardAction): string {
  return item.kind === 'freshness' ? item.detail : item.action.detail;
}

export function getActionCampaignName(item: DashboardAction): string {
  return item.kind === 'freshness' ? 'Account data' : item.campaign.name;
}

export function getActionActivityInput(item: DashboardAction) {
  return {
    actionKey: getActionKey(item),
    campaignId: item.kind === 'freshness' ? null : item.campaign.id,
    actionId: item.kind === 'freshness' ? item.id : item.action.id,
    actionLabel: getActionLabel(item),
  };
}
