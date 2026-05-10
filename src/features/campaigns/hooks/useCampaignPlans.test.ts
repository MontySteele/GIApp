import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildTemplate, Campaign, Team } from '@/types';
import type { CampaignPlan, CampaignPlanContext } from '../domain/campaignPlan';
import { useCampaignPlans } from './useCampaignPlans';

const mocks = vi.hoisted(() => ({
  calculateCampaignPlan: vi.fn(),
}));

vi.mock('../domain/campaignPlan', () => ({
  calculateCampaignPlan: mocks.calculateCampaignPlan,
}));

const campaign: Campaign = {
  id: 'campaign-1',
  type: 'team-polish',
  name: 'Polish Team',
  status: 'active',
  priority: 2,
  pullTargets: [],
  characterTargets: [],
  teamTarget: {
    teamId: 'team-1',
    name: 'Team',
    memberKeys: ['Furina'],
  },
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const team: Team = {
  id: 'team-1',
  name: 'Team',
  characterKeys: ['Furina'],
  rotationNotes: '',
  tags: [],
  memberBuildTemplates: {
    Furina: 'template-1',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const buildTemplate = {
  id: 'template-1',
  name: 'Furina Template',
} as BuildTemplate;

const context: CampaignPlanContext = {
  characters: [],
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
  teams: [team],
  buildTemplates: [buildTemplate],
};

const plan = {
  campaignId: campaign.id,
  overallPercent: 100,
} as CampaignPlan;

describe('useCampaignPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calculateCampaignPlan.mockResolvedValue(plan);
  });

  it('passes the full campaign plan context through to the domain calculator', async () => {
    const { result } = renderHook(() => useCampaignPlans([campaign], context));

    await waitFor(() => {
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.plans[campaign.id]).toBe(plan);
    });

    expect(mocks.calculateCampaignPlan).toHaveBeenCalledWith(campaign, context);
  });

  it('surfaces calculation errors', async () => {
    mocks.calculateCampaignPlan.mockRejectedValueOnce(new Error('Plan failed'));

    const { result } = renderHook(() => useCampaignPlans([campaign], context));

    await waitFor(() => {
      expect(result.current.isCalculating).toBe(false);
      expect(result.current.error).toBe('Plan failed');
    });
  });
});
