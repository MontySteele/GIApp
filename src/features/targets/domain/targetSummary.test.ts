import { describe, expect, it } from 'vitest';
import {
  buildTargetSummaries,
  campaignToTargetSummary,
  plannedBannerToTargetSummary,
  wishlistToTargetSummary,
} from './targetSummary';
import type { Campaign, PlannedBanner } from '@/types';

const campaign: Campaign = {
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
};

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

describe('target summary domain', () => {
  it('summarizes active campaigns with readiness and budget context', () => {
    expect(campaignToTargetSummary(campaign, {
      campaignId: campaign.id,
      status: 'attention',
      overallPercent: 67,
      materialReadiness: {} as never,
      buildReadiness: {} as never,
      pullReadiness: {} as never,
      nextActions: [],
    })).toMatchObject({
      id: 'campaign:campaign-1',
      kind: 'pull',
      status: 'active',
      title: 'Recruit Furina',
      readinessPercent: 67,
      pullBudget: 120,
      actionHref: '/campaigns/campaign-1',
    });
  });

  it('turns planned banners into one-click target drafts', () => {
    const summary = plannedBannerToTargetSummary(plannedBanner);

    expect(summary).toMatchObject({
      id: 'planned-banner:banner-1',
      source: 'planned-banner',
      kind: 'pull',
      title: 'Pull for Kaedehara Kazuha',
      actionLabel: 'Start Target',
    });
    expect(summary.actionHref).toBe(
      '/campaigns?character=KaedeharaKazuha&buildGoal=comfortable&priority=2&budget=90&deadline=2026-06-10&pullPlan=1'
    );
  });

  it('marks wishlist items that are already covered by an open campaign', () => {
    expect(wishlistToTargetSummary({
      key: 'Furina',
      targetGoal: 'full',
      addedAt: '2026-05-01T00:00:00.000Z',
    }, [campaign])).toMatchObject({
      subtitle: 'Already attached to an active target',
      priority: 5,
    });
  });

  it('orders active targets before planned and wishlist targets', () => {
    const summaries = buildTargetSummaries({
      campaigns: [campaign],
      plannedBanners: [plannedBanner],
      wishlist: [
        {
          key: 'Neuvillette',
          targetGoal: 'comfortable',
          addedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    });

    expect(summaries.map((summary) => summary.source)).toEqual([
      'campaign',
      'planned-banner',
      'wishlist',
    ]);
  });
});
