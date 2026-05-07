import type { Campaign, CampaignBuildGoal } from '@/types';

interface CampaignPrefill {
  characterKey?: string;
  teamId?: string;
  buildGoal?: CampaignBuildGoal;
  priority?: Campaign['priority'];
  desiredCopies?: number;
  targetConstellation?: number;
  maxPullBudget?: number;
  includePullTarget?: boolean;
}

export function buildCampaignPrefillUrl(prefill: CampaignPrefill): string {
  const params = new URLSearchParams();

  if (prefill.teamId) {
    params.set('team', prefill.teamId);
  }
  if (prefill.characterKey) {
    params.set('character', prefill.characterKey);
  }
  if (prefill.buildGoal) {
    params.set('buildGoal', prefill.buildGoal);
  }
  if (prefill.priority !== undefined) {
    params.set('priority', String(prefill.priority));
  }
  if (prefill.desiredCopies !== undefined) {
    params.set('copies', String(prefill.desiredCopies));
  }
  if (prefill.targetConstellation !== undefined) {
    params.set('constellation', String(prefill.targetConstellation));
  }
  if (prefill.maxPullBudget !== undefined) {
    params.set('budget', String(prefill.maxPullBudget));
  }
  if (prefill.includePullTarget !== undefined) {
    params.set('pullPlan', prefill.includePullTarget ? '1' : '0');
  }

  const query = params.toString();
  return query ? `/campaigns?${query}` : '/campaigns';
}

export function buildCharacterCampaignUrl(
  characterKey: string,
  buildGoal: CampaignBuildGoal = 'comfortable',
  includePullTarget = true
): string {
  return buildCampaignPrefillUrl({
    characterKey,
    buildGoal,
    includePullTarget,
  });
}

export function buildConstellationCampaignUrl(
  characterKey: string,
  currentConstellation: number,
  targetConstellation: number,
  buildGoal: CampaignBuildGoal = 'comfortable'
): string {
  const safeCurrent = Math.max(0, Math.min(6, Math.floor(currentConstellation)));
  const safeTarget = Math.max(1, Math.min(6, Math.floor(targetConstellation)));

  return buildCampaignPrefillUrl({
    characterKey,
    buildGoal,
    includePullTarget: true,
    desiredCopies: Math.max(1, safeTarget - safeCurrent),
    targetConstellation: safeTarget,
  });
}

export function buildTeamCampaignUrl(
  teamId: string,
  buildGoal: CampaignBuildGoal = 'comfortable'
): string {
  return buildCampaignPrefillUrl({
    teamId,
    buildGoal,
  });
}
