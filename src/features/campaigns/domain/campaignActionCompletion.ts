import type { CampaignNextAction } from './campaignPlan';
import type { CampaignStatus } from '@/types';

export type CampaignAutomaticActionState = 'done' | 'started';

export interface CampaignActionCompletionTarget {
  campaignId: string;
  action: CampaignNextAction;
}

export type CampaignActionCompletionEvent =
  | {
      type: 'wish-import-complete';
      importedWishCount: number;
      activePullCampaignCount: number;
    }
  | {
      type: 'material-import-complete';
      importedMaterialCount: number;
    }
  | {
      type: 'campaign-status-change';
      campaignId: string;
      status: CampaignStatus;
    }
  | {
      type: 'calculator-visit';
      campaignId: string;
    }
  | {
      type: 'materials-visit';
      campaignId: string;
      materialKey?: string | null;
    };

export function getAutomaticCampaignActionState(
  target: CampaignActionCompletionTarget,
  event: CampaignActionCompletionEvent
): CampaignAutomaticActionState | null {
  if (event.type === 'wish-import-complete') {
    if (
      event.importedWishCount > 0 &&
      event.activePullCampaignCount > 0 &&
      target.action.category === 'pulls'
    ) {
      return 'started';
    }
    return null;
  }

  if (event.type === 'material-import-complete') {
    return event.importedMaterialCount > 0 && target.action.category === 'materials'
      ? 'started'
      : null;
  }

  if (event.campaignId !== target.campaignId) {
    return null;
  }

  if (event.type === 'campaign-status-change') {
    return event.status === 'completed' && target.action.category === 'done'
      ? 'done'
      : null;
  }

  if (event.type === 'calculator-visit') {
    return target.action.category === 'pulls' ? 'started' : null;
  }

  if (target.action.category !== 'materials') {
    return null;
  }

  return !event.materialKey || event.materialKey === target.action.materialKey
    ? 'started'
    : null;
}
