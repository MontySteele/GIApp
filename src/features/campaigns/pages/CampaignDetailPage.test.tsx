import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignDetailPage from './CampaignDetailPage';
import type { Campaign, Character } from '@/types';
import type { CampaignPlan } from '../domain/campaignPlan';

const mocks = vi.hoisted(() => ({
  updateCampaign: vi.fn(),
  campaigns: [] as unknown[],
  characters: [] as Character[],
  plans: {} as Record<string, unknown>,
  isLoading: false,
  plansLoading: false,
  plansCalculating: false,
  planError: null as string | null,
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
    updateCampaign: mocks.updateCampaign,
    isLoading: mocks.isLoading,
  }),
}));

vi.mock('../hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: mocks.plans,
    isLoading: mocks.plansLoading,
    isCalculating: mocks.plansCalculating,
    error: mocks.planError,
  }),
}));

vi.mock('../hooks/useCampaignPlanContext', () => ({
  useCampaignPlanContext: () => ({
    context: {
      characters: mocks.characters,
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
    characters: mocks.characters,
    isLoading: false,
    charactersLoading: false,
    materialsLoading: false,
    availablePullsLoading: false,
  }),
}));

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.dataFreshness,
}));

const ownedFurina: Character = {
  id: 'furina-id',
  key: 'Furina',
  level: 80,
  ascension: 6,
  constellation: 0,
  talent: {
    auto: 1,
    skill: 6,
    burst: 8,
  },
  weapon: {
    key: 'fleuveCendreFerryman',
    level: 90,
    ascension: 6,
    refinement: 5,
  },
  artifacts: [],
  notes: '',
  priority: 'main',
  teamIds: ['team-1'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const campaign: Campaign = {
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
      maxPullBudget: 120,
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
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const teamCampaign: Campaign = {
  ...campaign,
  type: 'team-polish',
  name: 'Polish Salon Team',
  pullTargets: [],
  teamTarget: {
    teamId: 'team-1',
    name: 'Salon Team',
    memberKeys: ['Furina'],
  },
};

const plan: CampaignPlan = {
  campaignId: 'campaign-1',
  overallPercent: 62,
  status: 'attention',
  pullReadiness: {
    hasTargets: true,
    availablePulls: 100,
    targetPulls: 120,
    remainingPulls: 20,
    percent: 83,
    status: 'attention',
  },
  buildReadiness: {
    targetCount: 1,
    ownedCount: 1,
    percent: 60,
    status: 'attention',
    characters: [
      {
        characterKey: 'Furina',
        characterId: 'furina-id',
        owned: true,
        buildGoal: 'comfortable',
        percent: 60,
        buildIntentSource: 'team',
        buildTemplateId: 'template-furina-salon',
        buildTemplateName: 'Salon Sub-DPS',
        targetWeaponKey: 'SplendorOfTranquilWaters',
        missing: ['Skill 6/8'],
        artifactScore: 72,
        artifactGrade: 'A',
        artifactFitPercent: 80,
        hasBuildRecommendation: true,
      },
    ],
  },
  materialReadiness: {
    hasTargets: true,
    percent: 50,
    status: 'attention',
    totalMaterials: 2,
    readyMaterials: 1,
    deficitMaterials: 1,
    topDeficits: [
      {
        key: 'Mora',
        name: 'Mora',
        category: 'mora',
        required: 1000,
        owned: 200,
        deficit: 800,
      },
      {
        key: 'Guide to Equity',
        name: 'Guide to Equity',
        category: 'talent',
        tier: 2,
        required: 20,
        owned: 8,
        deficit: 12,
        source: 'Fontaine',
        availability: ['Monday', 'Thursday', 'Sunday'],
      },
      {
        key: 'Guide to Justice',
        name: 'Guide to Justice',
        category: 'talent',
        tier: 2,
        required: 18,
        owned: 6,
        deficit: 12,
        source: 'Fontaine',
        availability: ['Tuesday', 'Friday', 'Sunday'],
      },
    ],
    totalEstimatedResin: 120,
    totalEstimatedDays: 1,
    summary: {
      characterSummaries: [],
      aggregatedMaterials: [
        {
          key: 'Mora',
          name: 'Mora',
          category: 'mora',
          required: 1000,
          owned: 200,
          deficit: 800,
        },
        {
          key: 'Guide to Equity',
          name: 'Guide to Equity',
          category: 'talent',
          tier: 2,
          required: 20,
          owned: 8,
          deficit: 12,
          source: 'Fontaine',
          availability: ['Monday', 'Thursday', 'Sunday'],
        },
        {
          key: 'Guide to Justice',
          name: 'Guide to Justice',
          category: 'talent',
          tier: 2,
          required: 18,
          owned: 6,
          deficit: 12,
          source: 'Fontaine',
          availability: ['Tuesday', 'Friday', 'Sunday'],
        },
      ],
      groupedMaterials: {
        mora: [],
        exp: [],
        boss: [],
        gem: [],
        localSpecialty: [],
        common: [],
        talent: [],
        weapon: [],
        artifact: [],
        weekly: [],
        crown: [],
      },
      totalMora: 1000,
      totalExp: 0,
      totalEstimatedResin: 120,
      resinBreakdown: {
        talentBoss: 0,
        expMora: 120,
        total: 120,
      },
      totalEstimatedDays: 1,
      allCanAscend: false,
      anyStale: false,
      errors: [],
    },
    errors: [],
  },
  nextActions: [
    {
      id: 'campaign-1-pulls',
      category: 'pulls',
      label: 'Save 20 more pulls',
      detail: '100/120 pulls ready for campaign targets.',
      priority: 1,
    },
    {
      id: 'campaign-1-material-Mora-base',
      category: 'materials',
      label: 'Farm Mora',
      detail: '800 still needed.',
      priority: 2,
      materialKey: 'Mora',
    },
    {
      id: 'campaign-1-build-Furina',
      category: 'build',
      label: 'Improve Furina',
      detail: 'Skill 6/8',
      priority: 3,
      characterKey: 'Furina',
    },
  ],
};

function renderPage(route = '/campaigns/campaign-1') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/campaigns" element={<div>Campaigns list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignDetailPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-08T12:00:00'));
    vi.clearAllMocks();
    mocks.updateCampaign.mockResolvedValue(undefined);
    mocks.characters = [ownedFurina];
    mocks.campaigns = [campaign];
    mocks.plans = { 'campaign-1': plan };
    mocks.isLoading = false;
    mocks.plansLoading = false;
    mocks.plansCalculating = false;
    mocks.planError = null;
    mocks.dataFreshness = {
      status: 'fresh',
      latestImport: null,
      daysSinceImport: 0,
      label: 'Account data current',
      detail: 'Last Irminsul import was today.',
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading and not-found states', () => {
    it('shows loading indicator while campaigns are loading', () => {
      mocks.isLoading = true;
      renderPage();

      expect(screen.getByText('Loading target...')).toBeInTheDocument();
    });

    it('shows not-found state for a nonexistent campaign', () => {
      mocks.campaigns = [];
      renderPage();

      expect(screen.getByText('Target not found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to targets/i })).toBeInTheDocument();
    });

    it('shows not-found for mismatched campaign ID', () => {
      mocks.campaigns = [campaign];
      renderPage('/campaigns/nonexistent-id');

      expect(screen.getByText('Target not found')).toBeInTheDocument();
    });
  });

  describe('header and metadata', () => {
    it('displays campaign name and status badges', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Recruit Furina' })).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getAllByText('P1').length).toBeGreaterThan(0);
    });

    it('shows breadcrumb navigation', () => {
      renderPage();

      expect(screen.getByText('Targets')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Targets' })).toHaveAttribute('href', '/campaigns');
    });

    it('shows overall readiness from plan', () => {
      renderPage();

      expect(screen.getByText('62% ready')).toBeInTheDocument();
    });
  });

  describe('focus action panel', () => {
    it('elevates the top next action into a focus panel', () => {
      renderPage();

      expect(screen.getByText('Focus')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Save 20 more pulls' })).toBeInTheDocument();
      const params = new URLSearchParams({
        mode: 'multi',
        campaign: 'campaign-1',
        name: 'Recruit Furina',
        pulls: '100',
        targetPulls: '120',
        shortfall: '20',
      });
      params.append('target', JSON.stringify({ name: 'Furina', banner: 'character', copies: 1 }));
      expect(screen.getAllByRole('link', { name: /open calculator/i })[0]).toHaveAttribute(
        'href',
        `/pulls/calculator?${params.toString()}`
      );
    });

    it('links next actions to the relevant workspace', () => {
      renderPage();

      expect(screen.getAllByRole('link', { name: /open materials/i })[0]).toHaveAttribute(
        'href',
        '/planner/materials?campaign=campaign-1&material=Mora'
      );
      expect(screen.getByRole('link', { name: /open character/i })).toHaveAttribute(
        'href',
        '/roster/furina-id'
      );
    });
  });

  describe('readiness cards', () => {
    it('shows all four readiness metrics', () => {
      renderPage();

      expect(screen.getByText('Overall')).toBeInTheDocument();
      expect(screen.getAllByText('62%').length).toBeGreaterThan(0);
      expect(screen.getByText('Pulls')).toBeInTheDocument();
      expect(screen.getAllByText('83%').length).toBeGreaterThan(0);
      expect(screen.getByText('Build')).toBeInTheDocument();
      expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
      expect(screen.getByText('Materials')).toBeInTheDocument();
      expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    });

    it('shows pull plan sidebar with target and available counts', () => {
      renderPage();

      expect(screen.getByText('Pull Plan')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('shows loading skeletons when plan is not ready', () => {
      mocks.plans = {};
      mocks.plansCalculating = true;
      renderPage();

      const pulseElements = document.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('shows plan calculation errors instead of a perpetual skeleton', () => {
      mocks.plans = {};
      mocks.planError = 'Material service unavailable';
      renderPage();

      expect(screen.getByText('Unable to calculate target plan')).toBeInTheDocument();
      expect(screen.getByText('Material service unavailable')).toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0);
    });
  });

  describe('build targets', () => {
    it('shows build target progress per character', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Build Targets' })).toBeInTheDocument();
      expect(screen.getAllByText('comfortable').length).toBeGreaterThan(0);
      expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Skill 6/8').length).toBeGreaterThan(0);
      expect(screen.getByText('Team template: Salon Sub-DPS')).toBeInTheDocument();
      expect(screen.getByText('Weapon: Splendor of Tranquil Waters')).toBeInTheDocument();
      expect(screen.getByText('Artifacts 72 A')).toBeInTheDocument();
      expect(screen.getByText('Fit 80%')).toBeInTheDocument();
    });
  });

  describe('material deficits', () => {
    it('shows deficit materials sorted by severity', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Material Deficits' })).toBeInTheDocument();
      expect(screen.getByText('800 short')).toBeInTheDocument();
      expect(screen.getByText('200 / 1,000')).toBeInTheDocument();
    });

    it('links deficit rows to the planner', () => {
      renderPage();

      const moraLink = screen.getByText('800 short').closest('a');
      expect(moraLink).toHaveAttribute(
        'href',
        '/planner/materials?campaign=campaign-1&material=Mora'
      );
    });

    it('shows resin and day estimates', () => {
      renderPage();

      expect(screen.getByText(/120 resin/)).toBeInTheDocument();
      expect(screen.getByText(/1 days/)).toBeInTheDocument();
    });
  });

  describe('farming windows', () => {
    it('shows campaign talent deficits by farming window', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: 'Farming Windows' })).toBeInTheDocument();
      expect(screen.getByText('Farm Equity (Fontaine) today.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /domain calendar/i })).toHaveAttribute(
        'href',
        '/planner/domains'
      );
      expect(screen.getByText('Farm Today')).toBeInTheDocument();
      expect(screen.getAllByText('Guide to Equity').length).toBeGreaterThan(0);
      expect(screen.getByText('Wait For')).toBeInTheDocument();
      expect(screen.getByText('Tuesday')).toBeInTheDocument();
      expect(screen.getAllByText('Guide to Justice').length).toBeGreaterThan(0);
    });
  });

  describe('data freshness banner', () => {
    it('shows a refresh prompt when campaign data is stale', () => {
      mocks.dataFreshness = {
        status: 'stale',
        latestImport: null,
        daysSinceImport: 10,
        label: 'Refresh account data',
        detail: 'Last Irminsul import was 10 days ago.',
      };
      renderPage();

      expect(screen.getByText('Data stale')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /refresh import/i })).toHaveAttribute(
        'href',
        '/roster?import=irminsul'
      );
    });

    it('shows import-needed banner when data is missing', () => {
      mocks.dataFreshness = {
        status: 'missing',
        latestImport: null,
        daysSinceImport: 0,
        label: 'Import your account data',
        detail: 'No Irminsul import found.',
      };
      renderPage();

      expect(screen.getByText('Import needed')).toBeInTheDocument();
    });

    it('hides the banner when data is fresh', () => {
      renderPage();

      expect(screen.queryByText('Data stale')).not.toBeInTheDocument();
      expect(screen.queryByText('Import needed')).not.toBeInTheDocument();
    });
  });

  describe('status transitions', () => {
    it('pauses an active campaign', async () => {
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'paused' });
    });

    it('activates a paused campaign', async () => {
      mocks.campaigns = [{ ...campaign, status: 'paused' }];
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /activate/i }));
      });

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'active' });
    });

    it('completes a campaign', async () => {
      renderPage();

      const buttons = screen.getAllByRole('button', { name: /complete/i });
      await act(async () => {
        fireEvent.click(buttons[0]);
      });

      expect(mocks.updateCampaign).toHaveBeenCalledWith('campaign-1', { status: 'completed' });
    });

    it('shows error feedback when status update fails', async () => {
      mocks.updateCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
      });

      expect(screen.getByText(/failed to update target status/i)).toBeInTheDocument();
    });
  });

  describe('campaign setup editing', () => {
    it('saves campaign setup edits without recreating the campaign', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /edit setup/i }));
      fireEvent.change(screen.getByLabelText('Priority'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Build goal'), { target: { value: 'full' } });
      fireEvent.change(screen.getByLabelText('Desired copies'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Pull budget'), { target: { value: '160' } });
      fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'C2 or bust' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save setup/i }));
      });

      expect(mocks.updateCampaign).toHaveBeenCalledWith(
        'campaign-1',
        expect.objectContaining({
          priority: 2,
          notes: 'C2 or bust',
          characterTargets: [
            expect.objectContaining({
              characterKey: 'Furina',
              buildGoal: 'full',
            }),
          ],
          pullTargets: [
            expect.objectContaining({
              desiredCopies: 2,
              maxPullBudget: 160,
            }),
          ],
        })
      );
    });

    it('cancels editing and reverts draft state', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /edit setup/i }));
      fireEvent.change(screen.getByLabelText('Priority'), { target: { value: '5' } });
      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      expect(screen.getAllByText('P1').length).toBeGreaterThan(0);
      expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument();
    });

    it('shows error feedback when save fails', async () => {
      mocks.updateCampaign.mockRejectedValueOnce(new Error('DB error'));
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /edit setup/i }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save setup/i }));
      });

      expect(screen.getByText(/failed to save target setup/i)).toBeInTheDocument();
    });

    it('lets team campaigns add wishlist targets to the campaign lineup', async () => {
      mocks.campaigns = [teamCampaign];
      mocks.plans = { 'campaign-1': plan };
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /edit setup/i }));
      fireEvent.change(screen.getByRole('combobox', { name: 'Add target' }), {
        target: { value: 'Lyney' },
      });
      fireEvent.mouseDown(screen.getByRole('option', { name: /Lyney/i }));
      fireEvent.click(screen.getByRole('button', { name: /add target/i }));
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save setup/i }));
      });

      expect(mocks.updateCampaign).toHaveBeenCalledWith(
        'campaign-1',
        expect.objectContaining({
          characterTargets: [
            expect.objectContaining({ characterKey: 'Furina' }),
            expect.objectContaining({
              characterKey: 'Lyney',
              ownership: 'wishlist',
            }),
          ],
          teamTarget: expect.objectContaining({
            memberKeys: ['Furina', 'Lyney'],
          }),
        })
      );
    });
  });

  describe('campaign without pull targets', () => {
    it('shows message when no pull targets exist', () => {
      mocks.campaigns = [teamCampaign];
      const noPullPlan = {
        ...plan,
        pullReadiness: {
          ...plan.pullReadiness,
          hasTargets: false,
          availablePulls: 0,
          targetPulls: 0,
          remainingPulls: 0,
          percent: 100,
        },
      };
      mocks.plans = { 'campaign-1': noPullPlan };
      renderPage();

      expect(screen.getByText(/not tied to a pull target/i)).toBeInTheDocument();
    });
  });
});
