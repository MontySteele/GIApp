import type { Campaign, CampaignBuildGoal } from '@/types';

interface CampaignPrefill {
  characterKey?: string;
  teamId?: string;
  buildGoal?: CampaignBuildGoal;
  priority?: Campaign['priority'];
  desiredCopies?: number;
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

export function buildTeamCampaignUrl(
  teamId: string,
  buildGoal: CampaignBuildGoal = 'comfortable'
): string {
  return buildCampaignPrefillUrl({
    teamId,
    buildGoal,
  });
}
