import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import DashboardPage from './DashboardPage';

const updateChecklistMock = vi.hoisted(() => vi.fn());

// Mock child widgets that have their own async hooks
vi.mock('../components/TodayFarmingWidget', () => ({
  default: () => <div data-testid="today-farming-widget">TodayFarmingWidget</div>,
}));

vi.mock('../components/DashboardCampaignFocus', () => ({
  default: () => <div data-testid="dashboard-campaign-focus">DashboardCampaignFocus</div>,
}));

vi.mock('@/features/notes/components/QuickNotesWidget', () => ({
  default: () => <div data-testid="quick-notes-widget">QuickNotesWidget</div>,
}));

vi.mock('@/features/ledger/components/QuickResourceLogger', () => ({
  default: () => <div data-testid="quick-resource-logger">QuickResourceLogger</div>,
}));

vi.mock('@/features/targets/components/TargetQuickStart', () => ({
  default: () => <div data-testid="target-quick-start">TargetQuickStart</div>,
}));

vi.mock('@/features/targets/components/TargetSummaryList', () => ({
  default: () => <div data-testid="target-summary-list">TargetSummaryList</div>,
}));

vi.mock('@/components/common/GettingStartedChecklist', () => ({
  default: () => <div data-testid="getting-started-checklist">GettingStartedChecklist</div>,
}));

// Mock useTeams
vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: () => ({
    teams: [],
    isLoading: false,
  }),
}));

// Mock OnboardingContext
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
    checklistProgress: 0,
    checklistTotal: 4,
    isChecklistComplete: false,
    completeOnboarding: vi.fn(),
    resetOnboarding: vi.fn(),
    openWizard: vi.fn(),
    closeWizard: vi.fn(),
    updateChecklist: updateChecklistMock,
  }),
}));

// Mock all the hooks
vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: [
      { id: '1', key: 'Furina', level: 90, constellation: 6 },
      { id: '2', key: 'Neuvillette', level: 90, constellation: 0 },
      { id: '3', key: 'Kazuha', level: 80, constellation: 0 },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/features/artifacts/hooks/useArtifacts', () => ({
  useArtifacts: () => ({
    stats: { total: 150, fiveStar: 100 },
    isLoading: false,
  }),
}));

vi.mock('@/features/weapons/hooks/useWeapons', () => ({
  useWeapons: () => ({
    stats: { total: 50, fiveStars: 10 },
    isLoading: false,
  }),
}));

