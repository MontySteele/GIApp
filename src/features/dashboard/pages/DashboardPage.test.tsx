import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import DashboardPage from './DashboardPage';
import type { Campaign } from '@/types';

const updateChecklistMock = vi.hoisted(() => vi.fn());
const mocks = vi.hoisted(() => ({
  characters: [] as Array<Record<string, unknown>>,
  artifacts: { total: 150, fiveStar: 100 },
  weapons: { total: 50, fiveStars: 10 },
  teams: [] as Array<Record<string, unknown>>,
  campaigns: [] as Campaign[],
  wishlist: [] as Array<Record<string, unknown>>,
  plannedBanners: [] as Array<Record<string, unknown>>,
  wishHistoryCount: 2,
  latestImport: {
    id: 'import-1',
    source: 'GOOD',
    importedAt: new Date().toISOString(),
    characterCount: 3,
    artifactCount: 150,
    weaponCount: 50,
    materialCount: 0,
  } as Record<string, unknown> | null,
  availablePulls: {
    availablePulls: 118,
    pullAvailability: {
      eventPulls: 118,
      standardPulls: 0,
      allWishes: 118,
      currencyPulls: 93,
      starglitterPulls: 0,
    },
    resources: {
      primogems: 15000,
      genesisCrystals: 0,
      intertwined: 25,
      acquaint: 0,
      starglitter: 0,
    },
    lastUpdated: '2026-05-03T12:56:42.000Z',
    hasSnapshot: true,
  },
}));

vi.mock('../components/TodayFarmingWidget', () => ({
  default: ({ suppressFreshnessCallout }: { suppressFreshnessCallout?: boolean }) => (
    <div data-testid="today-farming-widget">
      TodayFarmingWidget {suppressFreshnessCallout ? 'freshness suppressed' : 'freshness visible'}
    </div>
  ),
}));

vi.mock('../components/DashboardCampaignFocus', () => ({
  default: ({ resumeAction }: { resumeAction: { title: string; href: string; actionLabel: string } }) => (
    <section aria-label="Next up" data-testid="dashboard-next-up">
      <h2>Next Up</h2>
      <p>{resumeAction.title}</p>
      <a href={resumeAction.href}>{resumeAction.actionLabel}</a>
    </section>
  ),
}));

vi.mock('@/features/ledger/components/QuickResourceLogger', () => ({
  default: ({ variant }: { variant?: string }) => (
    <div data-testid="quick-resource-logger">QuickResourceLogger {variant}</div>
  ),
}));

vi.mock('@/features/targets/components/TargetQuickStart', () => ({
  default: () => <div data-testid="target-quick-start">Full Start Target Wizard</div>,
}));

vi.mock('@/components/common/GettingStartedChecklist', () => ({
  default: () => <div data-testid="getting-started-checklist">GettingStartedChecklist</div>,
}));

vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: () => ({
    teams: mocks.teams,
    isLoading: false,
  }),
}));

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboardingContext: () => ({
    isComplete: true,
    showWizard: false,
    checklist: {
      hasImportedCharacters: false,
      hasCreatedTeam: false,
      hasVisitedPlanner: false,
      hasImportedWishHistory: false,
    },
    checklistProgress: 4,
    checklistTotal: 4,
    isChecklistComplete: true,
    completeOnboarding: vi.fn(),
    resetOnboarding: vi.fn(),
    openWizard: vi.fn(),
    closeWizard: vi.fn(),
    updateChecklist: updateChecklistMock,
  }),
}));

vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: mocks.characters,
    isLoading: false,
  }),
}));

vi.mock('@/features/artifacts/hooks/useArtifacts', () => ({
  useArtifacts: () => ({
    stats: mocks.artifacts,
    isLoading: false,
  }),
}));

