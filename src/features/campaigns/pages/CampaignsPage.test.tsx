import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignsPage from './CampaignsPage';
import type { Campaign } from '@/types';
import type { CampaignPlan } from '../domain/campaignPlan';

const mocks = vi.hoisted(() => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  campaigns: [] as Campaign[],
  plans: {} as Record<string, CampaignPlan>,
  plansCalculating: false,
}));

vi.mock('../hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: mocks.campaigns,
    activeCampaigns: mocks.campaigns.filter((c) => c.status === 'active'),
    createCampaign: mocks.createCampaign,
    updateCampaign: mocks.updateCampaign,
    deleteCampaign: mocks.deleteCampaign,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: mocks.plans,
    isLoading: false,
    isCalculating: mocks.plansCalculating,
    error: null,
  }),
}));

vi.mock('../hooks/useCampaignPlanContext', () => ({
  useCampaignPlanContext: () => ({
    context: {
      characters: [
        {
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
          createdAt: '',
          updatedAt: '',
        },
      ],
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
    characters: [
      {
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
        createdAt: '',
        updatedAt: '',
      },
    ],
    isLoading: false,
    charactersLoading: false,
    materialsLoading: false,
    availablePullsLoading: false,
  }),
}));

vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: () => ({
    teams: [
      {
        id: 'team-1',
        name: 'Salon Core',
        characterKeys: ['Furina'],
        rotationNotes: '',
        tags: [],
        createdAt: '',
        updatedAt: '',
      },
    ],
    isLoading: false,
  }),
}));

const activeCampaign: Campaign = {
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
      maxPullBudget: null,
      isConfirmed: false,
    },
  ],
  characterTargets: [
    {
      id: 'target-1',
      characterKey: 'Furina',
      ownership: 'owned',
      buildGoal: 'comfortable',
    },
  ],
  notes: 'C1 would be nice',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const pausedCampaign: Campaign = {
  ...activeCampaign,
  id: 'campaign-2',
  name: 'Bench Warmer',
  status: 'paused',
  priority: 4,
  notes: '',
};

const campaignPlan: CampaignPlan = {
  campaignId: 'campaign-1',
  overallPercent: 62,
  status: 'attention',
  pullReadiness: {
    hasTargets: true,
    availablePulls: 100,
    targetPulls: 160,
    remainingPulls: 60,
    percent: 62,
    status: 'attention',
  },
  buildReadiness: {
    targetCount: 1,
    ownedCount: 1,
    percent: 75,
    status: 'attention',
    characters: [],
  },
  materialReadiness: {
    hasTargets: true,
    percent: 50,
    status: 'attention',
    totalMaterials: 4,
    readyMaterials: 2,
    deficitMaterials: 2,
    topDeficits: [],
    totalEstimatedResin: 120,
    totalEstimatedDays: 1,
    errors: [],
  },
  nextActions: [
    {
      id: 'action-1',
      category: 'pulls',
      label: 'Save 60 more pulls',
      detail: '100/160 pulls ready.',
      priority: 1,
    },
  ],
};