vi.mock('@/features/campaigns/hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: [],
    activeCampaigns: [],
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

vi.mock('@/features/notes/hooks/useGoals', () => ({
  useGoals: () => ({
    goals: [],
    allGoals: [],
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/features/notes/hooks/useNotes', () => ({
  useNotes: () => ({
    notes: [],
    allNotes: [],
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/stores/wishlistStore', () => ({
  useWishlistStore: () => [],
}));

// Mock localStorage for resin
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const mockAvailablePulls = {
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

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLiveQuery)
      .mockReset()
      .mockReturnValueOnce(mockAvailablePulls)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce([]);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/your targets, resources, and next action/i)).toBeInTheDocument();
    });

    it('renders all stat cards', () => {
      renderPage();

      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Artifacts')).toBeInTheDocument();
      expect(screen.getByText('Weapons')).toBeInTheDocument();
      // Event Pulls appears in both stat card and primogem card
      expect(screen.getAllByText('Event Pulls').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the resin status card', () => {
      renderPage();

      expect(screen.getByText('Resin')).toBeInTheDocument();
    });

    it('renders the primogem status card', () => {
      renderPage();

      expect(screen.getByText('Primogems')).toBeInTheDocument();
    });

    it('renders child widgets', () => {
      renderPage();

      expect(screen.getByTestId('dashboard-campaign-focus')).toBeInTheDocument();
      expect(screen.getByTestId('today-farming-widget')).toBeInTheDocument();
      expect(screen.getByTestId('quick-resource-logger')).toBeInTheDocument();
      expect(screen.getByTestId('target-quick-start')).toBeInTheDocument();
      expect(screen.getByTestId('target-summary-list')).toBeInTheDocument();
    });
  });

  describe('stat card values', () => {
    it('displays correct character count', () => {
      renderPage();

      // Total characters
      expect(screen.getByText('3')).toBeInTheDocument();
      // Characters at Lv.90
      expect(screen.getByText(/2 at lv.90/i)).toBeInTheDocument();
    });

    it('displays correct artifact count', () => {
      renderPage();

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText(/100 5-star/i)).toBeInTheDocument();
    });

    it('displays correct weapon count', () => {
      renderPage();

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText(/10 5-star/i)).toBeInTheDocument();
    });

    it('displays correct pull count', () => {
      renderPage();

      // Pull count appears in both stat card and primogem card
      const pullCounts = screen.getAllByText('118');
      expect(pullCounts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/15.0k primogems/i)).toBeInTheDocument();
    });
  });

  describe('primogem card', () => {
    it('displays primogem count', () => {
      renderPage();

      expect(screen.getByText('15.0K')).toBeInTheDocument();
    });

    it('displays intertwined fate count', () => {
      renderPage();

      expect(screen.getByText(/\+ 25 intertwined/i)).toBeInTheDocument();
    });

    it('displays available pulls', () => {
      renderPage();

      const pullTexts = screen.getAllByText('118');
      expect(pullTexts.length).toBeGreaterThan(0);
    });
  });

  describe('navigation links', () => {
    it('stat cards link to correct pages', () => {
      renderPage();

      const characterLink = screen.getByText('Characters').closest('a');
      expect(characterLink).toHaveAttribute('href', '/roster');

      const artifactLink = screen.getByText('Artifacts').closest('a');
      expect(artifactLink).toHaveAttribute('href', '/roster/artifacts');

      const weaponLink = screen.getByText('Weapons').closest('a');
      expect(weaponLink).toHaveAttribute('href', '/roster/weapons');

      // Event Pulls appears multiple times - get the one in the stat cards section
      const pullsLinks = screen.getAllByText('Event Pulls');
      const statCardPullsLink = pullsLinks[0].closest('a');
      expect(statCardPullsLink).toHaveAttribute('href', '/pulls');
    });

    it('resin and primogem cards have nav links', () => {
      renderPage();

      expect(screen.getByText('Planner').closest('a')).toHaveAttribute('href', '/planner');
      expect(screen.getAllByText('Budget')[0]?.closest('a')).toHaveAttribute('href', '/pulls');
    });

    it('resin card has link to planner', () => {
      renderPage();

      const plannerLinks = screen.getAllByText('Planner');
      expect(plannerLinks.length).toBeGreaterThan(0);
    });

    it('primogem card has link to budget', () => {
      renderPage();

      const budgetLinks = screen.getAllByText('Budget');
      expect(budgetLinks.length).toBeGreaterThan(0);
    });
  });

  describe('resin status', () => {
    it('displays default resin when no saved data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      renderPage();

      // Should show some resin value (default calculation)
      expect(screen.getByText('Resin')).toBeInTheDocument();
    });

    it('reads resin from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        currentResin: 100,
        maxResin: 200,
        lastUpdated: Date.now(),
        fragileResin: 5,
      }));
      renderPage();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('resinBudget');
    });

    it('shows fragile resin count when available', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        currentResin: 100,
        maxResin: 200,
        lastUpdated: Date.now(),
        fragileResin: 10,
      }));
      renderPage();

      expect(screen.getByText(/fragile resin/i)).toBeInTheDocument();
    });
  });

  describe('onboarding checklist self-healing', () => {
    it('marks wish history imported when records already exist', () => {
      renderPage();

      expect(updateChecklistMock).toHaveBeenCalledWith({ hasImportedWishHistory: true });
    });
  });
});

