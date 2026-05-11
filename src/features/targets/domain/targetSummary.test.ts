import { describe, expect, it } from 'vitest';
import {
  buildTargetSummaries,
  campaignToTargetSummary,
  compareTargetSummaries,
  plannedBannerToTargetSummary,
  wishlistToTargetSummary,
  type TargetSummary,
} from './targetSummary';
import type {
  CampaignNextAction,
  CampaignPlan,
} from '@/features/campaigns/domain/campaignPlan';
import type { Campaign, PlannedBanner } from '@/types';

function createCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-1',
    type: 'character-acquisition',
    name: 'Recruit Furina',
    status: 'active',
    priority: 1,
    deadline: '2026-06-01',
    pullTargets: [
      {
        id: 'pull-1',
        itemKey: 'Furina',
        itemType: 'character',
        bannerType: 'character',
        desiredCopies: 1,
        maxPullBudget: 120,
        isConfirmed: true,
      },
    ],
    characterTargets: [
      {
        id: 'character-1',
        characterKey: 'Furina',
        ownership: 'wishlist',
        buildGoal: 'comfortable',
      },
    ],
    notes: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function createPlan(overrides: Partial<CampaignPlan> = {}): CampaignPlan {
  const nextAction: CampaignNextAction = {
    id: 'materials:Mora',
    category: 'materials',
    label: 'Farm Mora',
    detail: '800 Mora still needed.',
    priority: 1,
    materialKey: 'Mora',
  };

  return {
    campaignId: 'campaign-1',
    status: 'attention',
    overallPercent: 67,
    pullReadiness: {
      hasTargets: true,
      availablePulls: 90,
      targetPulls: 120,
      remainingPulls: 30,
      percent: 75,
      status: 'attention',
    },
    buildReadiness: {
      targetCount: 1,
      ownedCount: 0,
      readyCount: 0,
      gapCount: 1,
      percent: 40,
      status: 'blocked',
      characters: [],
    },
    materialReadiness: {
      hasTargets: true,
      percent: 55,
      status: 'attention',
      totalMaterials: 2,
      readyMaterials: 1,
      deficitMaterials: 1,
      topDeficits: [],
      totalEstimatedResin: 120,
      totalEstimatedDays: 1,
      summary: null,
      errors: [],
    },
    nextActions: [nextAction],
    ...overrides,
  };
}

const plannedBanner: PlannedBanner = {
  id: 'banner-1',
  characterKey: 'KaedeharaKazuha',
  expectedStartDate: '2026-06-10',
  expectedEndDate: '2026-07-01',
  priority: 2,
  maxPullBudget: 90,
  isConfirmed: false,
  notes: '',
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

function summary(overrides: Partial<TargetSummary>): TargetSummary {
  return {
    id: 'target',
    source: 'campaign',
    kind: 'pull',
    status: 'active',
    title: 'Target',
    subtitle: 'Target',
    priority: 3,
    href: '/campaigns/target',
    actionHref: '/campaigns/target',
    actionLabel: 'Open Target',
    characterKeys: [],
    ...overrides,
  };
}

describe('target summary domain', () => {
  it('summarizes active campaigns with readiness, budget, and next action context', () => {
    expect(campaignToTargetSummary(createCampaign(), createPlan())).toMatchObject({
      id: 'campaign:campaign-1',
      kind: 'pull',
      status: 'active',
      title: 'Recruit Furina',
      readinessPercent: 67,
      pullReadinessPercent: 75,
      buildReadinessPercent: 40,
      materialReadinessPercent: 55,
      pullBudget: 120,
      actionHref: '/campaigns/campaign-1',
      nextAction: expect.objectContaining({ label: 'Farm Mora' }),
    });
  });

  it('classifies character build and team targets from campaign type', () => {
    expect(campaignToTargetSummary(createCampaign({
      type: 'character-polish',
      name: 'Build Furina',
      pullTargets: [],
    }))).toMatchObject({
      kind: 'build',
      subtitle: 'Furina',
    });

    expect(campaignToTargetSummary(createCampaign({
      type: 'team-polish',
      name: 'Polish Hyperbloom',
      pullTargets: [],
      teamTarget: {
        teamId: 'team-1',
        name: 'Hyperbloom',
        memberKeys: ['Furina', 'Nahida'],
      },
    }))).toMatchObject({
      kind: 'team',
      subtitle: 'Hyperbloom',
    });
  });

  it('turns planned banners into one-click target drafts', () => {
    const plannedSummary = plannedBannerToTargetSummary(plannedBanner);

    expect(plannedSummary).toMatchObject({
      id: 'planned-banner:banner-1',
      source: 'planned-banner',
      kind: 'pull',
      title: 'Pull for Kaedehara Kazuha',
      actionLabel: 'Start Target',
    });
    expect(plannedSummary.actionHref).toBe(
      '/campaigns?character=KaedeharaKazuha&buildGoal=comfortable&priority=2&budget=90&deadline=2026-06-10&pullPlan=1'
    );
  });

  it('marks wishlist items that are already covered by an open campaign', () => {
    expect(wishlistToTargetSummary({
      key: 'Furina',
      targetGoal: 'full',
      addedAt: '2026-05-01T00:00:00.000Z',
    }, [createCampaign()])).toMatchObject({
      subtitle: 'Already attached to an active target',
      priority: 5,
    });
  });

  it('keeps uncovered wishlist items actionable', () => {
    expect(wishlistToTargetSummary({
      key: 'Neuvillette',
      targetGoal: 'comfortable',
      addedAt: '2026-05-01T00:00:00.000Z',
    }, [createCampaign()])).toMatchObject({
      subtitle: 'comfortable build goal',
      priority: 3,
      actionLabel: 'Start Target',
    });
  });

  it('orders targets by status, priority, deadline, then title', () => {
    const targets = [
      summary({ id: 'wishlist', source: 'wishlist', status: 'wishlist', title: 'Wishlist' }),
      summary({ id: 'late', status: 'active', priority: 2, deadline: '2026-06-20', title: 'Late' }),
      summary({ id: 'paused', status: 'paused', priority: 1, title: 'Paused' }),
      summary({ id: 'alpha', status: 'active', priority: 1, deadline: '2026-06-01', title: 'Alpha' }),
      summary({ id: 'beta', status: 'active', priority: 1, deadline: '2026-06-01', title: 'Beta' }),
    ].sort(compareTargetSummaries);

    expect(targets.map((target) => target.id)).toEqual([
      'alpha',
      'beta',
      'late',
      'paused',
      'wishlist',
    ]);
  });

  it('builds an empty list when no target sources exist', () => {
    expect(buildTargetSummaries({ campaigns: [] })).toEqual([]);
  });

  it('orders active targets before planned and wishlist targets', () => {
    const summaries = buildTargetSummaries({
      campaigns: [createCampaign()],
      plannedBanners: [plannedBanner],
      wishlist: [
        {
          key: 'Neuvillette',
          targetGoal: 'comfortable',
          addedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
      plans: {
        'campaign-1': createPlan(),
      },
    });

    expect(summaries.map((item) => item.source)).toEqual([
      'campaign',
      'planned-banner',
      'wishlist',
    ]);
    expect(summaries[0]?.nextAction?.label).toBe('Farm Mora');
  });
});
