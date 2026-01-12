import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ArtifactsPage from './ArtifactsPage';

// Mock the useArtifacts hook
const mockArtifacts = [
  {
    id: '1',
    setKey: 'GladiatorsFinale',
    slotKey: 'flower',
    level: 20,
    rarity: 5,
    mainStatKey: 'hp',
    substats: [
      { key: 'critRate_', value: 10.5 },
      { key: 'critDMG_', value: 21.0 },
      { key: 'atk_', value: 5.8 },
      { key: 'def_', value: 7.3 },
    ],
    location: 'Furina',
    score: {
      grade: 'A' as const,
      critValue: 31.5,
      isStrongboxTrash: false,
    },
  },
  {
    id: '2',
    setKey: 'EmblemOfSeveredFate',
    slotKey: 'sands',
    level: 0,
    rarity: 5,
    mainStatKey: 'atk_',
    substats: [
      { key: 'def', value: 23 },
      { key: 'hp', value: 299 },
    ],
    location: null,
    score: {
      grade: 'F' as const,
      critValue: 0,
      isStrongboxTrash: true,
      trashReason: 'No crit substats',
    },
  },
];

const mockStats = {
  total: 150,
  fiveStar: 100,
  equipped: 50,
  trash: 20,
  grades: { S: 5, A: 20, B: 30, C: 40, D: 35, F: 20 },
};

vi.mock('../hooks/useArtifacts', () => ({
  useArtifacts: (options?: { filters?: object; sort?: object }) => ({
    artifacts: mockArtifacts,
    allArtifacts: mockArtifacts,
    isLoading: false,
    error: null,
    stats: mockStats,
  }),
}));

// Mock the game data formatters
vi.mock('@/lib/gameData', () => ({
  formatArtifactSetName: (key: string) => key.replace(/([A-Z])/g, ' $1').trim(),
  formatSlotName: (key: string) => key.charAt(0).toUpperCase() + key.slice(1),
  formatStatName: (key: string) => key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
}));

// Mock scoring functions
vi.mock('../domain/artifactScoring', () => ({
  getGradeColor: (grade: string) => (grade === 'S' || grade === 'A' ? 'text-green-400' : 'text-slate-400'),
  getGradeBgColor: (grade: string) => (grade === 'S' || grade === 'A' ? 'bg-green-900/30' : 'bg-slate-800'),
}));

// Mock constants
vi.mock('../domain/artifactConstants', () => ({
  SLOT_NAMES: {
    flower: 'Flower',
    plume: 'Plume',
    sands: 'Sands',
    goblet: 'Goblet',
    circlet: 'Circlet',
  },
}));

