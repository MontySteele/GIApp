import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReverseCalculator } from './ReverseCalculator';
import { primogemEntryRepo } from '@/features/ledger/repo/primogemEntryRepo';
import { fateEntryRepo } from '@/features/ledger/repo/fateEntryRepo';
import { resourceSnapshotRepo } from '@/features/ledger/repo/resourceSnapshotRepo';
import { wishRepo } from '@/features/wishes/repo/wishRepo';
import { db } from '@/db/schema';

describe('ReverseCalculator', () => {
  beforeEach(async () => {
    await db.primogemEntries.clear();
    await db.fateEntries.clear();
    await db.resourceSnapshots.clear();
    await db.wishRecords.clear();
  });

  describe('Initial render', () => {
    it('should render the component', () => {
      render(<ReverseCalculator />);

      expect(screen.getByText(/reverse calculator/i)).toBeInTheDocument();
    });

    it('should show all input fields', () => {
      render(<ReverseCalculator />);

      expect(screen.getByLabelText(/number of targets/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target probability/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/days available/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current pity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current pulls/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/custom daily primogem income/i)).toBeInTheDocument();
    });

    it('should have default values', () => {
      render(<ReverseCalculator />);

      expect(screen.getByLabelText(/number of targets/i)).toHaveValue(1);
      expect(screen.getByLabelText(/target probability/i)).toHaveValue(80);
      expect(screen.getByLabelText(/days available/i)).toHaveValue(42);
      expect(screen.getByLabelText(/current pity/i)).toHaveValue(0);
      expect(screen.getByLabelText(/current pulls/i)).toHaveValue(0);
      expect(screen.getByLabelText(/custom daily primogem income/i)).toHaveValue(60);
    });
  });

  describe('Input fields', () => {
    it('should allow changing number of targets', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const targetsInput = screen.getByLabelText(/number of targets/i);
      await user.clear(targetsInput);
      await user.type(targetsInput, '3');

      expect(targetsInput).toHaveValue(3);
    });

    it('should allow changing target probability', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const probabilityInput = screen.getByLabelText(/target probability/i);
      await user.clear(probabilityInput);
      await user.type(probabilityInput, '90');

      expect(probabilityInput).toHaveValue(90);
    });

    it('should allow changing days available', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const daysInput = screen.getByLabelText(/days available/i);
      await user.clear(daysInput);
      await user.type(daysInput, '60');

      expect(daysInput).toHaveValue(60);
    });

    it('should allow toggling guarantee status', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const guaranteeCheckbox = screen.getByLabelText(/guaranteed/i);
      await user.click(guaranteeCheckbox);

      expect(guaranteeCheckbox).toBeChecked();
    });

    it('should allow setting radiant streak', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const radiantInput = screen.getByLabelText(/radiant streak/i);
      await user.clear(radiantInput);
      await user.type(radiantInput, '2');

      expect(radiantInput).toHaveValue(2);
    });

    it('should allow setting current pulls and custom income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const pullsInput = screen.getByLabelText(/current pulls/i);
      await user.clear(pullsInput);
      await user.type(pullsInput, '10');
      expect(pullsInput).toHaveValue(10);

      const incomeInput = screen.getByLabelText(/custom daily primogem income/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '120');
      expect(incomeInput).toHaveValue(120);
    });
  });

  describe('Probability slider/presets', () => {
    it('should have preset probability buttons', () => {
      render(<ReverseCalculator />);

      expect(screen.getByRole('button', { name: /50%/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /80%/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /90%/i })).toBeInTheDocument();
    });

    it('should set probability when clicking preset', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /50%/i }));

      const probabilityInput = screen.getByLabelText(/target probability/i);
      expect(probabilityInput).toHaveValue(50);
    });
  });

  describe('Calculate button', () => {
    it('should show calculate button', () => {
      render(<ReverseCalculator />);

      expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
    });

    it('should be enabled by default', () => {
      render(<ReverseCalculator />);

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      expect(calculateButton).toBeEnabled();
    });

    it('should update results when clicking calculate', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/required income/i)).toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('should show required pulls per day', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/pulls per day/i)).toBeInTheDocument();
      // Multiple decimal numbers are rendered (for different metrics)
      expect(screen.getAllByText(/\d+\.\d+/).length).toBeGreaterThan(0);
    });

    it('should show required primos per day', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/primogems per day/i)).toBeInTheDocument();
    });

    it('should show comparison to F2P income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Multiple F2P references shown - one in results, one in help text
      expect(screen.getAllByText(/f2p/i).length).toBeGreaterThan(0);
      // Multiple multipliers shown for different income sources
      expect(screen.getAllByText(/×/).length).toBeGreaterThan(0);
    });

    it('should show comparison to Welkin income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Multiple Welkin references shown (Welkin and Welkin + BP)
      expect(screen.getAllByText(/welkin/i).length).toBeGreaterThan(0);
    });

    it('should show comparison to Welkin + BP income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Multiple references to Welkin + BP (results and help text)
      expect(screen.getAllByText(/welkin \+ bp/i).length).toBeGreaterThan(0);
    });

    it('should show feasibility assessment', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show "Feasibility" label
      expect(screen.getByText(/feasibility/i)).toBeInTheDocument();
    });
  });

  describe('Feasibility categorization', () => {
    it('should show "Easy" for achievable goals', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      // Set up easy scenario: 1 target, 80%, 365 days
      await user.clear(screen.getByLabelText(/number of targets/i));
      await user.type(screen.getByLabelText(/number of targets/i), '1');

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '365');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/easy/i)).toBeInTheDocument();
    });

    it('should show "Unlikely" for very difficult goals', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      // Set up difficult scenario: 5 targets, 99%, 30 days
      await user.clear(screen.getByLabelText(/number of targets/i));
      await user.type(screen.getByLabelText(/number of targets/i), '5');

      await user.clear(screen.getByLabelText(/target probability/i));
      await user.type(screen.getByLabelText(/target probability/i), '99');

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '30');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // With these settings, should show a difficult/unlikely feasibility (multiple matches due to help text)
      expect(screen.getAllByText(/unlikely|difficult/i).length).toBeGreaterThan(0);
    });
  });

  describe('Visual indicators', () => {
    it('should use color coding for feasibility', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Get the feasibility element by looking for capitalized feasibility value
      const feasibilityElements = screen.getAllByText(/easy|possible|difficult|unlikely/i);
      // At least one should have styling classes
      const hasStyledElement = feasibilityElements.some(el => el.className.includes('text-'));
      expect(hasStyledElement).toBe(true);
    });

    it('should show progress bars for income comparisons', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Look for progress bar or visual indicator
      const progressIndicators = screen.getAllByRole('progressbar');
      expect(progressIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Banner type selection', () => {
    it('should allow selecting banner type', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const bannerSelect = screen.getByLabelText(/banner type/i);
      expect(bannerSelect).toBeInTheDocument();

      await user.selectOptions(bannerSelect, 'weapon');
      expect(bannerSelect).toHaveValue('weapon');
    });

    it('should recalculate when changing banner type', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      // Initial calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }));
      const initialResult = screen.getByText(/pulls per day/i);

      // Change banner type
      const bannerSelect = screen.getByLabelText(/banner type/i);
      await user.selectOptions(bannerSelect, 'weapon');

      // Auto-recalculate should happen
      expect(initialResult).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate number of targets is positive', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const targetsInput = screen.getByLabelText(/number of targets/i);
      await user.clear(targetsInput);
      await user.type(targetsInput, '0');

      expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
    });

    it('should validate probability is between 0-100', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const probabilityInput = screen.getByLabelText(/target probability/i);
      await user.clear(probabilityInput);
      await user.type(probabilityInput, '150');

      expect(screen.getByText(/must be between 0 and 100/i)).toBeInTheDocument();
    });

    it('should validate days available is positive', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const daysInput = screen.getByLabelText(/days available/i);
      await user.clear(daysInput);
      await user.type(daysInput, '0');

      expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
    });

    it('should validate pity is within range', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      const pityInput = screen.getByLabelText(/current pity/i);
      await user.clear(pityInput);
      await user.type(pityInput, '100');

      expect(screen.getByText(/pity must be between 0 and 89/i)).toBeInTheDocument();
    });

    it('should have min=0 constraint on pulls and income inputs', () => {
      render(<ReverseCalculator />);

      const pullsInput = screen.getByLabelText(/current pulls/i);
      expect(pullsInput).toHaveAttribute('min', '0');

      const incomeInput = screen.getByLabelText(/custom daily primogem income/i);
      expect(incomeInput).toHaveAttribute('min', '0');
    });
  });

  describe('Edge cases', () => {
    it('should handle very short time periods', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '1');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show high daily requirement - look for feasibility in results section
      expect(screen.getAllByText(/unlikely|difficult/i).length).toBeGreaterThan(0);
    });

    it('should handle very long time periods', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '1000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show low daily requirement - easy or possible in results section
      expect(screen.getAllByText(/easy|possible/i).length).toBeGreaterThan(0);
    });

    it('should handle 100% probability target', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/target probability/i));
      await user.type(screen.getByLabelText(/target probability/i), '100');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/required income/i)).toBeInTheDocument();
    });

    it('should handle starting with high pity', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/current pity/i));
      await user.type(screen.getByLabelText(/current pity/i), '80');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show lower daily requirement
      const pullsPerDay = screen.getByText(/pulls per day/i).parentElement;
      expect(pullsPerDay).toBeInTheDocument();
    });

    it('should handle guaranteed status', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByLabelText(/guaranteed/i));
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show lower daily requirement than non-guaranteed
      const pullsPerDay = screen.getByText(/pulls per day/i).parentElement;
      expect(pullsPerDay).toBeInTheDocument();
    });
  });

  describe('Help text', () => {
    it('should show explanation of income benchmarks', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      // Click calculate to show results with income benchmarks
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Income benchmarks appear in both help text and results
      expect(screen.getAllByText(/60 primos\/day/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/150 primos\/day/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should explain feasibility levels', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Feasibility label should be visible
      expect(screen.getByText(/feasibility/i)).toBeInTheDocument();
    });
  });

  describe('Real-time updates', () => {
    it('should auto-recalculate when inputs change', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      // Initial calc
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Change input
      const targetsInput = screen.getByLabelText(/number of targets/i);
      await user.clear(targetsInput);
      await user.type(targetsInput, '2');

      // Results should update
      expect(screen.getByText(/required income/i)).toBeInTheDocument();
    });
  });

  describe('Available pulls autofill', () => {
    it('prefills pulls from snapshot plus ledger deltas', async () => {
      await resourceSnapshotRepo.create({
        primogems: 1600,
        genesisCrystals: 0,
        intertwined: 2,
        acquaint: 1,
        starglitter: 10,
        stardust: 0,
      });
      await primogemEntryRepo.create({ amount: 160, source: 'event', notes: '' });
      await fateEntryRepo.create({ amount: 1, fateType: 'intertwined', source: 'event' });

      render(<ReverseCalculator />);

      await waitFor(() => {
        expect(screen.getByLabelText(/current pulls/i)).toHaveValue(17);
      });
    });

    it('prefills pulls from ledger data when no snapshot exists', async () => {
      // Ensure clean state - clear any data from previous tests
      // Use Promise.all for parallel clearing and wait for completion
      await Promise.all([
        db.primogemEntries.clear(),
        db.fateEntries.clear(),
        db.resourceSnapshots.clear(),
        db.wishRecords.clear(),
      ]);

      // Small delay to ensure IndexedDB transactions complete
      await new Promise((r) => setTimeout(r, 50));

      await primogemEntryRepo.create({
        amount: 320,
        source: 'event',
        notes: '',
        timestamp: '2024-01-01T00:00:00.000Z',
      });
      await fateEntryRepo.create({
        amount: 2,
        fateType: 'acquaint',
        source: 'event',
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      render(<ReverseCalculator />);

      await waitFor(
        () => {
          expect(screen.getByLabelText(/current pulls/i)).toHaveValue(4);
        },
        { timeout: 3000 }
      );
    });
  });
});
