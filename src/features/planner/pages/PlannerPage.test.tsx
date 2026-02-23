import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PlannerPage from './PlannerPage';

// Helper to wrap component with router
function renderWithRouter(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

// Mock characters
const mockCharacters = [
  {
    id: '1',
    key: 'Furina',
    level: 80,
    ascension: 5,
    constellation: 0,
    talent: { auto: 6, skill: 8, burst: 8 },
    weapon: { key: 'Splendor', level: 90, ascension: 6, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'main' as const,
    teamIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    key: 'Neuvillette',
    level: 90,
    ascension: 6,
    constellation: 0,
    talent: { auto: 10, skill: 10, burst: 10 },
    weapon: { key: 'Tome', level: 90, ascension: 6, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'main' as const,
    teamIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock materials
const mockMaterials: Record<string, number> = {
  Mora: 1000000,
  'Varunada Lazurite Chunk': 5,
};

// Mock hooks
vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: mockCharacters,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useMaterials', () => ({
  useMaterials: () => ({
    materials: mockMaterials,
    isLoading: false,
    hasMaterials: true,
    totalMaterialTypes: 2,
    setMaterial: vi.fn(),
  }),
}));

// Mock components
vi.mock('../components/ResinTracker', () => ({
  default: () => <div data-testid="resin-tracker">Resin Tracker</div>,
}));

vi.mock('../components/TodaysFarmingRecommendations', () => ({
  default: () => <div data-testid="farming-recommendations">Farming Recommendations</div>,
}));

// Mock the ascension calculator
vi.mock('../domain/ascensionCalculator', () => ({
  calculateAscensionSummary: vi.fn().mockResolvedValue({
    materials: [],
    totalMora: 500000,
    totalExp: 100000,
    estimatedResin: 200,
    estimatedDays: 2,
    canAscend: false,
    resinBreakdown: { talentBoss: 100, expMora: 100 },
  }),
  createGoalFromCharacter: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 80,
    targetLevel: 90,
    currentAscension: 5,
    targetAscension: 6,
    currentTalents: { auto: 6, skill: 8, burst: 8 },
    targetTalents: { auto: 10, skill: 10, burst: 10 },
  }),
  createComfortableBuildGoal: vi.fn(),
  createFunctionalBuildGoal: vi.fn(),
  createNextAscensionGoal: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 80,
    targetLevel: 80,
    currentAscension: 5,
    targetAscension: 6,
    currentTalents: { auto: 6, skill: 8, burst: 8 },
    targetTalents: { auto: 6, skill: 8, burst: 8 },
  }),
}));

describe('PlannerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByRole('heading', { name: /ascension planner/i })).toBeInTheDocument();
      expect(screen.getByText(/select a character to see the materials needed/i)).toBeInTheDocument();
    });

    it('renders material inventory status', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/material inventory/i)).toBeInTheDocument();
      expect(screen.getByText(/2 material types tracked/i)).toBeInTheDocument();
    });

    it('renders resin tracker', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByTestId('resin-tracker')).toBeInTheDocument();
    });

    it('renders domain schedule card', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/today's domains/i)).toBeInTheDocument();
    });

    it('renders resin tips', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/resin tips/i)).toBeInTheDocument();
      expect(screen.getByText(/daily resin regeneration/i)).toBeInTheDocument();
    });
  });

  describe('single character mode', () => {
    it('renders character selection section', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByRole('heading', { name: /select character/i })).toBeInTheDocument();
    });

    it('renders character dropdown with characters', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText('Character')).toBeInTheDocument();
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(1);
    });

    it('renders goal type dropdown', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText('Goal')).toBeInTheDocument();
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('shows empty state when no character selected', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/select a character to calculate materials/i)).toBeInTheDocument();
    });

    it('shows goal options in dropdown', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByRole('option', { name: /next ascension/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /functional/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /comfortable/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /full build/i })).toBeInTheDocument();
    });
  });

  describe('mora input', () => {
    it('renders mora input field', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByPlaceholderText(/enter mora/i)).toBeInTheDocument();
    });

    it('shows mora label', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/mora:/i)).toBeInTheDocument();
    });
  });

  describe('character selection', () => {
    it('selects character from dropdown', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PlannerPage />);

      const comboboxes = screen.getAllByRole('combobox');
      const characterSelect = comboboxes[0]!;

      expect(screen.getByRole('option', { name: /furina/i })).toBeInTheDocument();

      await user.selectOptions(characterSelect, '1');

      expect(characterSelect).toHaveValue('1');
    });
  });

  describe('domain schedule', () => {
    it('shows today day name', () => {
      renderWithRouter(<PlannerPage />);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      expect(screen.getByText(today!)).toBeInTheDocument();
    });

    it('shows schedule reference', () => {
      renderWithRouter(<PlannerPage />);

      expect(screen.getByText(/schedule/i)).toBeInTheDocument();
      expect(screen.getByText(/mon\/thu/i)).toBeInTheDocument();
      expect(screen.getByText(/tue\/fri/i)).toBeInTheDocument();
      expect(screen.getByText(/wed\/sat/i)).toBeInTheDocument();
    });
  });
});

describe('PlannerPage loading state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows loading state when data is loading', async () => {
    vi.doMock('@/features/roster/hooks/useCharacters', () => ({
      useCharacters: () => ({
        characters: [],
        isLoading: true,
      }),
    }));

    vi.doMock('../hooks/useMaterials', () => ({
      useMaterials: () => ({
        materials: {},
        isLoading: true,
        hasMaterials: false,
        totalMaterialTypes: 0,
        setMaterial: vi.fn(),
      }),
    }));

    const { default: PlannerPageLoading } = await import('./PlannerPage');

    renderWithRouter(<PlannerPageLoading />);

    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });
});

describe('PlannerPage without materials', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows warning when no materials imported', async () => {
    vi.doMock('@/features/roster/hooks/useCharacters', () => ({
      useCharacters: () => ({
        characters: mockCharacters,
        isLoading: false,
      }),
    }));

    vi.doMock('../hooks/useMaterials', () => ({
      useMaterials: () => ({
        materials: {},
        isLoading: false,
        hasMaterials: false,
        totalMaterialTypes: 0,
        setMaterial: vi.fn(),
      }),
    }));

    const { default: PlannerPageNoMats } = await import('./PlannerPage');

    renderWithRouter(<PlannerPageNoMats />);

    expect(screen.getByText(/import from irminsul to track materials/i)).toBeInTheDocument();
  });
});