describe('ArtifactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<ArtifactsPage />);

      expect(screen.getByRole('heading', { name: /artifact inventory/i })).toBeInTheDocument();
    });

    it('displays artifact count in subtitle', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/150 artifacts/i)).toBeInTheDocument();
      expect(screen.getByText(/20 flagged for strongbox/i)).toBeInTheDocument();
    });

    it('renders all stat overview cards', () => {
      render(<ArtifactsPage />);

      // Total
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();

      // 5-Star
      expect(screen.getByText('5-Star')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();

      // Equipped
      expect(screen.getByText('Equipped')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();

      // Strongbox Trash
      expect(screen.getByText(/strongbox trash/i)).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('renders quality distribution section', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/quality distribution/i)).toBeInTheDocument();
      // Grade labels
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('renders view mode toggle', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/all artifacts/i)).toBeInTheDocument();
      expect(screen.getByText(/strongbox trash/i)).toBeInTheDocument();
    });

    it('renders filter button', () => {
      render(<ArtifactsPage />);

      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('renders sort dropdown', () => {
      render(<ArtifactsPage />);

      expect(screen.getByRole('combobox', { name: /sort artifacts/i })).toBeInTheDocument();
    });

    it('renders artifact cards', () => {
      render(<ArtifactsPage />);

      // Should show artifact set names
      expect(screen.getByText(/gladiators finale/i)).toBeInTheDocument();
      expect(screen.getByText(/emblem of severed fate/i)).toBeInTheDocument();
    });
  });

  describe('view mode switching', () => {
    it('shows all artifacts by default', () => {
      render(<ArtifactsPage />);

      const allArtifactsButton = screen.getByRole('button', { name: /all artifacts/i });
      expect(allArtifactsButton).toHaveClass('bg-slate-700');
    });

    it('can switch to trash view', async () => {
      const user = userEvent.setup();
      render(<ArtifactsPage />);

      await user.click(screen.getByRole('button', { name: /strongbox trash/i }));

      // Button should now be highlighted
      const trashButton = screen.getByRole('button', { name: /strongbox trash/i });
      expect(trashButton).toHaveClass('bg-red-900/50');
    });
  });

  describe('filters panel', () => {
    it('filters panel is hidden by default', () => {
      render(<ArtifactsPage />);

      expect(screen.queryByRole('combobox', { name: /filter by set/i })).not.toBeInTheDocument();
    });

    it('shows filters panel when filter button is clicked', async () => {
      const user = userEvent.setup();
      render(<ArtifactsPage />);

      await user.click(screen.getByRole('button', { name: /filters/i }));

      expect(screen.getByRole('combobox', { name: /filter by set/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by slot/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by rarity/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by equipped status/i })).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('default sort is by score', () => {
      render(<ArtifactsPage />);

      const sortSelect = screen.getByRole('combobox', { name: /sort artifacts/i });
      expect(sortSelect).toHaveValue('score');
    });

    it('can change sort order', async () => {
      const user = userEvent.setup();
      render(<ArtifactsPage />);

      await user.click(screen.getByText(/high to low/i));

      expect(screen.getByText(/low to high/i)).toBeInTheDocument();
    });

    it('has all sort options', async () => {
      const user = userEvent.setup();
      render(<ArtifactsPage />);

      const sortSelect = screen.getByRole('combobox', { name: /sort artifacts/i });
      await user.click(sortSelect);

      expect(screen.getByRole('option', { name: /score/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /crit value/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /level/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /rarity/i })).toBeInTheDocument();
    });
  });

  describe('artifact cards', () => {
    it('displays artifact grade', () => {
      render(<ArtifactsPage />);

      // Should show grade badges
      const gradeA = screen.getAllByText('A');
      expect(gradeA.length).toBeGreaterThan(0);
    });

    it('displays artifact slot and level', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/flower.*\+20/i)).toBeInTheDocument();
    });

    it('displays crit value', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/cv:/i)).toBeInTheDocument();
      expect(screen.getByText('31.5')).toBeInTheDocument();
    });

    it('shows equipped character name', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText('Furina')).toBeInTheDocument();
    });

    it('shows unequipped label for unequipped artifacts', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText('Unequipped')).toBeInTheDocument();
    });

    it('shows trash warning for strongbox trash', () => {
      render(<ArtifactsPage />);

      expect(screen.getByText(/no crit substats/i)).toBeInTheDocument();
    });
  });
});

describe('ArtifactsPage loading state', () => {
  it('shows loading state', async () => {
    vi.doMock('../hooks/useArtifacts', () => ({
      useArtifacts: () => ({
        artifacts: [],
        allArtifacts: [],
        isLoading: true,
        error: null,
        stats: { total: 0, fiveStar: 0, equipped: 0, trash: 0, grades: {} },
      }),
    }));

    const { default: ArtifactsPageLoading } = await import('./ArtifactsPage');
    render(<ArtifactsPageLoading />);

    expect(screen.getByText(/loading artifacts/i)).toBeInTheDocument();
  });
});

describe('ArtifactsPage empty state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows empty state when no artifacts', async () => {
    vi.doMock('../hooks/useArtifacts', () => ({
      useArtifacts: () => ({
        artifacts: [],
        allArtifacts: [],
        isLoading: false,
        error: null,
        stats: { total: 0, fiveStar: 0, equipped: 0, trash: 0, grades: {} },
      }),
    }));

    const { default: ArtifactsPageEmpty } = await import('./ArtifactsPage');
    render(<ArtifactsPageEmpty />);

    expect(screen.getByText(/no artifacts in inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/import your artifacts/i)).toBeInTheDocument();
  });
});

describe('ArtifactsPage error state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows error state', async () => {
    vi.doMock('../hooks/useArtifacts', () => ({
      useArtifacts: () => ({
        artifacts: [],
        allArtifacts: [],
        isLoading: false,
        error: 'Failed to load data',
        stats: { total: 0, fiveStar: 0, equipped: 0, trash: 0, grades: {} },
      }),
    }));

    const { default: ArtifactsPageError } = await import('./ArtifactsPage');
    render(<ArtifactsPageError />);

    expect(screen.getByText(/failed to load artifacts/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });
});
