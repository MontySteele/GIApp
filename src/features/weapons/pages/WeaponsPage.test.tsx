import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeaponsPage from './WeaponsPage';

// Mock weapon data
const mockWeapons = [
  {
    id: 'w1',
    key: 'MistsplitterReforged',
    level: 90,
    ascension: 6,
    refinement: 1,
    location: 'Ayaka',
    lock: true,
    displayName: 'Mistsplitter Reforged',
    displayRarity: 5,
    weaponType: 'sword' as const,
  },
  {
    id: 'w2',
    key: 'FavoniusSword',
    level: 80,
    ascension: 5,
    refinement: 5,
    location: null,
    lock: false,
    displayName: 'Favonius Sword',
    displayRarity: 4,
    weaponType: 'sword' as const,
  },
  {
    id: 'w3',
    key: 'StaffOfHoma',
    level: 90,
    ascension: 6,
    refinement: 1,
    location: 'Hu Tao',
    lock: true,
    displayName: 'Staff of Homa',
    displayRarity: 5,
    weaponType: 'polearm' as const,
  },
];

const mockStats = {
  total: 50,
  fiveStars: 10,
  fourStars: 30,
  maxRefinement: 15,
  equipped: 25,
  byType: {
    sword: 12,
    claymore: 8,
    polearm: 10,
    bow: 10,
    catalyst: 10,
  },
};

vi.mock('../hooks/useWeapons', () => ({
  useWeapons: () => ({
    weapons: mockWeapons,
    isLoading: false,
    stats: mockStats,
    hasWeapons: true,
  }),
  filterAndSortWeapons: (weapons: typeof mockWeapons) => weapons,
}));

// Mock constants
vi.mock('../domain/weaponConstants', () => ({
  WEAPON_TYPE_NAMES: {
    sword: 'Sword',
    claymore: 'Claymore',
    polearm: 'Polearm',
    bow: 'Bow',
    catalyst: 'Catalyst',
  },
  RARITY_COLORS: {
    5: 'text-yellow-400',
    4: 'text-purple-400',
    3: 'text-blue-400',
  },
  RARITY_BG_COLORS: {
    5: 'bg-yellow-900/20 border-yellow-700/50',
    4: 'bg-purple-900/20 border-purple-700/50',
    3: 'bg-blue-900/20 border-blue-700/50',
  },
  getRefinementDisplay: (r: number) => `R${r}`,
  getRefinementColor: (r: number) => (r === 5 ? 'text-green-400' : 'text-slate-400'),
}));

