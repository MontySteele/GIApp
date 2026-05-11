import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import CampaignNextActionsWidget from './CampaignNextActionsWidget';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import type { Campaign } from '@/types';

const mocks = vi.hoisted(() => ({
  dataFreshness: {
    status: 'fresh',
    isLoading: false,
    latestImport: null,
    daysSinceImport: 0,
    label: 'Account data current',
    detail: 'Last Irminsul import was today.',
  },
}));

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.dataFreshness,
}));

const campaign: Campaign = {
  id: 'campaign-1',
  type: 'character-polish',
  name: 'Polish Furina',
  status: 'active',
  priority: 1,
  pullTargets: [],
  characterTargets: [
    {
      id: 'target-1',
      characterKey: 'Furina',
      ownership: 'owned',
      buildGoal: 'comfortable',
    },
  ],
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const plan: CampaignPlan = {
  campaignId: 'campaign-1',
  overallPercent: 42,
  status: 'blocked',
  pullReadiness: {
    hasTargets: false,
    availablePulls: 0,
    targetPulls: 0,
    remainingPulls: 0,
    percent: 100,
    status: 'ready',
  },
  buildReadiness: {
    targetCount: 1,
    ownedCount: 1,
    percent: 60,
    status: 'attention',
    characters: [],
  },
  materialReadiness: {
    hasTargets: true,
    percent: 20,
    status: 'blocked',
    totalMaterials: 4,
    readyMaterials: 1,
    deficitMaterials: 3,
    topDeficits: [],
    totalEstimatedResin: 240,
    totalEstimatedDays: 2,
    summary: null,
    errors: [],
  },
  nextActions: [
    {
      id: 'campaign-1-material-Mora',
      category: 'materials',
      label: 'Farm Mora',
      detail: '120,000 still needed.',
      priority: 2,
      materialKey: 'Mora',
    },
    {
      id: 'campaign-1-build-Furina',
      category: 'build',
      label: 'Improve Furina',
      detail: 'Artifacts: 3/5 at +20',
      priority: 3,
      characterKey: 'Furina',
    },
  ],
};

function renderWidget(
  props: Partial<ComponentProps<typeof CampaignNextActionsWidget>> = {}
) {
  return render(
    <MemoryRouter>
      <CampaignNextActionsWidget
        activeCampaigns={[campaign]}
        isLoading={false}
        plans={{ [campaign.id]: plan }}
        plansPending={false}
        error={null}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('CampaignNextActionsWidget', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.dataFreshness = {
      status: 'fresh',
      isLoading: false,
      latestImport: null,
      daysSinceImport: 0,
      label: 'Account data current',
      detail: 'Last Irminsul import was today.',
    };
  });

  it('points users to campaign creation when there is no active focus', () => {
    renderWidget({ activeCampaigns: [], plans: {} });

    expect(screen.getByText('No campaign focus yet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create campaign/i })).toHaveAttribute(
      'href',
      '/campaigns'
    );
  });

  it('shows a loading state while campaign actions are being calculated', () => {
    renderWidget({ plans: {}, plansPending: true });

    expect(screen.getByLabelText('Campaign action loading')).toBeInTheDocument();
  });

  it('shows an error state when campaign plans cannot be calculated', () => {
    renderWidget({
      plans: {},
      plansPending: false,
      error: 'Failed to calculate campaigns',
    });

    expect(screen.getByText("Unable to calculate today's plan.")).toBeInTheDocument();
    expect(screen.getByText('Failed to calculate campaigns')).toBeInTheDocument();
  });

  it('shows a terminal review state when campaigns have no remaining actions', () => {
    renderWidget({
      plans: {
        [campaign.id]: {
          ...plan,
          overallPercent: 100,
          status: 'ready',
          nextActions: [],
        },
      },
    });

    expect(screen.getByText('Campaigns are ready for review.')).toBeInTheDocument();
    expect(screen.getByText(/mark completed goals/i)).toBeInTheDocument();
  });

  it('elevates the highest-value campaign action with the correct destination', () => {
    renderWidget();

    expect(screen.getByText("Today's Plan")).toBeInTheDocument();
    expect(screen.getByText('Current focus')).toBeInTheDocument();
    expect(screen.getByText('Farm Mora')).toBeInTheDocument();
    expect(screen.getByText('120,000 still needed.')).toBeInTheDocument();
    expect(screen.getByText(/why this/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open materials/i })).toHaveAttribute(
      'href',
      '/planner/materials?campaign=campaign-1&material=Mora'
    );
    expect(screen.getByRole('link', { name: /improve furina/i })).toHaveAttribute(
      'href',
      '/roster'
    );
  });

  it('prioritizes the action queue by action urgency and campaign priority', () => {
    const pullCampaign: Campaign = {
      ...campaign,
      id: 'campaign-2',
      type: 'character-acquisition',
      name: 'Recruit Furina',
      priority: 1,
      pullTargets: [
        {
          id: 'pull-target-1',
          itemKey: 'Furina',
          itemType: 'character',
          bannerType: 'character',
          desiredCopies: 1,
          maxPullBudget: null,
          isConfirmed: true,
        },
      ],
    };
    const pullPlan: CampaignPlan = {
      ...plan,
      campaignId: 'campaign-2',
      overallPercent: 70,
      status: 'attention',
      pullReadiness: {
        hasTargets: true,
        availablePulls: 60,
        targetPulls: 80,
        remainingPulls: 20,
        percent: 75,
        status: 'attention',
      },
      nextActions: [
        {
          id: 'campaign-2-pulls',
          category: 'pulls',
          label: 'Save 20 more pulls',
          detail: '60/80 pulls ready.',
          priority: 1,
        },
      ],
    };

    renderWidget({
      activeCampaigns: [{ ...campaign, priority: 5 }, pullCampaign],
      plans: {
        'campaign-1': plan,
        'campaign-2': pullPlan,
      },
    });

    expect(screen.getByRole('link', { name: /open calculator/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/pulls/calculator?')
    );
    expect(screen.getByText('Save 20 more pulls')).toBeInTheDocument();
  });

  it('adds account refresh to the ranked action queue when campaign data is stale', () => {
    mocks.dataFreshness = {
      status: 'stale',
      isLoading: false,
      latestImport: null,
      daysSinceImport: 14,
      label: 'Refresh account data',
      detail: 'Last GOOD import was 14 days ago.',
    };

    renderWidget();

    expect(screen.getByText('Refresh account data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh account data/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );
  });

  it('lets the top action disappear for today when it is marked done', async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: /done today/i }));

    expect(screen.queryByRole('heading', { name: 'Farm Mora' })).not.toBeInTheDocument();
    expect(screen.getByText('Improve Furina')).toBeInTheDocument();
    expect(screen.getByText("Today's activity")).toBeInTheDocument();
    expect(screen.getByText('Done today')).toBeInTheDocument();
    expect(screen.getByText(/1 action left today, 1 handled/i)).toBeInTheDocument();
  });

  it('shows an all-handled state when every campaign action is handled today', async () => {
    const user = userEvent.setup();
    renderWidget({
      plans: {
        [campaign.id]: {
          ...plan,
          nextActions: [plan.nextActions[0]!],
        },
      },
    });

    await user.click(screen.getByRole('button', { name: /snooze/i }));

    expect(screen.getByText('All campaign actions handled today.')).toBeInTheDocument();
    expect(screen.getByText(/return tomorrow/i)).toBeInTheDocument();
    expect(screen.getByText('Snoozed')).toBeInTheDocument();
  });
});
