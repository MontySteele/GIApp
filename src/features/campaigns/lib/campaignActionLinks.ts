import type { Campaign } from '@/types';
import type { CampaignNextAction, CampaignPlan } from '../domain/campaignPlan';
import { getCampaignPullTargets } from '../domain/campaignPlan';

export function getActionDestination(
  action: CampaignNextAction,
  campaign: Campaign,
  plan: CampaignPlan
): { label: string; href: string } | null {
  switch (action.category) {
    case 'pulls':
      return { label: 'Open Calculator', href: buildCampaignCalculatorHref(campaign, plan) };
    case 'materials':
      return {
        label: 'Open Materials',
        href: buildCampaignMaterialHref(campaign.id, action.materialKey),
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

export function buildCampaignCalculatorHref(campaign: Campaign, plan: CampaignPlan): string {
  const pullTargets = getCampaignPullTargets(campaign);
  if (pullTargets.length === 0) return '/pulls';

  const params = new URLSearchParams({
    mode: 'multi',
    campaign: campaign.id,
    name: campaign.name,
    pulls: String(plan.pullReadiness.availablePulls),
    targetPulls: String(plan.pullReadiness.targetPulls),
    shortfall: String(plan.pullReadiness.remainingPulls),
  });

  if (campaign.deadline) {
    params.set('deadline', campaign.deadline);
  }

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
