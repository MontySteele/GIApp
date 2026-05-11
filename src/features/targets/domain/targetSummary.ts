import { buildCharacterCampaignUrl, buildPlannedBannerCampaignUrl } from '@/features/campaigns/lib/campaignLinks';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import { getDisplayName } from '@/lib/gameData';
import type { WishlistCharacter } from '@/stores/wishlistStore';
import type { Campaign, PlannedBanner } from '@/types';

export type TargetSummarySource = 'campaign' | 'planned-banner' | 'wishlist';
export type TargetSummaryKind = 'pull' | 'build' | 'team';
export type TargetSummaryStatus = 'active' | 'paused' | 'planned' | 'wishlist' | 'completed' | 'archived';

export interface TargetSummary {
  id: string;
  source: TargetSummarySource;
  kind: TargetSummaryKind;
  status: TargetSummaryStatus;
  title: string;
  subtitle: string;
  priority: Campaign['priority'];
  href: string;
  actionHref: string;
  actionLabel: string;
  characterKeys: string[];
  deadline?: string;
  readinessPercent?: number;
  pullBudget?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TargetSummaryInput {
  campaigns: Campaign[];
  plannedBanners?: PlannedBanner[];
  wishlist?: WishlistCharacter[];
  plans?: Record<string, CampaignPlan>;
}

const STATUS_WEIGHT: Record<TargetSummaryStatus, number> = {
  active: 0,
  paused: 1,
  planned: 2,
  wishlist: 3,
  completed: 4,
  archived: 5,
};

function getCampaignKind(campaign: Campaign): TargetSummaryKind {
  if (campaign.type === 'team-polish') return 'team';
  if (campaign.type === 'character-acquisition') return 'pull';
  return 'build';
}

function formatBannerWindow(banner: PlannedBanner): string {
  const start = banner.expectedStartDate ? banner.expectedStartDate.slice(0, 10) : '';
  const end = banner.expectedEndDate ? banner.expectedEndDate.slice(0, 10) : '';
  const window = start && end ? `${start} to ${end}` : start || end;
  const confidence = banner.isConfirmed ? 'confirmed' : 'speculative';
  return window ? `${confidence} banner, ${window}` : `${confidence} banner`;
}

function includesOpenCampaignForCharacter(campaigns: Campaign[], characterKey: string): boolean {
  const normalized = characterKey.toLowerCase();
  return campaigns.some((campaign) => {
    if (campaign.status !== 'active' && campaign.status !== 'paused') return false;
    return campaign.characterTargets.some(
      (target) => target.characterKey.toLowerCase() === normalized
    );
  });
}

export function campaignToTargetSummary(
  campaign: Campaign,
  plan?: CampaignPlan
): TargetSummary {
  const characterKeys = campaign.characterTargets.map((target) => target.characterKey);
  const targetLabel =
    campaign.type === 'team-polish'
      ? campaign.teamTarget?.name ?? 'Team target'
      : characterKeys.map(getDisplayName).join(', ');

  return {
    id: `campaign:${campaign.id}`,
    source: 'campaign',
    kind: getCampaignKind(campaign),
    status: campaign.status,
    title: campaign.name,
    subtitle: targetLabel || 'Target',
    priority: campaign.priority,
    href: `/campaigns/${campaign.id}`,
    actionHref: `/campaigns/${campaign.id}`,
    actionLabel: 'Open Target',
    characterKeys,
    ...(campaign.deadline ? { deadline: campaign.deadline } : {}),
    ...(plan ? { readinessPercent: plan.overallPercent } : {}),
    pullBudget: campaign.pullTargets[0]?.maxPullBudget ?? null,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

export function plannedBannerToTargetSummary(banner: PlannedBanner): TargetSummary {
  return {
    id: `planned-banner:${banner.id}`,
    source: 'planned-banner',
    kind: 'pull',
    status: 'planned',
    title: `Pull for ${getDisplayName(banner.characterKey)}`,
    subtitle: formatBannerWindow(banner),
    priority: banner.priority,
    href: '/pulls/banners',
    actionHref: buildPlannedBannerCampaignUrl(banner),
    actionLabel: 'Start Target',
    characterKeys: [banner.characterKey],
    deadline: banner.expectedStartDate,
    pullBudget: banner.maxPullBudget,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

export function wishlistToTargetSummary(
  wishlist: WishlistCharacter,
  campaigns: Campaign[] = []
): TargetSummary {
  const hasOpenCampaign = includesOpenCampaignForCharacter(campaigns, wishlist.key);
  return {
    id: `wishlist:${wishlist.key}`,
    source: 'wishlist',
    kind: 'build',
    status: 'wishlist',
    title: `Build ${getDisplayName(wishlist.key)}`,
    subtitle: hasOpenCampaign
      ? 'Already attached to an active target'
      : `${wishlist.targetGoal} build goal`,
    priority: hasOpenCampaign ? 5 : 3,
    href: '/planner',
    actionHref: buildCharacterCampaignUrl(wishlist.key, wishlist.targetGoal, true),
    actionLabel: hasOpenCampaign ? 'Open Targets' : 'Start Target',
    characterKeys: [wishlist.key],
    createdAt: wishlist.addedAt,
  };
}

export function buildTargetSummaries({
  campaigns,
  plannedBanners = [],
  wishlist = [],
  plans = {},
}: TargetSummaryInput): TargetSummary[] {
  return [
    ...campaigns.map((campaign) => campaignToTargetSummary(campaign, plans[campaign.id])),
    ...plannedBanners.map(plannedBannerToTargetSummary),
    ...wishlist.map((item) => wishlistToTargetSummary(item, campaigns)),
  ].sort(compareTargetSummaries);
}

export function compareTargetSummaries(a: TargetSummary, b: TargetSummary): number {
  const statusDelta = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
  if (statusDelta !== 0) return statusDelta;

  const priorityDelta = a.priority - b.priority;
  if (priorityDelta !== 0) return priorityDelta;

  const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
  const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
  if (aDeadline !== bDeadline) return aDeadline - bDeadline;

  return a.title.localeCompare(b.title);
}
