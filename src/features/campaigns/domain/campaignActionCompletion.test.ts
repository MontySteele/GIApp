import { describe, expect, it } from 'vitest';
import {
  getAutomaticCampaignActionState,
  type CampaignActionCompletionTarget,
} from './campaignActionCompletion';
import type { CampaignNextAction } from './campaignPlan';

function action(overrides: Partial<CampaignNextAction>): CampaignNextAction {
  return {
    id: 'campaign-1-action',
    category: 'pulls',
    label: 'Save more pulls',
    detail: 'Keep saving for the target.',
    priority: 1,
    ...overrides,
  };
}

function target(actionOverrides: Partial<CampaignNextAction>): CampaignActionCompletionTarget {
  return {
    campaignId: 'campaign-1',
    action: action(actionOverrides),
  };
}

describe('getAutomaticCampaignActionState', () => {
  it('marks pull actions started after a useful wish import without completing the action', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'pulls' }), {
        type: 'wish-import-complete',
        importedWishCount: 42,
        activePullCampaignCount: 1,
      })
    ).toBe('started');
  });

  it('ignores wish imports when no wishes were imported or no active pull campaigns exist', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'pulls' }), {
        type: 'wish-import-complete',
        importedWishCount: 0,
        activePullCampaignCount: 1,
      })
    ).toBeNull();
    expect(
      getAutomaticCampaignActionState(target({ category: 'pulls' }), {
        type: 'wish-import-complete',
        importedWishCount: 10,
        activePullCampaignCount: 0,
      })
    ).toBeNull();
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials' }), {
        type: 'wish-import-complete',
        importedWishCount: 10,
        activePullCampaignCount: 1,
      })
    ).toBeNull();
  });

  it('marks material actions started after importing material inventory', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials', materialKey: 'Mora' }), {
        type: 'material-import-complete',
        importedMaterialCount: 5,
      })
    ).toBe('started');
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials', materialKey: 'Mora' }), {
        type: 'material-import-complete',
        importedMaterialCount: 0,
      })
    ).toBeNull();
  });

  it('marks the campaign review action done only when that campaign is completed', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'done' }), {
        type: 'campaign-status-change',
        campaignId: 'campaign-1',
        status: 'completed',
      })
    ).toBe('done');
    expect(
      getAutomaticCampaignActionState(target({ category: 'done' }), {
        type: 'campaign-status-change',
        campaignId: 'campaign-2',
        status: 'completed',
      })
    ).toBeNull();
    expect(
      getAutomaticCampaignActionState(target({ category: 'done' }), {
        type: 'campaign-status-change',
        campaignId: 'campaign-1',
        status: 'paused',
      })
    ).toBeNull();
  });

  it('marks focused calculator visits as starting pull work for the same campaign', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'pulls' }), {
        type: 'calculator-visit',
        campaignId: 'campaign-1',
      })
    ).toBe('started');
    expect(
      getAutomaticCampaignActionState(target({ category: 'pulls' }), {
        type: 'calculator-visit',
        campaignId: 'campaign-2',
      })
    ).toBeNull();
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials' }), {
        type: 'calculator-visit',
        campaignId: 'campaign-1',
      })
    ).toBeNull();
  });

  it('marks focused material planner visits as starting matching material work', () => {
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials', materialKey: 'Mora' }), {
        type: 'materials-visit',
        campaignId: 'campaign-1',
        materialKey: 'Mora',
      })
    ).toBe('started');
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials', materialKey: 'Mora' }), {
        type: 'materials-visit',
        campaignId: 'campaign-1',
      })
    ).toBe('started');
    expect(
      getAutomaticCampaignActionState(target({ category: 'materials', materialKey: 'Mora' }), {
        type: 'materials-visit',
        campaignId: 'campaign-1',
        materialKey: 'HeroWit',
      })
    ).toBeNull();
  });
});
