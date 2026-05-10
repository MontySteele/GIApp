import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CalculatorPage from './CalculatorPage';

// Mock the calculator components
vi.mock('../components/SingleTargetCalculator', () => ({
  default: () => <div data-testid="single-target-calculator">Single Target Calculator</div>,
}));

vi.mock('../components/MultiTargetCalculator', () => ({
  MultiTargetCalculator: () => (
    <div data-testid="multi-target-calculator">
      Multi Target Calculator
      <input aria-label="multi draft" />
    </div>
  ),
}));

vi.mock('../components/ReverseCalculator', () => ({
  ReverseCalculator: () => <div data-testid="reverse-calculator">Reverse Calculator</div>,
}));

const mockWishDataFreshness = vi.hoisted(() => ({
  freshness: {
    status: 'fresh',
    lastUpdatedAt: '2026-05-10T00:00:00.000Z',
    daysSinceUpdate: 0,
    label: 'Wish history current',
    detail: 'Last wish history import was today.',
  },
}));

vi.mock('@/features/wishes/hooks/useWishDataFreshness', () => ({
  useWishDataFreshness: () => mockWishDataFreshness.freshness,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CalculatorPage />
    </MemoryRouter>
  );
}

describe('CalculatorPage', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/pulls/calculator');
    mockWishDataFreshness.freshness = {
      status: 'fresh',
      lastUpdatedAt: '2026-05-10T00:00:00.000Z',
      daysSinceUpdate: 0,
      label: 'Wish history current',
      detail: 'Last wish history import was today.',
    };
  });

  describe('rendering', () => {
    it('renders the page header', () => {
      renderPage();

      expect(screen.getByRole('heading', { name: /pull calculator/i })).toBeInTheDocument();
      expect(screen.getByText(/calculate probabilities/i)).toBeInTheDocument();
    });

    it('warns when wish history is stale', () => {
      mockWishDataFreshness.freshness = {
        status: 'stale',
        lastUpdatedAt: '2026-04-20T00:00:00.000Z',
        daysSinceUpdate: 20,
        label: 'Refresh wish history',
        detail: 'Last wish history import was 20 days ago.',
      };

      renderPage();

      expect(screen.getByText('Refresh wish history')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /refresh wishes/i })).toHaveAttribute('href', '/pulls/history');
    });

    it('renders all tab buttons', () => {
      renderPage();

      expect(screen.getByRole('button', { name: /single target/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /multi-target/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reverse calculator/i })).toBeInTheDocument();
    });

    it('shows single target calculator by default', () => {
      renderPage();

      expect(screen.getByTestId('single-target-calculator')).toBeVisible();
      expect(screen.getByTestId('multi-target-calculator')).not.toBeVisible();
      expect(screen.getByTestId('reverse-calculator')).not.toBeVisible();
    });

    it('opens the multi-target calculator from URL mode params', () => {
      window.history.replaceState(null, '', '/pulls/calculator?mode=multi');

      renderPage();

      expect(screen.getByTestId('multi-target-calculator')).toBeVisible();
      expect(screen.getByTestId('single-target-calculator')).not.toBeVisible();
    });

    it('highlights the active tab', () => {
      renderPage();

      const singleTargetTab = screen.getByRole('button', { name: /single target/i });
      expect(singleTargetTab).toHaveClass('bg-primary-600');
    });
  });

  describe('tab navigation', () => {
    it('switches to multi-target calculator when tab is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /multi-target/i }));

      expect(screen.getByTestId('multi-target-calculator')).toBeVisible();
      expect(screen.getByTestId('single-target-calculator')).not.toBeVisible();
    });

    it('switches to reverse calculator when tab is clicked', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /reverse calculator/i }));

      expect(screen.getByTestId('reverse-calculator')).toBeVisible();
      expect(screen.getByTestId('single-target-calculator')).not.toBeVisible();
    });

    it('can switch back to single target from another tab', async () => {
      const user = userEvent.setup();
      renderPage();

      // Go to multi-target
      await user.click(screen.getByRole('button', { name: /multi-target/i }));
      expect(screen.getByTestId('multi-target-calculator')).toBeVisible();

      // Go back to single target
      await user.click(screen.getByRole('button', { name: /single target/i }));
      expect(screen.getByTestId('single-target-calculator')).toBeVisible();
      expect(screen.getByTestId('multi-target-calculator')).not.toBeVisible();
    });

    it('preserves multi-target edits while switching tabs', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /multi-target/i }));
      await user.type(screen.getByLabelText('multi draft'), 'Furina plan');
      await user.click(screen.getByRole('button', { name: /single target/i }));
      await user.click(screen.getByRole('button', { name: /multi-target/i }));

      expect(screen.getByLabelText('multi draft')).toHaveValue('Furina plan');
    });

    it('updates tab styling when switching tabs', async () => {
      const user = userEvent.setup();
      renderPage();

      const singleTargetTab = screen.getByRole('button', { name: /single target/i });
      const multiTargetTab = screen.getByRole('button', { name: /multi-target/i });

      // Initially single target is active
      expect(singleTargetTab).toHaveClass('bg-primary-600');
      expect(multiTargetTab).not.toHaveClass('bg-primary-600');

      // Click multi-target
      await user.click(multiTargetTab);

      // Now multi-target is active
      expect(multiTargetTab).toHaveClass('bg-primary-600');
      expect(singleTargetTab).not.toHaveClass('bg-primary-600');
    });
  });

  describe('tab icons', () => {
    it('each tab has an icon', () => {
      renderPage();

      const tabs = screen.getAllByRole('button');
      // Each tab button should contain an SVG icon
      tabs.forEach((tab) => {
        const svg = tab.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });
});
