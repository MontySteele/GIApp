import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishHistoryPage } from './WishHistoryPage';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

// Mock the wish history loader
const mockWishHistory: WishHistoryItem[] = [
  {
    id: '1',
    name: 'Furina',
    rarity: 5,
    itemType: 'character',
    banner: 'character',
    timestamp: '2024-01-15T10:00:00Z',
    pity: 75,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Favonius Sword',
    rarity: 4,
    itemType: 'weapon',
    banner: 'character',
    timestamp: '2024-01-14T10:00:00Z',
    pity: 5,
    isFeatured: false,
  },
];

vi.mock('../utils/wishHistory', () => ({
  loadWishHistoryFromRepo: vi.fn().mockResolvedValue([]),
}));

vi.mock('../domain/wishAnalyzer', () => ({
  analyzeWishHistory: vi.fn().mockReturnValue({
    pityState: {
      fiveStarPity: 0,
      fourStarPity: 0,
      guaranteed: false,
      fatePoints: 0,
      radiantStreak: 0,
      radianceActive: false,
    },
    stats: {
      totalPulls: 0,
      fiveStars: 0,
      fourStars: 0,
      fiveStarRate: 0,
      fourStarRate: 0,
      averagePity: 0,
    },
  }),
}));

// Mock the child components
vi.mock('../components/WishImport', () => ({
  WishImport: ({ onImportComplete }: { onImportComplete: (wishes: WishHistoryItem[]) => void }) => (
    <div data-testid="wish-import">
      <button onClick={() => onImportComplete(mockWishHistory)}>Import Wishes</button>
    </div>
  ),
}));

vi.mock('../components/WishHistoryList', () => ({
  WishHistoryList: () => <div data-testid="wish-history-list">Wish History List</div>,
}));

vi.mock('../components/WishStatistics', () => ({
  WishStatistics: () => <div data-testid="wish-statistics">Wish Statistics</div>,
}));

vi.mock('../components/PityTracker', () => ({
  PityTracker: () => <div data-testid="pity-tracker">Pity Tracker</div>,
}));

vi.mock('../components/WishManualEntry', () => ({
  WishManualEntry: () => <div data-testid="wish-manual-entry">Manual Entry</div>,
}));

vi.mock('../components/PullHistoryChart', () => ({
  PullHistoryChart: () => <div data-testid="pull-history-chart">Pull History Chart</div>,
}));

// Mock the UI store
vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    settings: {
      showManualWishEntry: false,
    },
  }),
}));

describe('WishHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial loading', () => {
    it('shows loading state initially', () => {
      render(<WishHistoryPage />);

      expect(screen.getByText(/loading wish history/i)).toBeInTheDocument();
    });
  });

  describe('empty state (no wish history)', () => {
    it('renders page title', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /wish history tracker/i })).toBeInTheDocument();
      });
    });

    it('shows import section when no history exists', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('wish-import')).toBeInTheDocument();
      });
    });

    it('shows manual entry option', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('wish-manual-entry')).toBeInTheDocument();
      });
    });
  });

  describe('with wish history', () => {
    beforeEach(async () => {
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue(mockWishHistory);
    });

    it('hides import section when history exists', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('wish-import')).not.toBeInTheDocument();
      });
    });

    it('shows re-import button', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /re-import wish history/i })).toBeInTheDocument();
      });
    });

    it('shows banner tabs', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /character event/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /weapon event/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /standard/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /chronicled wish/i })).toBeInTheDocument();
      });
    });

    it('shows pity tracker', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pity-tracker')).toBeInTheDocument();
      });
    });

    it('shows pull history chart', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pull-history-chart')).toBeInTheDocument();
      });
    });

    it('shows statistics section', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('wish-statistics')).toBeInTheDocument();
      });
    });

    it('shows wish history list', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('wish-history-list')).toBeInTheDocument();
      });
    });
  });

  describe('banner tab switching', () => {
    beforeEach(async () => {
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue(mockWishHistory);
    });

    it('character event tab is selected by default', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        const characterTab = screen.getByRole('button', { name: /character event/i });
        expect(characterTab).toHaveClass('border-blue-500');
      });
    });

    it('can switch to weapon banner tab', async () => {
      const user = userEvent.setup();
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /weapon event/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /weapon event/i }));

      expect(screen.getByRole('button', { name: /weapon event/i })).toHaveClass('border-blue-500');
    });

    it('can switch to standard banner tab', async () => {
      const user = userEvent.setup();
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /standard/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /standard/i }));

      expect(screen.getByRole('button', { name: /standard/i })).toHaveClass('border-blue-500');
    });
  });

  describe('re-import flow', () => {
    beforeEach(async () => {
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue(mockWishHistory);
    });

    it('shows import section when re-import button is clicked', async () => {
      const user = userEvent.setup();
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /re-import wish history/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /re-import wish history/i }));

      expect(screen.getByTestId('wish-import')).toBeInTheDocument();
    });
  });

  describe('manual entry section', () => {
    beforeEach(async () => {
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue(mockWishHistory);
    });

    it('manual entry section is collapsed by default', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByText(/manual wish entry/i)).toBeInTheDocument();
      });

      // The manual entry should be in a collapsible section
      const expandButton = screen.getByRole('button', { name: /manual wish entry/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('can expand manual entry section', async () => {
      const user = userEvent.setup();
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manual wish entry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /manual wish entry/i }));

      // After clicking, the manual entry form should be visible
      expect(screen.getByTestId('wish-manual-entry')).toBeInTheDocument();
    });
  });

  describe('import completion', () => {
    beforeEach(async () => {
      // Reset the mock to return empty array (no history) for import tests
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue([]);
    });

    it('updates wish history after import', async () => {
      const user = userEvent.setup();
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('wish-import')).toBeInTheDocument();
      });

      // Click the mock import button
      await user.click(screen.getByRole('button', { name: /import wishes/i }));

      // After import, the import section should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('wish-import')).not.toBeInTheDocument();
      });
    });
  });

  describe('section headings', () => {
    beforeEach(async () => {
      const { loadWishHistoryFromRepo } = await import('../utils/wishHistory');
      vi.mocked(loadWishHistoryFromRepo).mockResolvedValue(mockWishHistory);
    });

    it('shows current pity heading', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /current pity/i })).toBeInTheDocument();
      });
    });

    it('shows pull history heading', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /pull history/i })).toBeInTheDocument();
      });
    });

    it('shows statistics heading', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /statistics/i })).toBeInTheDocument();
      });
    });

    it('shows wish history heading', async () => {
      render(<WishHistoryPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^wish history$/i })).toBeInTheDocument();
      });
    });
  });
});
