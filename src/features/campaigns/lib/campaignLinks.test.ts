import { describe, expect, it } from 'vitest';
import {
  buildCampaignPrefillUrl,
  buildCharacterCampaignUrl,
  buildTeamCampaignUrl,
} from './campaignLinks';

describe('campaignLinks', () => {
  it('builds character campaign prefill URLs', () => {
    expect(buildCharacterCampaignUrl('Furina', 'full', true)).toBe(
      '/campaigns?character=Furina&buildGoal=full&pullPlan=1'
    );
  });

  it('builds owned character campaign URLs without pull planning', () => {
    expect(buildCharacterCampaignUrl('Furina', 'comfortable', false)).toBe(
      '/campaigns?character=Furina&buildGoal=comfortable&pullPlan=0'
    );
  });

  it('builds team campaign prefill URLs', () => {
    expect(buildTeamCampaignUrl('team-1', 'functional')).toBe(
      '/campaigns?team=team-1&buildGoal=functional'
    );
  });

  it('includes optional pull budget fields when present', () => {
    expect(
      buildCampaignPrefillUrl({
        characterKey: 'Skirk',
        buildGoal: 'comfortable',
        priority: 1,
        desiredCopies: 2,
        maxPullBudget: 160,
      })
    ).toBe('/campaigns?character=Skirk&buildGoal=comfortable&priority=1&copies=2&budget=160');
  });
});
