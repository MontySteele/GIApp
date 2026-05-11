import {
  buildCharacterCampaignUrl,
  buildCharacterPolishCampaignUrl,
  buildPlannedBannerCampaignUrl,
} from '@/features/campaigns/lib/campaignLinks';
import type { CampaignNextAction, CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import { getDisplayName } from '@/lib/gameData';
import type { WishlistCharacter } from '@/stores/wishlistStore';
import type { Campaign, Character, PlannedBanner } from '@/types';

export type TargetSummarySource = 'campaign' | 'planned-banner' | 'wishlist' | 'owned-character';
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
  pullReadinessPercent?: number;
  buildReadinessPercent?: number;
  materialReadinessPercent?: number;
  nextAction?: CampaignNextAction;
  pullBudget?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface TargetSummaryInput {
  campaigns: Campaign[];
  plannedBanners?: PlannedBanner[];
  wishlist?: WishlistCharacter[];
  characters?: Character[];
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

function getOwnedCharacterPolishDetail(character: Character): string | null {
  const gaps: string[] = [];

  if (character.level < 80) {
    gaps.push(`Lv. ${character.level}`);
  }

  if (!character.weapon) {
    gaps.push('weapon missing');
  } else if (character.weapon.level < 80) {
    gaps.push(`weapon Lv. ${character.weapon.level}`);
  }

  const highestTalent = Math.max(
    character.talent?.auto ?? 1,
    character.talent?.skill ?? 1,
    character.talent?.burst ?? 1
  );
  if (highestTalent < 8) {
    gaps.push(`talent ${highestTalent}`);
  }

  const artifactCount = character.artifacts?.length ?? 0;
  if (artifactCount < 5) {
    gaps.push(`${artifactCount}/5 artifacts`);
  }

  if (gaps.length === 0) return null;
  return gaps.slice(0, 2).join(' + ');
}

function getOwnedCharacterPriority(character: Character): Campaign['priority'] {
  if (character.priority === 'main' || character.priority === 'unbuilt') return 2;
  if (character.priority === 'secondary') return 3;
  return 4;
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
    ...(plan ? {
      readinessPercent: plan.overallPercent,
      pullReadinessPercent: plan.pullReadiness.percent,
      buildReadinessPercent: plan.buildReadiness.percent,
      materialReadinessPercent: plan.materialReadiness.percent,
      ...(plan.nextActions[0] ? { nextAction: plan.nextActions[0] } : {}),
    } : {}),
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

export function ownedCharacterToTargetSummary(
  character: Character,
  campaigns: Campaign[] = []
): TargetSummary | null {
  if (includesOpenCampaignForCharacter(campaigns, character.key)) return null;

  const polishDetail = getOwnedCharacterPolishDetail(character);
  if (!polishDetail) return null;

  return {
    id: `owned-character:${character.key}`,
    source: 'owned-character',
    kind: 'build',
    status: 'planned',
    title: `Polish ${getDisplayName(character.key)}`,
    subtitle: `${polishDetail} needs attention`,
    priority: getOwnedCharacterPriority(character),
    href: `/roster/${character.id}`,
    actionHref: buildCharacterPolishCampaignUrl(character.key, 'comfortable'),
    actionLabel: 'Start Target',
    characterKeys: [character.key],
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

export function buildTargetSummaries({
  campaigns,
  plannedBanners = [],
  wishlist = [],
  characters = [],
  plans = {},
}: TargetSummaryInput): TargetSummary[] {
  return [
    ...campaigns.map((campaign) => campaignToTargetSummary(campaign, plans[campaign.id])),
    ...plannedBanners.map(plannedBannerToTargetSummary),
    ...wishlist.map((item) => wishlistToTargetSummary(item, campaigns)),
    ...characters
      .map((character) => ownedCharacterToTargetSummary(character, campaigns))
      .filter((target): target is TargetSummary => Boolean(target)),
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
