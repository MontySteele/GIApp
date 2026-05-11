import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import CampaignNextActionsWidget from './CampaignNextActionsWidget';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import type { Campaign } from '@/types';
import type { DashboardResumeAction } from '../domain/dashboardResume';

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

const resumeAction: DashboardResumeAction = {
  title: 'Start your first target',
  detail: 'Pick a character or team and turn it into a daily next action.',
  href: '/campaigns',
  actionLabel: 'New Target',
  priority: 'start',
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
        resumeAction={resumeAction}
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

  it('uses the resume action when there is no active focus', () => {
    renderWidget({ activeCampaigns: [], plans: {} });

    expect(screen.getByRole('heading', { name: 'Next Up' })).toBeInTheDocument();
    expect(screen.getByText('Start your first target')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new target/i })).toHaveAttribute(
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

    expect(screen.getByText('Unable to calculate the next target action.')).toBeInTheDocument();
    expect(screen.getByText('Failed to calculate campaigns')).toBeInTheDocument();
  });

  it('falls back to resume when campaigns have no calculated actions', () => {
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

    expect(screen.getByText('Start your first target')).toBeInTheDocument();
  });

  it('elevates the highest-value campaign action with the correct destination', () => {
    renderWidget();

    expect(screen.getByText('Next Up')).toBeInTheDocument();
    expect(screen.getByText('Current focus')).toBeInTheDocument();
    expect(screen.getByText('Farm Mora')).toBeInTheDocument();
    expect(screen.getByText('120,000 still needed.')).toBeInTheDocument();
    expect(screen.getByText(/why this/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open materials/i })).toHaveAttribute(
      'href',
      '/campaigns/materials?campaign=campaign-1&material=Mora'
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

  it('keeps a compact count when many active targets feed the queue', () => {
    const campaigns = Array.from({ length: 5 }, (_, index) => ({
      ...campaign,
      id: `campaign-${index}`,
      name: `Target ${index + 1}`,
      priority: Math.min(index + 1, 5) as Campaign['priority'],
    }));
    const plans = Object.fromEntries(
      campaigns.map((item, index) => [
        item.id,
        {
          ...plan,
          campaignId: item.id,
          nextActions: [
            {
              ...plan.nextActions[0]!,
              id: `${item.id}-materials`,
              label: `Farm target ${index + 1}`,
            },
          ],
        },
      ])
    );

    renderWidget({
      activeCampaigns: campaigns,
      plans,
    });

    expect(screen.getByText('5 active targets')).toBeInTheDocument();
    expect(screen.getByText('Farm target 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1 more actions/i })).toHaveAttribute('href', '/campaigns');
  });

  it('uses campaign deadlines as a real tie-breaker instead of timestamp magnitude', () => {
    const earlyCampaign = {
      ...campaign,
      id: 'campaign-early',
      name: 'Early Deadline',
      deadline: '2026-02-01',
    };
    const lateCampaign = {
      ...campaign,
      id: 'campaign-late',
      name: 'Late Deadline',
      deadline: '2026-12-01',
    };

    renderWidget({
      activeCampaigns: [lateCampaign, earlyCampaign],
      plans: {
        'campaign-early': {
          ...plan,
          campaignId: 'campaign-early',
          nextActions: [{ ...plan.nextActions[0]!, id: 'early-action', label: 'Farm early Mora' }],
        },
        'campaign-late': {
          ...plan,
          campaignId: 'campaign-late',
          nextActions: [{ ...plan.nextActions[0]!, id: 'late-action', label: 'Farm late Mora' }],
        },
      },
    });

    expect(screen.getAllByText('Early Deadline').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Farm early Mora' })).toBeInTheDocument();
  });

  it('promotes account refresh above urgent campaign actions when campaign data is stale', () => {
    mocks.dataFreshness = {
      status: 'stale',
      isLoading: false,
      latestImport: null,
      daysSinceImport: 14,
      label: 'Refresh account data',
      detail: 'Last GOOD import was 14 days ago.',
    };

    renderWidget({
      plans: {
        [campaign.id]: {
          ...plan,
          nextActions: [
            {
              id: 'campaign-1-urgent-material',
              category: 'materials',
              label: 'Farm urgent Mora',
              detail: '120,000 still needed.',
              priority: 1,
              materialKey: 'Mora',
            },
            ...plan.nextActions,
          ],
        },
      },
    });

    expect(screen.getByRole('heading', { name: 'Refresh account data' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh import/i })).toHaveAttribute(
      'href',
      '/imports'
    );
    expect(screen.queryByRole('link', { name: /farm urgent mora/i })).not.toBeInTheDocument();
    expect(screen.getByText('2 target actions queued after refresh.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /review targets/i })).toHaveAttribute('href', '/campaigns');
    expect(screen.queryByRole('button', { name: /done/i })).not.toBeInTheDocument();
  });

  it('lets the top action disappear for today when it is marked done', async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole('button', { name: /done/i }));

    expect(screen.queryByRole('heading', { name: 'Farm Mora' })).not.toBeInTheDocument();
    expect(screen.getByText('Improve Furina')).toBeInTheDocument();
    expect(screen.getByText("Today's activity")).toBeInTheDocument();
    expect(screen.getByText('Done today')).toBeInTheDocument();
    expect(screen.getByText(/1 next action, 1 handled/i)).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /later/i }));

    expect(screen.getByText('All target actions handled today.')).toBeInTheDocument();
    expect(screen.getByText(/return tomorrow/i)).toBeInTheDocument();
    expect(screen.getByText('Snoozed')).toBeInTheDocument();
  });
});
