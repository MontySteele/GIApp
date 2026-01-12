import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LedgerPage from './LedgerPage';

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((queryFn) => {
    // Return mock data based on the query function
    return [];
  }),
}));

// Mock repositories
vi.mock('../repo/primogemEntryRepo', () => ({
  primogemEntryRepo: {
    getAll: vi.fn().mockResolvedValue([]),
    getByDateRange: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../repo/fateEntryRepo', () => ({
  fateEntryRepo: {
    getAll: vi.fn().mockResolvedValue([]),
    getByDateRange: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../repo/resourceSnapshotRepo', () => ({
  resourceSnapshotRepo: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}));

vi.mock('@/features/wishes/repo/wishRepo', () => ({
  wishRepo: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

// Mock components
vi.mock('../components/UnifiedChart', () => ({
  UnifiedChart: () => <div data-testid="unified-chart">Unified Chart</div>,
}));

vi.mock('../components/TransactionLog', () => ({
  TransactionLog: () => <div data-testid="transaction-log">Transaction Log</div>,
}));

vi.mock('../components/PurchaseLedger', () => ({
  PurchaseLedger: () => <div data-testid="purchase-ledger">Purchase Ledger</div>,
}));

// Mock domain functions
vi.mock('../domain/resourceCalculations', () => ({
  calculateAvailablePulls: vi.fn().mockReturnValue(50),
  calculateWishSpending: vi.fn().mockReturnValue({
    totalPulls: 10,
    primogemEquivalent: 1600,
    pullsByFate: { intertwined: 5, acquaint: 5 },
  }),
}));

describe('LedgerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<LedgerPage />);

      expect(screen.getByRole('heading', { name: /primogem tracker/i })).toBeInTheDocument();
      expect(screen.getByText(/track your primogem stash/i)).toBeInTheDocument();
    });

    it('renders all summary cards', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/current primogems/i)).toBeInTheDocument();
      expect(screen.getByText(/purchased primogems/i)).toBeInTheDocument();
      expect(screen.getByText(/wishes available/i)).toBeInTheDocument();
      expect(screen.getByText(/pulls since snapshot/i)).toBeInTheDocument();
    });

    it('renders resource snapshot section', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/resource snapshot/i)).toBeInTheDocument();
    });

    it('renders unified chart section', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/primogem history & projection/i)).toBeInTheDocument();
      expect(screen.getByTestId('unified-chart')).toBeInTheDocument();
    });

    it('renders purchase ledger section', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/purchase ledger/i)).toBeInTheDocument();
    });

    it('renders transaction log section', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/transaction log/i)).toBeInTheDocument();
    });
  });

  describe('summary card values', () => {
    it('displays zero primogems initially', () => {
      render(<LedgerPage />);

      // Current primogems should show 0 when no snapshot
      const primogemCard = screen.getByText(/current primogems/i).closest('div');
      expect(primogemCard).toHaveTextContent('0');
    });

    it('shows add snapshot message when no snapshots', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/add a snapshot to track/i)).toBeInTheDocument();
    });
  });

  describe('collapsible sections', () => {
    it('snapshot section is expanded by default', () => {
      render(<LedgerPage />);

      // Snapshot inputs should be visible
      expect(screen.getByText(/enter your current in-game values/i)).toBeInTheDocument();
    });

    it('can collapse snapshot section', async () => {
      const user = userEvent.setup();
      render(<LedgerPage />);

      // Click to collapse
      const sectionHeader = screen.getByText(/resource snapshot/i).closest('button');
      if (sectionHeader) {
        await user.click(sectionHeader);
      }

      // Content should be hidden (the input fields)
      await waitFor(() => {
        expect(screen.queryByText(/enter your current in-game values/i)).not.toBeInTheDocument();
      });
    });

    it('purchase ledger is expanded by default', () => {
      render(<LedgerPage />);

      expect(screen.getByTestId('purchase-ledger')).toBeInTheDocument();
    });

    it('transaction log is collapsed by default', () => {
      render(<LedgerPage />);

      // Transaction log should not show its content initially
      expect(screen.queryByTestId('transaction-log')).not.toBeInTheDocument();
    });

    it('can expand transaction log', async () => {
      const user = userEvent.setup();
      render(<LedgerPage />);

      // Find the transaction log header button
      const transactionLogHeader = screen.getByText(/transaction log/i).closest('button');
      if (transactionLogHeader) {
        await user.click(transactionLogHeader);
      }

      await waitFor(() => {
        expect(screen.getByTestId('transaction-log')).toBeInTheDocument();
      });
    });
  });

  describe('snapshot form', () => {
    it('renders all snapshot input fields', () => {
      render(<LedgerPage />);

      expect(screen.getByLabelText(/primogems/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/genesis crystals/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/intertwined fates/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/acquaint fates/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/starglitter/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stardust/i)).toBeInTheDocument();
    });

    it('renders save snapshot button', () => {
      render(<LedgerPage />);

      expect(screen.getByRole('button', { name: /save snapshot/i })).toBeInTheDocument();
    });

    it('can enter values in snapshot form', async () => {
      const user = userEvent.setup();
      render(<LedgerPage />);

      const primogemsInput = screen.getByLabelText(/^primogems$/i);
      await user.clear(primogemsInput);
      await user.type(primogemsInput, '15000');

      expect(primogemsInput).toHaveValue(15000);
    });
  });

  describe('section descriptions', () => {
    it('shows snapshot description', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/ground truth for calculations/i)).toBeInTheDocument();
    });

    it('shows chart description', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/historical values reconstructed/i)).toBeInTheDocument();
    });

    it('shows purchase ledger description', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/track primogem purchases separately/i)).toBeInTheDocument();
    });

    it('shows transaction log description', () => {
      render(<LedgerPage />);

      expect(screen.getByText(/unified view of snapshots/i)).toBeInTheDocument();
    });
  });
});
