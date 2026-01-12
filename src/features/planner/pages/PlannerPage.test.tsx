import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlannerPage from './PlannerPage';

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

// Mock weapons
const mockWeapons = [
  {
    id: 'w1',
    key: 'SkywardBlade',
    level: 80,
    ascension: 5,
    refinement: 1,
    displayName: 'Skyward Blade',
    displayRarity: 5,
    location: null,
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

vi.mock('@/features/weapons/hooks/useWeapons', () => ({
  useWeapons: () => ({
    weapons: mockWeapons,
    isLoading: false,
    hasWeapons: true,
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

vi.mock('../hooks/useMultiCharacterPlan', () => ({
  useMultiCharacterPlan: () => ({
    selectedCount: 0,
    selectedCharacters: [],
    hasSelection: false,
    isSelected: vi.fn().mockReturnValue(false),
    toggleCharacter: vi.fn(),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    deselectCharacter: vi.fn(),
    goalType: 'next',
    setGoalType: vi.fn(),
    summary: null,
    isCalculating: false,
    calculationError: null,
  }),
}));

vi.mock('../hooks/useWeaponPlan', () => ({
  useWeaponPlan: () => ({
    selectedCount: 0,
    selectedWeapons: [],
    hasSelection: false,
    isSelected: vi.fn().mockReturnValue(false),
    toggleWeapon: vi.fn(),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    goalType: 'full',
    setGoalType: vi.fn(),
    summary: null,
    isCalculating: false,
  }),
}));

// Mock components
vi.mock('../components/ResinTracker', () => ({
  default: () => <div data-testid="resin-tracker">Resin Tracker</div>,
}));

vi.mock('../components/TodaysFarmingRecommendations', () => ({
  default: () => <div data-testid="farming-recommendations">Farming Recommendations</div>,
}));

vi.mock('../components/DeficitPriorityCard', () => ({
  default: () => <div data-testid="deficit-priority">Deficit Priority</div>,
}));

vi.mock('../components/ResinEfficiencyCard', () => ({
  default: () => <div data-testid="resin-efficiency">Resin Efficiency</div>,
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
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<PlannerPage />);

      expect(screen.getByRole('heading', { name: /ascension planner/i })).toBeInTheDocument();
      expect(screen.getByText(/calculate materials needed/i)).toBeInTheDocument();
    });

    it('renders mode switcher buttons', () => {
      render(<PlannerPage />);

      expect(screen.getByRole('button', { name: /single/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /multi/i })).toBeInTheDocument();
    });

    it('renders material inventory status', () => {
      render(<PlannerPage />);

      expect(screen.getByText(/material inventory/i)).toBeInTheDocument();
      expect(screen.getByText(/2 material types tracked/i)).toBeInTheDocument();
    });

    it('renders resin tracker in sidebar', () => {
      render(<PlannerPage />);

      expect(screen.getByTestId('resin-tracker')).toBeInTheDocument();
    });

    it('renders domain schedule card', () => {
      render(<PlannerPage />);

      expect(screen.getByText(/today's domains/i)).toBeInTheDocument();
    });

    it('renders resin tips', () => {
      render(<PlannerPage />);

      expect(screen.getByText(/resin tips/i)).toBeInTheDocument();
      expect(screen.getByText(/daily resin regeneration/i)).toBeInTheDocument();
    });
  });

  describe('single character mode', () => {
    it('single mode is active by default', () => {
      render(<PlannerPage />);

      const singleButton = screen.getByRole('button', { name: /single/i });
      expect(singleButton).toHaveClass('bg-primary-600');
    });

    it('renders character selection section', () => {
      render(<PlannerPage />);

      expect(screen.getByRole('heading', { name: /select character/i })).toBeInTheDocument();
    });

    it('renders character dropdown with characters', () => {
      render(<PlannerPage />);

      const characterSelect = screen.getByRole('combobox', { name: /character/i });
      expect(characterSelect).toBeInTheDocument();
    });

    it('renders goal type dropdown', () => {
      render(<PlannerPage />);

      const goalSelect = screen.getByRole('combobox', { name: /goal/i });
      expect(goalSelect).toBeInTheDocument();
    });

    it('shows empty state when no character selected', () => {
      render(<PlannerPage />);

      expect(screen.getByText(/select a character to calculate materials/i)).toBeInTheDocument();
    });

    it('shows goal options in dropdown', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      const goalSelect = screen.getByRole('combobox', { name: /goal/i });
      await user.click(goalSelect);

      expect(screen.getByText(/next ascension/i)).toBeInTheDocument();
      expect(screen.getByText(/functional/i)).toBeInTheDocument();
      expect(screen.getByText(/comfortable/i)).toBeInTheDocument();
      expect(screen.getByText(/full build/i)).toBeInTheDocument();
    });
  });

  describe('multi character mode', () => {
    it('can switch to multi mode', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      const multiButton = screen.getByRole('button', { name: /multi/i });
      expect(multiButton).toHaveClass('bg-primary-600');
    });

    it('shows character and weapon tabs in multi mode', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      expect(screen.getByRole('button', { name: /characters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /weapons/i })).toBeInTheDocument();
    });

    it('shows select all and clear buttons', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      expect(screen.getByText(/select all/i)).toBeInTheDocument();
      expect(screen.getByText(/clear/i)).toBeInTheDocument();
    });

    it('shows goal type selector in multi mode', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      expect(screen.getByText(/goal for all characters/i)).toBeInTheDocument();
    });

    it('shows character grid in multi mode', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      // Should show character names in the grid
      expect(screen.getByText('Furina')).toBeInTheDocument();
      expect(screen.getByText('Neuvillette')).toBeInTheDocument();
    });

    it('shows empty state when no characters selected', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));

      expect(screen.getByText(/select characters to calculate combined materials/i)).toBeInTheDocument();
    });
  });

  describe('weapon tab in multi mode', () => {
    it('can switch to weapons tab', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));
      await user.click(screen.getByRole('button', { name: /weapons/i }));

      expect(screen.getByText(/goal for all weapons/i)).toBeInTheDocument();
    });

    it('shows weapon goal options', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      await user.click(screen.getByRole('button', { name: /multi/i }));
      await user.click(screen.getByRole('button', { name: /weapons/i }));

      // Should show weapon-specific goal options
      const goalSelect = screen.getByRole('combobox', { name: /goal for all weapons/i });
      expect(goalSelect).toBeInTheDocument();
    });
  });

  describe('mora input', () => {
    it('renders mora input field', () => {
      render(<PlannerPage />);

      expect(screen.getByPlaceholderText(/enter mora/i)).toBeInTheDocument();
    });

    it('shows mora label', () => {
      render(<PlannerPage />);

      expect(screen.getByText(/mora:/i)).toBeInTheDocument();
    });
  });

  describe('character selection', () => {
    it('selects character from dropdown', async () => {
      const user = userEvent.setup();
      render(<PlannerPage />);

      const characterSelect = screen.getByRole('combobox', { name: /character/i });
      await user.selectOptions(characterSelect, '1');

      // After selection, goal summary should appear
      await waitFor(() => {
        expect(screen.getByText(/furina - goal/i)).toBeInTheDocument();
      });
    });
  });

  describe('domain schedule', () => {
    it('shows today day name', () => {
      render(<PlannerPage />);

      // The day name should be visible
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      expect(screen.getByText(today!)).toBeInTheDocument();
    });

    it('shows schedule reference', () => {
      render(<PlannerPage />);

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

    vi.doMock('@/features/weapons/hooks/useWeapons', () => ({
      useWeapons: () => ({
        weapons: [],
        isLoading: true,
        hasWeapons: false,
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

    render(<PlannerPageLoading />);

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

    vi.doMock('@/features/weapons/hooks/useWeapons', () => ({
      useWeapons: () => ({
        weapons: [],
        isLoading: false,
        hasWeapons: false,
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

    render(<PlannerPageNoMats />);

    expect(screen.getByText(/import from irminsul to track materials/i)).toBeInTheDocument();
  });
});