describe('WeaponsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<WeaponsPage />);

      expect(screen.getByRole('heading', { name: /weapons/i })).toBeInTheDocument();
    });

    it('displays total weapon count badge', () => {
      render(<WeaponsPage />);

      expect(screen.getByText(/50 weapons/i)).toBeInTheDocument();
    });

    it('renders all stat overview cards', () => {
      render(<WeaponsPage />);

      expect(screen.getByText('5-Star')).toBeInTheDocument();
      // 10 appears multiple times (5-star count, polearm count, bow count, catalyst count)
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('4-Star')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();

      expect(screen.getByText('Max Refinement')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();

      expect(screen.getByText('Equipped')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('renders weapon type breakdown', () => {
      render(<WeaponsPage />);

      expect(screen.getByText(/sword:/i)).toBeInTheDocument();
      expect(screen.getByText(/claymore:/i)).toBeInTheDocument();
      expect(screen.getByText(/polearm:/i)).toBeInTheDocument();
      expect(screen.getByText(/bow:/i)).toBeInTheDocument();
      expect(screen.getByText(/catalyst:/i)).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<WeaponsPage />);

      expect(screen.getByPlaceholderText(/search weapons or characters/i)).toBeInTheDocument();
    });

    it('renders filter toggle', () => {
      render(<WeaponsPage />);

      expect(screen.getByText(/filters/i)).toBeInTheDocument();
    });

    it('renders weapon cards', () => {
      render(<WeaponsPage />);

      expect(screen.getByText('Mistsplitter Reforged')).toBeInTheDocument();
      expect(screen.getByText('Favonius Sword')).toBeInTheDocument();
      expect(screen.getByText('Staff of Homa')).toBeInTheDocument();
    });

    it('shows results count', () => {
      render(<WeaponsPage />);

      expect(screen.getByText(/showing 3 of 3 weapons/i)).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('can type in search box', async () => {
      const user = userEvent.setup();
      render(<WeaponsPage />);

      const searchInput = screen.getByPlaceholderText(/search weapons or characters/i);
      await user.type(searchInput, 'Mistsplitter');

      expect(searchInput).toHaveValue('Mistsplitter');
    });
  });

  describe('filters panel', () => {
    it('filters panel is hidden by default', () => {
      render(<WeaponsPage />);

      expect(screen.queryByLabelText(/^type$/i)).not.toBeInTheDocument();
    });

    it('shows filters when filter toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<WeaponsPage />);

      await user.click(screen.getByText(/filters/i));

      expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^rarity$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('has all filter options', async () => {
      const user = userEvent.setup();
      render(<WeaponsPage />);

      await user.click(screen.getByText(/filters/i));

      // Verify filter controls exist
      expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^rarity$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^status$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();

      // Check that options exist (using getAllByRole since "All" appears in multiple selects)
      const allOptions = screen.getAllByRole('option', { name: /all/i });
      expect(allOptions.length).toBeGreaterThanOrEqual(3); // All Types, All Rarities, All (status)
    });
  });

  describe('weapon cards', () => {
    it('displays weapon level and ascension', () => {
      render(<WeaponsPage />);

      // Multiple weapons at Lv. 90
      const levelTexts = screen.getAllByText(/lv\. 90/i);
      expect(levelTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('displays weapon refinement', () => {
      render(<WeaponsPage />);

      // Multiple weapons may have same refinement
      const r1Texts = screen.getAllByText('R1');
      expect(r1Texts.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('R5')).toBeInTheDocument();
    });

    it('displays weapon type', () => {
      render(<WeaponsPage />);

      const swordLabels = screen.getAllByText('Sword');
      expect(swordLabels.length).toBeGreaterThan(0);

      expect(screen.getByText('Polearm')).toBeInTheDocument();
    });

    it('displays rarity stars', () => {
      render(<WeaponsPage />);

      // 5-star weapons should have 5 stars displayed
      expect(screen.getAllByText('★★★★★').length).toBeGreaterThan(0);
    });

    it('displays ascension badge', () => {
      render(<WeaponsPage />);

      expect(screen.getAllByText('A6').length).toBeGreaterThan(0);
    });

    it('shows equipped character name', () => {
      render(<WeaponsPage />);

      expect(screen.getByText('Ayaka')).toBeInTheDocument();
      expect(screen.getByText('Hu Tao')).toBeInTheDocument();
    });

    it('shows locked badge for locked weapons', () => {
      render(<WeaponsPage />);

      const lockedBadges = screen.getAllByText('Locked');
      expect(lockedBadges.length).toBeGreaterThan(0);
    });
  });
});

describe('WeaponsPage loading state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows loading state', async () => {
    vi.doMock('../hooks/useWeapons', () => ({
      useWeapons: () => ({
        weapons: [],
        isLoading: true,
        stats: { total: 0, fiveStars: 0, fourStars: 0, maxRefinement: 0, equipped: 0, byType: {} },
        hasWeapons: false,
      }),
      filterAndSortWeapons: () => [],
    }));

    const { default: WeaponsPageLoading } = await import('./WeaponsPage');
    render(<WeaponsPageLoading />);

    expect(screen.getByText(/loading weapons/i)).toBeInTheDocument();
  });
});

describe('WeaponsPage empty state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows empty state when no weapons', async () => {
    vi.doMock('../hooks/useWeapons', () => ({
      useWeapons: () => ({
        weapons: [],
        isLoading: false,
        stats: { total: 0, fiveStars: 0, fourStars: 0, maxRefinement: 0, equipped: 0, byType: {} },
        hasWeapons: false,
      }),
      filterAndSortWeapons: () => [],
    }));

    const { default: WeaponsPageEmpty } = await import('./WeaponsPage');
    render(<WeaponsPageEmpty />);

    expect(screen.getByText(/no weapons in inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/import your data/i)).toBeInTheDocument();
  });
});
