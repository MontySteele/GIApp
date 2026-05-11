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
  dataFreshness: {
    status: 'fresh',
    latestImport: null,
    daysSinceImport: 0,
    label: 'Account data current',
    detail: 'Last Irminsul import was today.',
  },
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

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.dataFreshness,
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
        <Route path="/campaigns/:id" element={<div>Target detail</div>} />
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
    mocks.dataFreshness = {
      status: 'fresh',
      latestImport: null,
      daysSinceImport: 0,
      label: 'Account data current',
      detail: 'Last Irminsul import was today.',
    };
  });

  describe('empty state', () => {
    it('shows the empty state when there are no campaigns', () => {
      renderPage();

      expect(screen.getByText('No targets yet')).toBeInTheDocument();
      expect(screen.getByText(/create a pull, build, or team target/i)).toBeInTheDocument();
    });

    it('shows the create form even with no campaigns', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'New Target' })).toBeInTheDocument();
      expect(screen.getByLabelText('Target type')).toBeInTheDocument();
    });

    it('prompts for an account import when freshness is missing', () => {
      mocks.dataFreshness = {
        status: 'missing',
        latestImport: null,
        daysSinceImport: null,
        label: 'Import account data',
        detail: 'No import found.',
      };

      renderPage();

      expect(screen.getByText('Import needed')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /import account data/i })).toHaveAttribute(
        'href',
        '/roster?import=irminsul'
      );
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

    it('keeps campaign creation behind a button for returning users', async () => {
      const user = userEvent.setup();
      mocks.campaigns = [activeCampaign];

      renderPage();

      expect(screen.queryByRole('heading', { name: 'New Target' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /new target/i }));

      expect(screen.getByRole('heading', { name: 'New Target' })).toBeInTheDocument();
    });

    it('renders multiple campaigns', () => {
      mocks.campaigns = [activeCampaign, pausedCampaign];
      renderPage();

      expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
      expect(screen.getByText('Bench Warmer')).toBeInTheDocument();
    });

    it('sorts open campaigns by blocked plan state before lower-risk campaigns', () => {
      const blockedCampaign = {
        ...activeCampaign,
        id: 'campaign-blocked',
        name: 'Blocked Materials',
        priority: 2,
      };
      mocks.campaigns = [activeCampaign, blockedCampaign];
      mocks.plans = {
        'campaign-1': campaignPlan,
        'campaign-blocked': {
          ...campaignPlan,
          campaignId: 'campaign-blocked',
          overallPercent: 20,
          status: 'blocked',
        },
      };

      renderPage();

      const blocked = screen.getByText('Blocked Materials');
      const attention = screen.getByText('Recruit Furina');
      expect(
        blocked.compareDocumentPosition(attention) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
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

      expect(screen.getByText(/failed to delete target/i)).toBeInTheDocument();
    });
  });

  describe('campaign creation', () => {
    it('applies character campaign prefill from the URL', () => {
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0&copies=2&budget=150&priority=1&deadline=2026-06-01');

      expect(screen.getByText('Target draft')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Recruit Furina' })).toBeInTheDocument();
      expect(screen.getByLabelText('Target type')).toHaveValue('character-acquisition');
      expect(screen.getByLabelText('Target character')).toHaveValue('Furina');
      expect(screen.getByLabelText('Build goal')).toHaveValue('full');
      expect(screen.getByLabelText('Priority')).toHaveValue('1');
      expect(screen.getByLabelText('Deadline')).toHaveValue('2026-06-01');
      expect(screen.getByLabelText('Copies')).toHaveValue(2);
      expect(screen.getByLabelText('Pull budget')).toHaveValue(150);
      expect(screen.getByLabelText('Include pull plan')).not.toBeChecked();
    });

    it('applies owned character polish prefill from the URL', () => {
      renderPage('/campaigns?type=character-polish&character=Furina&buildGoal=full&pullPlan=0&priority=2');

      expect(screen.getByText('Target draft')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Polish Furina' })).toBeInTheDocument();
      expect(screen.getByLabelText('Target type')).toHaveValue('character-polish');
      expect(screen.getByLabelText('Owned character')).toHaveValue('Furina');
      expect(screen.getByLabelText('Build goal')).toHaveValue('full');
      expect(screen.getByLabelText('Copies')).toBeDisabled();
      expect(screen.queryByLabelText('Include pull plan')).not.toBeInTheDocument();
    });

    it('creates an owned character polish campaign without pull targets', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?type=character-polish&character=Furina&buildGoal=full&pullPlan=0&priority=2');

      await user.click(screen.getByRole('button', { name: /create draft/i }));

      expect(mocks.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'character-polish',
          name: 'Polish Furina',
          priority: 2,
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
      expect(await screen.findByText('Target detail')).toBeInTheDocument();
    });

    it('creates a prefilled character campaign from the draft card', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=1&copies=2&budget=150&priority=1');

      await user.click(screen.getByRole('button', { name: /create draft/i }));

      expect(mocks.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'character-acquisition',
          name: 'Recruit Furina',
          priority: 1,
          characterTargets: [
            expect.objectContaining({
              characterKey: 'Furina',
              buildGoal: 'full',
              ownership: 'owned',
            }),
          ],
          pullTargets: [
            expect.objectContaining({
              itemKey: 'Furina',
              desiredCopies: 2,
              maxPullBudget: 150,
            }),
          ],
        })
      );
      expect(await screen.findByText('Target detail')).toBeInTheDocument();
    });

    it('preserves unreleased character names from banner prefill links', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Columbina&buildGoal=comfortable&pullPlan=1&priority=1');

      expect(screen.getByRole('heading', { name: 'Recruit Columbina' })).toBeInTheDocument();
      expect(screen.getByLabelText('Target character')).toHaveValue('Columbina');

      await user.click(screen.getByRole('button', { name: /create draft/i }));

      expect(mocks.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Recruit Columbina',
          characterTargets: [
            expect.objectContaining({
              characterKey: 'Columbina',
              ownership: 'wishlist',
            }),
          ],
          pullTargets: [
            expect.objectContaining({
              itemKey: 'Columbina',
            }),
          ],
        })
      );
    });

    it('creates a constellation chase campaign from the prefilled draft card', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Furina&buildGoal=comfortable&pullPlan=1&copies=1&constellation=2');

      expect(screen.getByRole('heading', { name: 'Chase C2 Furina' })).toBeInTheDocument();
      expect(screen.getByText('C2 target')).toBeInTheDocument();
      expect(screen.getByLabelText('Target constellation')).toHaveValue(2);

      await user.click(screen.getByRole('button', { name: /create draft/i }));

      expect(mocks.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'character-acquisition',
          name: 'Chase C2 Furina',
          notes: 'Target constellation: C2.',
          characterTargets: [
            expect.objectContaining({
              characterKey: 'Furina',
              ownership: 'owned',
              notes: 'Target constellation C2',
            }),
          ],
          pullTargets: [
            expect.objectContaining({
              itemKey: 'Furina',
              desiredCopies: 1,
              notes: 'Target constellation C2',
            }),
          ],
        })
      );
    });

    it('points prefilled duplicate character campaigns to the existing campaign', () => {
      mocks.campaigns = [activeCampaign];

      renderPage('/campaigns?character=Furina&buildGoal=comfortable&pullPlan=1');

      expect(screen.getByText('Existing target found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /open existing/i })).toHaveAttribute(
        'href',
        '/campaigns/campaign-1'
      );
      expect(screen.getByRole('button', { name: /create anyway/i })).toBeInTheDocument();
    });

    it('does not treat a generic character campaign as a duplicate constellation chase', () => {
      mocks.campaigns = [activeCampaign];

      renderPage('/campaigns?character=Furina&buildGoal=comfortable&pullPlan=1&copies=1&constellation=2');

      expect(screen.queryByText('Existing target found')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create draft/i })).toBeInTheDocument();
    });

    it('clears the campaign draft without clearing the editable form values', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0');

      expect(screen.getByText('Target draft')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /clear draft/i }));

      expect(screen.queryByText('Target draft')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Target character')).toHaveValue('Furina');
    });

    it('omits pull targets when the prefill disables pull planning', async () => {
      const user = userEvent.setup();
      renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0');

      await user.click(screen.getByRole('button', { name: /create target/i }));

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
      expect(await screen.findByText('Target detail')).toBeInTheDocument();
    });

    it('applies team campaign prefill from the URL', () => {
      renderPage('/campaigns?team=team-1&buildGoal=functional');

      expect(screen.getByText('Target draft')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Polish Salon Core' })).toBeInTheDocument();
      expect(screen.getByLabelText('Target type')).toHaveValue('team-polish');
      expect(screen.getByLabelText('Target team')).toHaveValue('team-1');
      expect(screen.getByLabelText('Build goal')).toHaveValue('functional');
    });

    it('points prefilled duplicate team campaigns to the existing campaign', () => {
      mocks.campaigns = [
        {
          ...activeCampaign,
          id: 'team-campaign',
          type: 'team-polish',
          name: 'Polish Salon Core',
          teamTarget: {
            teamId: 'team-1',
            name: 'Salon Core',
            memberKeys: ['Furina'],
          },
          pullTargets: [],
        },
      ];

      renderPage('/campaigns?team=team-1&buildGoal=functional');

      expect(screen.getByText('Existing target found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /open existing/i })).toHaveAttribute(
        'href',
        '/campaigns/team-campaign'
      );
    });

    it('shows validation error for missing team selection', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.selectOptions(screen.getByLabelText('Target type'), 'team-polish');
      await user.click(screen.getByRole('button', { name: /create target/i }));

      expect(screen.getByText(/choose a team/i)).toBeInTheDocument();
      expect(mocks.createCampaign).not.toHaveBeenCalled();
    });

    it('shows error feedback when creation fails', async () => {
      const user = userEvent.setup();
      mocks.createCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      await user.click(screen.getByRole('button', { name: /create target/i }));

      expect(screen.getByText(/failed to create target/i)).toBeInTheDocument();
    });

    it('navigates to detail page after successful creation', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /create target/i }));

      expect(await screen.findByText('Target detail')).toBeInTheDocument();
    });
  });
});
