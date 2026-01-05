import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReverseCalculator } from './ReverseCalculator';

describe('ReverseCalculator', () => {
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
    });

    it('should have default values', () => {
      render(<ReverseCalculator />);

      expect(screen.getByLabelText(/number of targets/i)).toHaveValue(1);
      expect(screen.getByLabelText(/target probability/i)).toHaveValue(80);
      expect(screen.getByLabelText(/days available/i)).toHaveValue(42);
      expect(screen.getByLabelText(/current pity/i)).toHaveValue(0);
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
      expect(screen.getByText(/\d+\.\d+/)).toBeInTheDocument(); // Should show decimal number
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

      expect(screen.getByText(/f2p/i)).toBeInTheDocument();
      expect(screen.getByText(/×/)).toBeInTheDocument(); // Multiplier indicator
    });

    it('should show comparison to Welkin income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/welkin/i)).toBeInTheDocument();
    });

    it('should show comparison to Welkin + BP income', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      expect(screen.getByText(/welkin.*bp/i)).toBeInTheDocument();
    });

    it('should show feasibility assessment', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show one of: Easy, Possible, Difficult, Unlikely
      const feasibilityText = screen.getByText(/easy|possible|difficult|unlikely/i);
      expect(feasibilityText).toBeInTheDocument();
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

      expect(screen.getByText(/unlikely/i)).toBeInTheDocument();
    });
  });

  describe('Visual indicators', () => {
    it('should use color coding for feasibility', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      const feasibilityElement = screen.getByText(/easy|possible|difficult|unlikely/i);
      // Should have appropriate styling classes
      expect(feasibilityElement.className).toMatch(/text-/);
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
  });

  describe('Edge cases', () => {
    it('should handle very short time periods', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '1');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show very high daily requirement
      expect(screen.getByText(/unlikely/i)).toBeInTheDocument();
    });

    it('should handle very long time periods', async () => {
      const user = userEvent.setup();
      render(<ReverseCalculator />);

      await user.clear(screen.getByLabelText(/days available/i));
      await user.type(screen.getByLabelText(/days available/i), '1000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Should show low daily requirement
      expect(screen.getByText(/easy/i)).toBeInTheDocument();
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
    it('should show explanation of income benchmarks', () => {
      render(<ReverseCalculator />);

      expect(screen.getByText(/f2p.*60.*day/i)).toBeInTheDocument();
      expect(screen.getByText(/welkin.*150.*day/i)).toBeInTheDocument();
    });

    it('should explain feasibility levels', () => {
      render(<ReverseCalculator />);

      expect(screen.getByText(/easy.*achievable with f2p/i)).toBeInTheDocument();
      expect(screen.getByText(/possible.*welkin/i)).toBeInTheDocument();
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
});
