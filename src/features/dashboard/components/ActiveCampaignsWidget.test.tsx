import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActiveCampaignsWidget from './ActiveCampaignsWidget';
import type { Campaign } from '@/types';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';

const mocks = vi.hoisted(() => ({
  activeCampaigns: [] as Campaign[],
  campaignsLoading: false,
  plans: {} as Record<string, CampaignPlan>,
  plansLoading: false,
  plansCalculating: false,
  freshness: {
    status: 'fresh',
    label: 'Fresh import',
    detail: 'Imported recently.',
  },
}));

vi.mock('@/features/campaigns/hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    activeCampaigns: mocks.activeCampaigns,
    isLoading: mocks.campaignsLoading,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: mocks.plans,
    isLoading: mocks.plansLoading,
    isCalculating: mocks.plansCalculating,
    error: null,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaignPlanContext', () => ({
  useCampaignPlanContext: () => ({
    context: {
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
    },
    characters: [],
    isLoading: false,
    charactersLoading: false,
    materialsLoading: false,
    availablePullsLoading: false,
  }),
}));

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.freshness,
}));

vi.mock('@/lib/gameData', () => ({
  getDisplayName: (key: string) => key,
}));

const activeCampaign: Campaign = {
  id: 'campaign-1',
  type: 'character-acquisition',
  name: 'Recruit Furina',
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

const campaignPlan: CampaignPlan = {
  campaignId: 'campaign-1',
  overallPercent: 62,
  status: 'attention',
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
    percent: 80,
    status: 'attention',
    characters: [],
  },
  materialReadiness: {
    hasTargets: true,
    percent: 40,
    status: 'blocked',
    totalMaterials: 3,
    readyMaterials: 1,
    deficitMaterials: 2,
    topDeficits: [],
    totalEstimatedResin: 120,
    totalEstimatedDays: 1,
    summary: null,
    errors: [],
  },
  nextActions: [
    {
      id: 'action-1',
      category: 'materials',
      label: 'Farm Mora',
      detail: '120,000 still needed.',
      priority: 2,
      materialKey: 'Mora',
    },
  ],
};

function renderWidget() {
  return render(
    <MemoryRouter>
      <ActiveCampaignsWidget />
    </MemoryRouter>
  );
}

describe('ActiveCampaignsWidget', () => {
  beforeEach(() => {
    mocks.activeCampaigns = [activeCampaign];
    mocks.campaignsLoading = false;
    mocks.plans = {};
    mocks.plansLoading = false;
    mocks.plansCalculating = false;
    mocks.freshness = {
      status: 'fresh',
      label: 'Fresh import',
      detail: 'Imported recently.',
    };
  });

  it('renders active campaigns while plan data is still loading', () => {
    mocks.plansLoading = true;

    renderWidget();

    expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
    expect(screen.getByText('Calculating next action...')).toBeInTheDocument();
    expect(screen.getByLabelText('Target readiness loading')).toBeInTheDocument();
  });

  it('renders an empty state when there are no active campaigns', () => {
    mocks.activeCampaigns = [];

    renderWidget();

    expect(screen.getByText('No active target selected.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create/i })).toHaveAttribute('href', '/campaigns');
  });

  it('renders the next action and readiness once a plan is available', () => {
    mocks.plans = {
      'campaign-1': campaignPlan,
    };

    renderWidget();

    expect(screen.getByText('Farm Mora')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
  });

  it('renders a compact import freshness prompt for stale campaign data', () => {
    mocks.freshness = {
      status: 'stale',
      label: 'Refresh account data',
      detail: 'Last Irminsul import was 12 days ago.',
    };

    renderWidget();

    expect(screen.getByText('Refresh account data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh import/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );
  });

  it('shows a more indicator when more than three campaigns are active', () => {
    mocks.activeCampaigns = [
      activeCampaign,
      { ...activeCampaign, id: 'campaign-2', name: 'Build Neuvillette', priority: 2 },
      { ...activeCampaign, id: 'campaign-3', name: 'Polish Hyperbloom', priority: 3 },
      { ...activeCampaign, id: 'campaign-4', name: 'Save for Skirk', priority: 4 },
    ];

    renderWidget();

    expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
    expect(screen.getByText('Build Neuvillette')).toBeInTheDocument();
    expect(screen.getByText('Polish Hyperbloom')).toBeInTheDocument();
    expect(screen.queryByText('Save for Skirk')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+1 more active targets/i })).toHaveAttribute(
      'href',
      '/campaigns'
    );
  });

  it('uses the full skeleton only while campaigns are loading', () => {
    mocks.campaignsLoading = true;

    renderWidget();

    expect(screen.queryByText('Recruit Furina')).not.toBeInTheDocument();
    expect(screen.queryByText('Calculating next action...')).not.toBeInTheDocument();
  });
});
