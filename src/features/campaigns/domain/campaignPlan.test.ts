import { describe, expect, it } from 'vitest';
import type { Campaign, Character } from '@/types';
import {
  calculateCampaignPlan,
  calculateBuildReadiness,
  calculatePullReadiness,
  getCampaignBuildTarget,
} from './campaignPlan';

const baseCampaign: Campaign = {
  id: 'campaign-1',
  type: 'character-acquisition',
  name: 'Recruit Furina',
  status: 'active',
  priority: 1,
  pullTargets: [
    {
      id: 'pull-1',
      itemKey: 'Furina',
      itemType: 'character',
      bannerType: 'character',
      desiredCopies: 1,
      maxPullBudget: 160,
      isConfirmed: false,
    },
  ],
  characterTargets: [
    {
      id: 'char-1',
      characterKey: 'Furina',
      ownership: 'wishlist',
      buildGoal: 'comfortable',
    },
  ],
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ownedFurina: Character = {
  id: 'furina',
  key: 'Furina',
  level: 80,
  ascension: 6,
  constellation: 0,
  talent: { auto: 8, skill: 8, burst: 8 },
  weapon: { key: 'FleuveCendreFerryman', level: 90, ascension: 6, refinement: 5 },
  artifacts: [],
  notes: '',
  priority: 'main',
  teamIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('campaignPlan', () => {
  it('uses campaign build presets for target thresholds', () => {
    expect(getCampaignBuildTarget('functional')).toMatchObject({
      level: 80,
      ascension: 5,
      talents: { auto: 1, skill: 6, burst: 6 },
    });
    expect(getCampaignBuildTarget('full')).toMatchObject({
      level: 90,
      ascension: 6,
      talents: { auto: 10, skill: 10, burst: 10 },
    });
  });

  it('calculates pull readiness from available pulls and target budget', () => {
    const readiness = calculatePullReadiness(baseCampaign, {
      availablePulls: 80,
      resources: {
        primogems: 0,
        genesisCrystals: 0,
        intertwined: 80,
        acquaint: 0,
        starglitter: 0,
      },
      lastUpdated: null,
      hasSnapshot: false,
    });

    expect(readiness.percent).toBe(50);
    expect(readiness.remainingPulls).toBe(80);
    expect(readiness.status).toBe('attention');
  });

  it('uses whole pull counts for campaign readiness', () => {
    const readiness = calculatePullReadiness(
      {
        ...baseCampaign,
        pullTargets: [
          {
            ...baseCampaign.pullTargets[0]!,
            maxPullBudget: 150,
          },
        ],
      },
      {
        availablePulls: 69.4125,
        resources: {
          primogems: 11106,
          genesisCrystals: 0,
          intertwined: 0,
          acquaint: 0,
          starglitter: 0,
        },
        lastUpdated: null,
        hasSnapshot: true,
      }
    );

    expect(readiness.availablePulls).toBe(69);
    expect(readiness.targetPulls).toBe(150);
    expect(readiness.remainingPulls).toBe(81);
  });

  it('treats newly owned wishlist targets as build-ready when they meet the goal', () => {
    const readiness = calculateBuildReadiness(baseCampaign, [ownedFurina]);

    expect(readiness.ownedCount).toBe(1);
    expect(readiness.percent).toBe(100);
    expect(readiness.status).toBe('ready');
    expect(readiness.characters[0]?.characterId).toBe('furina');
    expect(readiness.characters[0]?.missing).toEqual([]);
  });

  it('adds semantic target metadata to next actions', async () => {
    const underbuiltFurina = {
      ...ownedFurina,
      level: 40,
      ascension: 2,
      talent: { auto: 1, skill: 3, burst: 3 },
    };
    const plan = await calculateCampaignPlan(
      {
        ...baseCampaign,
        pullTargets: [],
        characterTargets: [
          {
            ...baseCampaign.characterTargets[0]!,
            ownership: 'owned',
          },
        ],
      },
      {
        characters: [underbuiltFurina],
        materials: {},
        availablePulls: {
          availablePulls: 0,
          resources: {
            primogems: 0,
            genesisCrystals: 0,
            intertwined: 0,
            acquaint: 0,
            starglitter: 0,
          },
          lastUpdated: null,
          hasSnapshot: false,
        },
      }
    );

    expect(plan.buildReadiness.characters[0]?.characterId).toBe('furina');
    expect(plan.nextActions).toContainEqual(
      expect.objectContaining({
        category: 'build',
        characterKey: 'Furina',
      })
    );
  });
});