vi.mock('@/features/weapons/hooks/useWeapons', () => ({
  useWeapons: () => ({
    stats: mocks.weapons,
    isLoading: false,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: mocks.campaigns,
    activeCampaigns: mocks.campaigns.filter((campaign) => campaign.status === 'active'),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

vi.mock('@/lib/services/resourceService', () => ({
  getAvailablePullsFromTracker: vi.fn(),
}));

vi.mock('@/stores/wishlistStore', () => ({
  useWishlistStore: () => mocks.wishlist,
}));

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

function character(overrides: Record<string, unknown> = {}) {
  return {
    id: 'character-furina',
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 0,
    talent: { auto: 9, skill: 10, burst: 10 },
    weapon: { key: 'Splendor', level: 90, ascension: 6, refinement: 1 },
    artifacts: Array.from({ length: 5 }, (_, index) => ({ slotKey: `slot-${index}` })),
    notes: '',
    priority: 'main',
    teamIds: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-furina',
    type: 'character-acquisition',
    name: 'Pull Furina',
    status: 'active',
    priority: 1,
    deadline: '2099-06-01',
    pullTargets: [
      {
        id: 'pull-furina',
        itemKey: 'Furina',
        itemType: 'character',
        bannerType: 'character',
        desiredCopies: 1,
        maxPullBudget: 80,
        isConfirmed: true,
      },
    ],
    characterTargets: [
      {
        id: 'target-furina',
        characterKey: 'Furina',
        ownership: 'wishlist',
        buildGoal: 'functional',
      },
    ],
    notes: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.characters = [character(), character({ id: 'character-kazuha', key: 'Kazuha', constellation: 6 })];
    mocks.artifacts = { total: 150, fiveStar: 100 };
    mocks.weapons = { total: 50, fiveStars: 10 };
    mocks.teams = [];
    mocks.campaigns = [];
    mocks.wishlist = [];
    mocks.plannedBanners = [];
    mocks.wishHistoryCount = 2;
    mocks.latestImport = {
      id: 'import-1',
      source: 'GOOD',
      importedAt: new Date().toISOString(),
    };
    mocks.availablePulls = {
      availablePulls: 118,
      pullAvailability: {
        eventPulls: 118,
        standardPulls: 0,
        allWishes: 118,
        currencyPulls: 93,
        starglitterPulls: 0,
      },
      resources: {
        primogems: 15000,
        genesisCrystals: 0,
        intertwined: 25,
        acquaint: 0,
        starglitter: 0,
      },
      lastUpdated: '2026-05-03T12:56:42.000Z',
      hasSnapshot: true,
    };
    mockLocalStorage.getItem.mockReturnValue(null);
    vi.mocked(useLiveQuery).mockImplementation((query: unknown) => {
      const source = String(query);
      if (source.includes('getAvailablePullsFromTracker')) return mocks.availablePulls;
      if (source.includes('wishRecords.count')) return mocks.wishHistoryCount;
      if (source.includes('upcomingWishRepo')) return mocks.plannedBanners;
      if (source.includes('importRecordRepo')) return mocks.latestImport;
      return undefined;
    });
  });

  it('renders a compact command center with capture and subtle fresh status', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-next-up')).toHaveTextContent('Start your first target');
    expect(screen.getByRole('heading', { name: /capture \+ snapshot/i })).toBeInTheDocument();
    expect(screen.getByTestId('quick-resource-logger')).toHaveTextContent('embedded');
    expect(screen.getByRole('link', { name: /account data current/i })).toHaveAttribute('href', '/imports');
  });

  it('keeps capture snapshot routes and resin details wired', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => (
      key === 'resinBudget'
        ? JSON.stringify({
            currentResin: 100,
            maxResin: 200,
            lastUpdated: Date.now(),
            fragileResin: 10,
          })
        : null
    ));

    renderPage();

    expect(screen.getByRole('link', { name: /2 characters/i })).toHaveAttribute('href', '/roster');
    expect(screen.getByRole('link', { name: /118 event pulls/i })).toHaveAttribute('href', '/pulls');
    expect(screen.getByRole('link', { name: /150 artifacts/i })).toHaveAttribute('href', '/roster/artifacts');
    expect(screen.getByRole('link', { name: /50 weapons/i })).toHaveAttribute('href', '/roster/weapons');
    expect(screen.getByRole('link', { name: /resin.*roster/i })).toHaveAttribute('href', '/roster/planner');
    expect(screen.getByText(/\+10 fragile resin available/i)).toBeInTheDocument();
  });

  it('promotes import setup before target creation when there is no data', () => {
    mocks.characters = [];
    mocks.artifacts = { total: 0, fiveStar: 0 };
    mocks.weapons = { total: 0, fiveStars: 0 };
    mocks.wishHistoryCount = 0;
    mocks.latestImport = null;
    mocks.availablePulls = {
      ...mocks.availablePulls,
      availablePulls: 0,
      resources: {
        primogems: 0,
        genesisCrystals: 0,
        intertwined: 0,
        acquaint: 0,
        starglitter: 0,
      },
    };

    renderPage();

    const nextUp = screen.getByTestId('dashboard-next-up');
    expect(nextUp).toHaveTextContent('Import your roster');
    expect(within(nextUp).getByRole('link', { name: /open import hub/i })).toHaveAttribute('href', '/imports');
    expect(screen.queryByTestId('target-quick-start')).not.toBeInTheDocument();
    expect(screen.getByText('No targets yet')).toBeInTheDocument();
  });

  it('promotes pull setup when roster data exists but wishes are missing', () => {
    mocks.wishHistoryCount = 0;

    renderPage();

    const nextUp = screen.getByTestId('dashboard-next-up');
    expect(nextUp).toHaveTextContent('Add pity or wishes');
    expect(within(nextUp).getByRole('link', { name: /set up pulls/i })).toHaveAttribute('href', '/imports');
    expect(screen.getByTestId('target-quick-start')).toBeInTheDocument();
  });

  it('uses compact target entry when an active pull target exists', () => {
    mocks.campaigns = [campaign()];

    renderPage();

    expect(screen.queryByTestId('target-quick-start')).not.toBeInTheDocument();
    expect(screen.getByText('Start another target')).toBeInTheDocument();
    expect(screen.getByText('1 active target already in motion.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new target/i })).toHaveAttribute('href', '/campaigns');
  });

  it('prioritizes stale imports over starting another build target', () => {
    mocks.campaigns = [
      campaign({
        id: 'campaign-build-furina',
        type: 'character-polish',
        name: 'Build Furina',
        pullTargets: [],
        characterTargets: [
          {
            id: 'target-build-furina',
            characterKey: 'Furina',
            ownership: 'owned',
            buildGoal: 'comfortable',
          },
        ],
      }),
    ];
    mocks.latestImport = {
      id: 'import-stale',
      source: 'GOOD',
      importedAt: '2026-04-01T12:00:00.000Z',
    };

    renderPage();

    const nextUp = screen.getByTestId('dashboard-next-up');
    expect(nextUp).toHaveTextContent('Refresh account data');
    expect(screen.queryByRole('link', { name: /account data current/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Refresh before adding targets')).not.toBeInTheDocument();
    expect(within(nextUp).getByRole('link', { name: /refresh import/i })).toHaveAttribute('href', '/imports');
    expect(screen.getByTestId('today-farming-widget')).toHaveTextContent('freshness suppressed');
  });

  it('keeps many targets scannable instead of reopening the full wizard', () => {
    mocks.campaigns = Array.from({ length: 5 }, (_, index) =>
      campaign({
        id: `campaign-${index}`,
        name: `Target ${index + 1}`,
        priority: (Math.min(index + 1, 5) as Campaign['priority']),
      })
    );

    renderPage();

    expect(screen.getByText('5 active targets already in motion.')).toBeInTheDocument();
    const targetsPanel = screen.getByRole('heading', { name: 'Targets' }).closest('section');
    expect(targetsPanel).not.toBeNull();
    expect(within(targetsPanel as HTMLElement).getByText('Target 1')).toBeInTheDocument();
    expect(within(targetsPanel as HTMLElement).getByText('Total')).toBeInTheDocument();
  });

  it('keeps core panels present at a mobile-sized viewport', () => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));

    renderPage();

    expect(screen.getByTestId('dashboard-next-up')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /capture \+ snapshot/i })).toBeInTheDocument();
    expect(screen.getByTestId('today-farming-widget')).toBeInTheDocument();
  });

  it('marks wish history imported when records already exist', () => {
    renderPage();

    expect(updateChecklistMock).toHaveBeenCalledWith({ hasImportedCharacters: true });
    expect(updateChecklistMock).toHaveBeenCalledWith({ hasImportedWishHistory: true });
  });
});
