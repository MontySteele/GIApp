import type { Campaign } from '@/types';
import type { CampaignCharacterTarget } from '@/types';
import type { CampaignNextAction, CampaignPlan } from '../domain/campaignPlan';
import { getCampaignPullTargets } from '../domain/campaignPlan';

export function getActionDestination(
  action: CampaignNextAction,
  campaign: Campaign,
  plan: CampaignPlan
): { label: string; href: string } | null {
  switch (action.category) {
    case 'pulls':
      return { label: 'Open Calculator', href: buildPullActionHref(campaign, plan) };
    case 'materials':
      return {
        label: shouldOpenCharacterPlanner(action, campaign) ? 'Open Planner' : 'Open Materials',
        href: buildMaterialActionHref(action, campaign),
      };
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

export function buildCampaignMaterialHref(campaignId: string, materialKey?: string): string {
  const params = new URLSearchParams({ campaign: campaignId });
  if (materialKey) {
    params.set('material', materialKey);
  }
  return `/planner/materials?${params.toString()}`;
}

function buildPullActionHref(campaign: Campaign, plan: CampaignPlan): string {
  const pullTargets = getCampaignPullTargets(campaign);
  if (pullTargets.length === 0) return '/pulls';

  const params = new URLSearchParams({
    mode: 'multi',
    campaign: campaign.id,
    name: campaign.name,
    pulls: String(plan.pullReadiness.availablePulls),
  });

  for (const target of pullTargets) {
    params.append(
      'target',
      JSON.stringify({
        name: target.itemKey,
        banner: target.bannerType,
        copies: target.desiredCopies,
      })
    );
  }

  return `/pulls/calculator?${params.toString()}`;
}

function findActionTarget(
  campaign: Campaign,
  characterKey: string | undefined
): CampaignCharacterTarget | undefined {
  if (characterKey) {
    return campaign.characterTargets.find(
      (target) => target.characterKey.toLowerCase() === characterKey.toLowerCase()
    );
  }

  return campaign.characterTargets.length === 1 ? campaign.characterTargets[0] : undefined;
}

function buildPlannerCharacterHref(
  campaign: Campaign,
  target: CampaignCharacterTarget,
  materialKey?: string
): string {
  const params = new URLSearchParams({
    character: target.characterKey,
    goal: target.buildGoal,
    campaign: campaign.id,
  });

  if (materialKey) {
    params.set('material', materialKey);
  }

  return `/planner?${params.toString()}`;
}

function buildMaterialActionHref(action: CampaignNextAction, campaign: Campaign): string {
  const target = findActionTarget(campaign, action.characterKey);
  if (target?.ownership === 'owned') {
    return buildPlannerCharacterHref(campaign, target, action.materialKey);
  }

  return buildCampaignMaterialHref(campaign.id, action.materialKey);
}

function shouldOpenCharacterPlanner(action: CampaignNextAction, campaign: Campaign): boolean {
  return findActionTarget(campaign, action.characterKey)?.ownership === 'owned';
}
