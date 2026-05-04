import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignDetailPage from './CampaignDetailPage';
import type { Campaign } from '@/types';
import type { CampaignPlan } from '../domain/campaignPlan';

const mocks = vi.hoisted(() => ({
  updateCampaign: vi.fn(),
  campaigns: [] as unknown[],
  plans: {} as Record<string, unknown>,
}));

vi.mock('../hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: mocks.campaigns,
    updateCampaign: mocks.updateCampaign,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: mocks.plans,
    isLoading: false,
    isCalculating: false,
    error: null,
  }),
}));

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
        missing: ['Skill 6/8'],
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/campaigns/campaign-1']}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
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
    mocks.campaigns = [campaign];
    mocks.plans = { 'campaign-1': plan };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('elevates the top next action into a focus panel', () => {
    renderPage();

    expect(screen.getByText('Focus')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Save 20 more pulls' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open pulls/i })[0]).toHaveAttribute('href', '/pulls');
  });

  it('links next actions to the relevant workspace', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /open materials/i })).toHaveAttribute(
      'href',
      '/planner/materials'
    );
    expect(screen.getByRole('link', { name: /open character/i })).toHaveAttribute(
      'href',
      '/roster/furina-id'
    );
  });

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

  it('saves campaign setup edits without recreating the campaign', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit setup/i }));
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Furina build goal'), { target: { value: 'full' } });
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
});
