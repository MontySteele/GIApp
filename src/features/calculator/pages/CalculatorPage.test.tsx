import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalculatorPage from './CalculatorPage';

// Mock the calculator components
vi.mock('../components/SingleTargetCalculator', () => ({
  default: () => <div data-testid="single-target-calculator">Single Target Calculator</div>,
}));

vi.mock('../components/MultiTargetCalculator', () => ({
  MultiTargetCalculator: () => <div data-testid="multi-target-calculator">Multi Target Calculator</div>,
}));

vi.mock('../components/ReverseCalculator', () => ({
  ReverseCalculator: () => <div data-testid="reverse-calculator">Reverse Calculator</div>,
}));

describe('CalculatorPage', () => {
  describe('rendering', () => {
    it('renders the page header', () => {
      render(<CalculatorPage />);

      expect(screen.getByRole('heading', { name: /pull calculator/i })).toBeInTheDocument();
      expect(screen.getByText(/calculate probabilities/i)).toBeInTheDocument();
    });

    it('renders all tab buttons', () => {
      render(<CalculatorPage />);

      expect(screen.getByRole('button', { name: /single target/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /multi-target/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reverse calculator/i })).toBeInTheDocument();
    });

    it('shows single target calculator by default', () => {
      render(<CalculatorPage />);

      expect(screen.getByTestId('single-target-calculator')).toBeInTheDocument();
      expect(screen.queryByTestId('multi-target-calculator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('reverse-calculator')).not.toBeInTheDocument();
    });

    it('highlights the active tab', () => {
      render(<CalculatorPage />);

      const singleTargetTab = screen.getByRole('button', { name: /single target/i });
      expect(singleTargetTab).toHaveClass('bg-primary-600');
    });
  });

  describe('tab navigation', () => {
    it('switches to multi-target calculator when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<CalculatorPage />);

      await user.click(screen.getByRole('button', { name: /multi-target/i }));

      expect(screen.getByTestId('multi-target-calculator')).toBeInTheDocument();
      expect(screen.queryByTestId('single-target-calculator')).not.toBeInTheDocument();
    });

    it('switches to reverse calculator when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<CalculatorPage />);

      await user.click(screen.getByRole('button', { name: /reverse calculator/i }));

      expect(screen.getByTestId('reverse-calculator')).toBeInTheDocument();
      expect(screen.queryByTestId('single-target-calculator')).not.toBeInTheDocument();
    });

    it('can switch back to single target from another tab', async () => {
      const user = userEvent.setup();
      render(<CalculatorPage />);

      // Go to multi-target
      await user.click(screen.getByRole('button', { name: /multi-target/i }));
      expect(screen.getByTestId('multi-target-calculator')).toBeInTheDocument();

      // Go back to single target
      await user.click(screen.getByRole('button', { name: /single target/i }));
      expect(screen.getByTestId('single-target-calculator')).toBeInTheDocument();
    });

    it('updates tab styling when switching tabs', async () => {
      const user = userEvent.setup();
      render(<CalculatorPage />);

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
      render(<CalculatorPage />);

      const tabs = screen.getAllByRole('button');
      // Each tab button should contain an SVG icon
      tabs.forEach((tab) => {
        const svg = tab.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });
});
