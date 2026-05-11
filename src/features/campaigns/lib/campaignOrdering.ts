import type { Campaign, CampaignStatus } from '@/types';
import type { CampaignPlan } from '../domain/campaignPlan';

const STATUS_SORT_WEIGHT: Record<CampaignStatus, number> = {
  active: 0,
  paused: 1,
  completed: 2,
  archived: 3,
};

const PLAN_SORT_WEIGHT: Record<CampaignPlan['status'], number> = {
  blocked: 0,
  attention: 1,
  ready: 2,
};

export function formatCampaignDate(value: string | undefined): string {
  if (!value) return 'No deadline';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function getCampaignDeadlineTime(value: string | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

export function compareCampaignPriority(a: Campaign, b: Campaign): number {
  const priorityDelta = a.priority - b.priority;
  if (priorityDelta !== 0) return priorityDelta;

  const deadlineDelta = getCampaignDeadlineTime(a.deadline) - getCampaignDeadlineTime(b.deadline);
  if (deadlineDelta !== 0) return deadlineDelta;

  return b.updatedAt.localeCompare(a.updatedAt);
}

export function getHighestPriorityCampaign(campaigns: readonly Campaign[]): Campaign | undefined {
  return [...campaigns]
    .filter((candidate) => candidate.status === 'active')
    .sort(compareCampaignPriority)[0];
}

export function sortCampaignsForControlCenter(
  campaigns: readonly Campaign[],
  plans: Record<string, CampaignPlan>
): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const statusDelta = STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status];
    if (statusDelta !== 0) return statusDelta;

    const aPlan = plans[a.id];
    const bPlan = plans[b.id];
    const planDelta =
      (aPlan ? PLAN_SORT_WEIGHT[aPlan.status] : 3) -
      (bPlan ? PLAN_SORT_WEIGHT[bPlan.status] : 3);
    if (planDelta !== 0) return planDelta;

    return compareCampaignPriority(a, b);
  });
}