function renderPage(initialEntry = '/campaigns') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<div>Campaign detail</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCampaign.mockResolvedValue('campaign-new');
    mocks.updateCampaign.mockResolvedValue(undefined);
    mocks.deleteCampaign.mockResolvedValue(undefined);
    mocks.campaigns = [];
    mocks.plans = {};
    mocks.plansCalculating = false;
  });

  describe('empty state', () => {
    it('shows the empty state when there are no campaigns', () => {
      renderPage();

      expect(screen.getByText('No campaigns yet')).toBeInTheDocument();
      expect(screen.getByText(/create a character acquisition/i)).toBeInTheDocument();
    });

    it('shows the create form even with no campaigns', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'New Campaign' })).toBeInTheDocument();
      expect(screen.getByLabelText('Campaign type')).toBeInTheDocument();
    });
  });

  describe('campaign list', () => {
    it('renders campaign cards with plan data', () => {
      mocks.campaigns = [activeCampaign];
      mocks.plans = { 'campaign-1': campaignPlan };
      renderPage();

      expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('62% ready')).toBeInTheDocument();
      expect(screen.getByText('P1')).toBeInTheDocument();
      expect(screen.getByText('1 active')).toBeInTheDocument();
    });

    it('renders multiple campaigns', () => {
      mocks.campaigns = [activeCampaign, pausedCampaign];
      renderPage();

      expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
      expect(screen.getByText('Bench Warmer')).toBeInTheDocument();
    });

    it('shows plan readiness stats', () => {
      mocks.campaigns = [activeCampaign];
      mocks.plans = { 'campaign-1': campaignPlan };
      renderPage();

      expect(screen.getByText('62%')).toBeInTheDocument();
      expect(screen.getByText('100/160')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('shows next actions from the plan', () => {
      mocks.campaigns = [activeCampaign];
      mocks.plans = { 'campaign-1': campaignPlan };
      renderPage();

      expect(screen.getByText('Save 60 more pulls')).toBeInTheDocument();
    });

    it('shows campaign notes', () => {
      mocks.campaigns = [activeCampaign];
      renderPage();

      expect(screen.getByText('C1 would be nice')).toBeInTheDocument();
    });

    it('shows loading skeletons while plan is calculating', () => {
      mocks.campaigns = [activeCampaign];
      mocks.plansCalculating = true;
      renderPage();

      expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('status changes', () => {
    it('pauses an active campaign', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /pause/i }));

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'paused' });
    });

    it('activates a paused campaign', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [pausedCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /activate/i }));

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-2', { status: 'active' });
    });

    it('completes a campaign', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /complete/i }));

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'completed' });
    });

    it('archives a campaign', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /archive/i }));

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'archived' });
    });

    it('shows error feedback when status update fails', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      mocks.updateCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      await user.click(screen.getByRole('button', { name: /pause/i }));

      expect(screen.getByText(/failed to update.*status/i)).toBeInTheDocument();
    });
  });

  describe('delete flow', () => {
    it('shows confirmation modal before deleting', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
      expect(mocks.deleteCampaign).not.toHaveBeenCalled();
    });

    it('deletes after confirmation', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /delete/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      expect(mocks.deleteCampaign).toHaveBeenCalledWith('campaign-1');
    });

    it('cancels delete when modal is dismissed', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      renderPage();

      await user.click(screen.getByRole('button', { name: /delete/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

      expect(mocks.deleteCampaign).not.toHaveBeenCalled();
    });

    it('shows error feedback when delete fails', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];
      mocks.deleteCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      await user.click(screen.getByRole('button', { name: /delete/i }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /delete/i }));

      expect(screen.getByText(/failed to delete campaign/i)).toBeInTheDocument();
    });
  });

  describe('campaign creation', () => {
    it('applies character campaign prefill from the URL', () => {
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0&copies=2&budget=150&priority=1');

      expect(screen.getByLabelText('Campaign type')).toHaveValue('character-acquisition');
      expect(screen.getByLabelText('Target character')).toHaveValue('Furina');
      expect(screen.getByLabelText('Build goal')).toHaveValue('full');
      expect(screen.getByLabelText('Priority')).toHaveValue('1');
      expect(screen.getByLabelText('Copies')).toHaveValue(2);
      expect(screen.getByLabelText('Pull budget')).toHaveValue(150);
      expect(screen.getByLabelText('Include pull plan')).not.toBeChecked();
    });

    it('omits pull targets when the prefill disables pull planning', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0');

      await user.click(screen.getByRole('button', { name: /create campaign/i }));

      expect(mocks.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'character-acquisition',
          characterTargets: [
            expect.objectContaining({
              characterKey: 'Furina',
              buildGoal: 'full',
              ownership: 'owned',
            }),
          ],
          pullTargets: [],
        })
      );
      expect(await screen.findByText('Campaign detail')).toBeInTheDocument();
    });

    it('applies team campaign prefill from the URL', () => {
      renderPage('/campaigns?team=team-1&buildGoal=functional');

      expect(screen.getByLabelText('Campaign type')).toHaveValue('team-polish');
      expect(screen.getByLabelText('Target team')).toHaveValue('team-1');
      expect(screen.getByLabelText('Build goal')).toHaveValue('functional');
    });

    it('shows validation error for missing team selection', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.selectOptions(screen.getByLabelText('Campaign type'), 'team-polish');
      await user.click(screen.getByRole('button', { name: /create campaign/i }));

      expect(screen.getByText(/choose a team/i)).toBeInTheDocument();
      expect(mocks.createCampaign).not.toHaveBeenCalled();
    });

    it('shows error feedback when creation fails', async () => {
      const user = userEvent.setup();
      mocks.createCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      await user.click(screen.getByRole('button', { name: /create campaign/i }));

      expect(screen.getByText(/failed to create campaign/i)).toBeInTheDocument();
    });

    it('navigates to detail page after successful creation', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /create campaign/i }));

      expect(await screen.findByText('Campaign detail')).toBeInTheDocument();
    });
  });
});
