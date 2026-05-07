import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MaterialsTab from './MaterialsTab';
import type { Campaign } from '@/types';
import type { CampaignPlan } from '@/features/campaigns/domain/campaignPlan';
import type { MaterialRequirement } from '../domain/ascensionCalculator';
import type { AggregatedMaterialSummary, GroupedMaterials } from '../domain/multiCharacterCalculator';

const mocks = vi.hoisted(() => ({
  campaigns: [] as Campaign[],
  campaignPlans: {} as Record<string, CampaignPlan>,
  loadingCampaigns: false,
  loadingCampaignPlans: false,
  calculatingCampaignPlans: false,
  materials: {} as Record<string, number>,
  setMaterial: vi.fn(),
  multiSummary: null as AggregatedMaterialSummary | null,
  dataFreshness: {
    status: 'fresh',
    latestImport: null,
    daysSinceImport: 0,
    label: 'Account data current',
    detail: 'Last Irminsul import was today.',
  },
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => ({
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
  }),
}));

vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: [],
    isLoading: false,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: mocks.campaigns,
    isLoading: mocks.loadingCampaigns,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: mocks.campaignPlans,
    isLoading: mocks.loadingCampaignPlans,
    isCalculating: mocks.calculatingCampaignPlans,
    error: null,
  }),
}));

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.dataFreshness,
}));

vi.mock('../hooks/useMaterials', () => ({
  useMaterials: () => ({
    materials: mocks.materials,
    isLoading: false,
    hasMaterials: true,
    totalMaterialTypes: Object.keys(mocks.materials).length,
    setMaterial: mocks.setMaterial,
  }),
}));

vi.mock('../hooks/useMultiCharacterPlan', () => ({
  useMultiCharacterPlan: () => ({
    summary: mocks.multiSummary,
    isCalculating: false,
    calculationError: null,
  }),
}));

const emptyGroupedMaterials: GroupedMaterials = {
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
};

const moraRequirement: MaterialRequirement = {
  key: 'Mora',
  name: 'Mora',
  category: 'mora',
  required: 1000,
  owned: 200,
  deficit: 800,
};

function createMaterialSummary(materials: MaterialRequirement[]): AggregatedMaterialSummary {
  return {
    characterSummaries: [],
    aggregatedMaterials: materials,
    groupedMaterials: {
      ...emptyGroupedMaterials,
      mora: materials.filter((material) => material.category === 'mora'),
      talent: materials.filter((material) => material.category === 'talent'),
      weapon: materials.filter((material) => material.category === 'weapon'),
      artifact: materials.filter((material) => material.category === 'artifact'),
    },
    totalMora: materials
      .filter((material) => material.category === 'mora')
      .reduce((sum, material) => sum + material.required, 0),
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
  };
}

function createCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
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
    ...overrides,
  };
}

function createCampaignPlan(summary: AggregatedMaterialSummary): CampaignPlan {
  return {
    campaignId: 'campaign-1',
    overallPercent: 50,
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
      percent: 60,
      status: 'attention',
      characters: [],
    },
    materialReadiness: {
      hasTargets: true,
      percent: 20,
      status: 'blocked',
      totalMaterials: summary.aggregatedMaterials.length,
      readyMaterials: summary.aggregatedMaterials.filter((material) => material.deficit === 0).length,
      deficitMaterials: summary.aggregatedMaterials.filter((material) => material.deficit > 0).length,
      topDeficits: summary.aggregatedMaterials.filter((material) => material.deficit > 0),
      totalEstimatedResin: summary.totalEstimatedResin,
      totalEstimatedDays: summary.totalEstimatedDays,
      summary,
      errors: [],
    },
    nextActions: [],
  };
}

function renderMaterialsTab(initialEntry = '/planner/materials') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MaterialsTab />
    </MemoryRouter>
  );
}

function closestHighlightedRow(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.className.includes('ring-primary-400')) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

describe('MaterialsTab campaign context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.campaigns = [];
    mocks.campaignPlans = {};
    mocks.loadingCampaigns = false;
    mocks.loadingCampaignPlans = false;
    mocks.calculatingCampaignPlans = false;
    mocks.materials = { Mora: 200 };
    mocks.multiSummary = createMaterialSummary([]);
    mocks.dataFreshness = {
      status: 'fresh',
      latestImport: null,
      daysSinceImport: 0,
      label: 'Account data current',
      detail: 'Last Irminsul import was today.',
    };
  });

  it('uses the campaign material plan when campaign and material query params are present', () => {
    const campaign = createCampaign();
    const summary = createMaterialSummary([moraRequirement]);
    mocks.campaigns = [campaign];
    mocks.campaignPlans = {
      'campaign-1': createCampaignPlan(summary),
    };

    renderMaterialsTab('/planner/materials?campaign=campaign-1&material=Mora');

    expect(screen.getByText('Campaign material plan for Recruit Furina')).toBeInTheDocument();
    expect(screen.getByText('Focused on Mora: 800 still needed.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Campaign Deficits' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Campaign Materials' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Campaign' })).toHaveAttribute(
      'href',
      '/campaigns/campaign-1'
    );
    expect(screen.getByRole('link', { name: 'Priority Materials' })).toHaveAttribute(
      'href',
      '/planner/materials'
    );

    const deficitText = screen.getByText('Need 800 more');
    expect(closestHighlightedRow(deficitText)).not.toBeNull();
  });

  it('shows stale import context before campaign material recommendations', () => {
    const campaign = createCampaign();
    mocks.campaigns = [campaign];
    mocks.campaignPlans = {
      'campaign-1': createCampaignPlan(createMaterialSummary([moraRequirement])),
    };
    mocks.dataFreshness = {
      status: 'stale',
      latestImport: null,
      daysSinceImport: 14,
      label: 'Refresh account data',
      detail: 'Last Irminsul import was 14 days ago.',
    };

    renderMaterialsTab('/planner/materials?campaign=campaign-1&material=Mora');

    expect(screen.getByText('Data stale')).toBeInTheDocument();
    expect(screen.getByText(/material deficits and resin estimates/i)).toBeInTheDocument();
  });

  it('warns and falls back to priority materials when the campaign cannot be found', () => {
    mocks.multiSummary = createMaterialSummary([moraRequirement]);

    renderMaterialsTab('/planner/materials?campaign=missing-campaign&material=Mora');

    expect(screen.getByText('Campaign not found')).toBeInTheDocument();
    expect(screen.getByText('Showing priority character materials instead.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Priority Deficits' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'All Required Materials' })).toBeInTheDocument();
  });
});