describe('DashboardPage empty state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows get started card when no characters', async () => {
    vi.doMock('../components/TodayFarmingWidget', () => ({
      default: () => <div data-testid="today-farming-widget">TodayFarmingWidget</div>,
    }));
    vi.doMock('@/features/notes/components/QuickNotesWidget', () => ({
      default: () => <div data-testid="quick-notes-widget">QuickNotesWidget</div>,
    }));
    vi.doMock('@/features/ledger/components/QuickResourceLogger', () => ({
      default: () => <div data-testid="quick-resource-logger">QuickResourceLogger</div>,
    }));
    vi.doMock('@/features/targets/components/TargetQuickStart', () => ({
      default: () => <div data-testid="target-quick-start">TargetQuickStart</div>,
    }));
    vi.doMock('@/features/targets/components/TargetSummaryList', () => ({
      default: () => <div data-testid="target-summary-list">TargetSummaryList</div>,
    }));
    vi.doMock('@/components/common/GettingStartedChecklist', () => ({
      default: () => <div data-testid="getting-started-checklist">GettingStartedChecklist</div>,
    }));
    vi.doMock('@/features/roster/hooks/useTeams', () => ({
      useTeams: () => ({ teams: [], isLoading: false }),
    }));
    vi.doMock('@/contexts/OnboardingContext', () => ({
      useOnboardingContext: () => ({
        isComplete: true,
        showWizard: false,
        checklist: {
          hasImportedCharacters: false,
          hasCreatedTeam: false,
          hasVisitedPlanner: false,
          hasImportedWishHistory: false,
        },
        checklistProgress: 0,
        checklistTotal: 4,
        isChecklistComplete: false,
        completeOnboarding: vi.fn(),
        resetOnboarding: vi.fn(),
        openWizard: vi.fn(),
        closeWizard: vi.fn(),
        updateChecklist: vi.fn(),
      }),
    }));
    vi.doMock('@/features/roster/hooks/useCharacters', () => ({
      useCharacters: () => ({
        characters: [],
        isLoading: false,
      }),
    }));

    vi.doMock('@/features/artifacts/hooks/useArtifacts', () => ({
      useArtifacts: () => ({
        stats: { total: 0, fiveStar: 0 },
        isLoading: false,
      }),
    }));

    vi.doMock('@/features/weapons/hooks/useWeapons', () => ({
      useWeapons: () => ({
        stats: { total: 0, fiveStars: 0 },
        isLoading: false,
      }),
    }));

    vi.doMock('dexie-react-hooks', () => ({
      useLiveQuery: vi.fn()
        .mockReturnValueOnce({
        availablePulls: 0,
        pullAvailability: {
          eventPulls: 0,
          standardPulls: 0,
          allWishes: 0,
          currencyPulls: 0,
          starglitterPulls: 0,
        },
        resources: {
          primogems: 0,
          genesisCrystals: 0,
          intertwined: 0,
          acquaint: 0,
          starglitter: 0,
        },
        lastUpdated: null,
        hasSnapshot: false,
        })
        .mockReturnValueOnce(0)
        .mockReturnValueOnce([]),
    }));
    vi.doMock('@/lib/services/resourceService', () => ({
      getAvailablePullsFromTracker: vi.fn(),
    }));
    vi.doMock('@/features/notes/hooks/useGoals', () => ({
      useGoals: () => ({ goals: [], allGoals: [], createGoal: vi.fn(), updateGoal: vi.fn(), deleteGoal: vi.fn(), isLoading: false }),
    }));
    vi.doMock('@/features/notes/hooks/useNotes', () => ({
      useNotes: () => ({ notes: [], allNotes: [], createNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(), isLoading: false }),
    }));
    vi.doMock('@/stores/wishlistStore', () => ({
      useWishlistStore: () => [],
    }));

    // Re-import after mocking
    const { default: DashboardPageEmpty } = await import('./DashboardPage');

    render(
      <MemoryRouter>
        <DashboardPageEmpty />
      </MemoryRouter>
    );

    expect(screen.getByText(/get started/i)).toBeInTheDocument();
    expect(screen.getByText(/import your character data/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import account data/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );
  });
});
