import { act, renderHook, waitFor } from '@testing-library/react';
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

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

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

  it('ignores stale async results after campaigns change', async () => {
    const staleCalculation = createDeferred<CampaignPlan>();
    const freshCalculation = createDeferred<CampaignPlan>();
    const updatedCampaign = {
      ...campaign,
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    const updatedPlan = {
      ...plan,
      overallPercent: 50,
    } as CampaignPlan;
    mocks.calculateCampaignPlan.mockReset();
    mocks.calculateCampaignPlan
      .mockReturnValueOnce(staleCalculation.promise)
      .mockReturnValueOnce(freshCalculation.promise);

    const { result, rerender } = renderHook(
      ({ campaigns }) => useCampaignPlans(campaigns, context),
      { initialProps: { campaigns: [campaign] } }
    );

    await waitFor(() => {
      expect(mocks.calculateCampaignPlan).toHaveBeenCalledTimes(1);
    });

    rerender({ campaigns: [updatedCampaign] });

    await waitFor(() => {
      expect(mocks.calculateCampaignPlan).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      freshCalculation.resolve(updatedPlan);
      await freshCalculation.promise;
    });

    await waitFor(() => {
      expect(result.current.plans[campaign.id]).toBe(updatedPlan);
    });

    await act(async () => {
      staleCalculation.resolve(plan);
      await staleCalculation.promise;
    });

    expect(result.current.plans[campaign.id]).toBe(updatedPlan);
  });

  it('recalculates against the latest context object', async () => {
    const nextContext = {
      ...context,
      availablePulls: {
        ...context.availablePulls,
        availablePulls: 42,
      },
    };
    const nextPlan = {
      ...plan,
      overallPercent: 42,
    } as CampaignPlan;
    mocks.calculateCampaignPlan
      .mockResolvedValueOnce(plan)
      .mockResolvedValueOnce(nextPlan);

    const { result, rerender } = renderHook(
      ({ planContext }) => useCampaignPlans([campaign], planContext),
      { initialProps: { planContext: context } }
    );

    await waitFor(() => {
      expect(result.current.plans[campaign.id]).toBe(plan);
    });

    rerender({ planContext: nextContext });

    await waitFor(() => {
      expect(result.current.plans[campaign.id]).toBe(nextPlan);
    });
    expect(mocks.calculateCampaignPlan).toHaveBeenLastCalledWith(campaign, nextContext);
  });

  it('clears calculation errors after a successful recalculation', async () => {
    const updatedCampaign = {
      ...campaign,
      updatedAt: '2026-01-03T00:00:00.000Z',
    };
    mocks.calculateCampaignPlan
      .mockRejectedValueOnce(new Error('Plan failed'))
      .mockResolvedValueOnce(plan);

    const { result, rerender } = renderHook(
      ({ campaigns }) => useCampaignPlans(campaigns, context),
      { initialProps: { campaigns: [campaign] } }
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Plan failed');
    });

    rerender({ campaigns: [updatedCampaign] });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.plans[campaign.id]).toBe(plan);
    });
  });
});
