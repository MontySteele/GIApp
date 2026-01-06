import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiTargetCalculator } from './MultiTargetCalculator';
import * as montecarloClient from '@/workers/montecarloClient';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

const runSimulationMock = vi.fn();

vi.mock('@/workers/montecarloClient', () => ({
  createMonteCarloWorker: vi.fn(() => ({
    worker: { terminate: vi.fn() } as unknown as Worker,
    api: {
      runSimulation: vi.fn(),
    },
  })),
}));

const createMonteCarloWorkerMock = vi.mocked(montecarloClient.createMonteCarloWorker);

describe('MultiTargetCalculator', () => {
  beforeEach(() => {
    useUIStore.persist?.clearStorage();
    useUIStore.setState((state) => ({
      ...state,
      settings: { ...DEFAULT_SETTINGS },
    }));
    runSimulationMock.mockClear();
    createMonteCarloWorkerMock.mockClear();

    runSimulationMock.mockImplementation(async (input, reportProgress) => {
      reportProgress?.(0.5);
      reportProgress?.(1);

      return {
        perCharacter: input.targets.map((target: { characterKey: string }, index: number) => ({
          characterKey: target.characterKey,
          probability: input.startingPulls > 0 ? 0.66 : 0,
          averagePullsUsed: 30 + index,
          medianPullsUsed: 25 + index,
        })),
        allMustHavesProbability: input.startingPulls > 0 ? 0.66 : 0,
        pullTimeline: [],
      };
    });

    createMonteCarloWorkerMock.mockReturnValue({
      worker: { terminate: vi.fn() } as unknown as Worker,
      api: {
        runSimulation: runSimulationMock,
      },
    });
  });

  describe('Initial render', () => {
    it('should render the component with empty state', () => {
      render(<MultiTargetCalculator />);

      expect(screen.getByText(/multi-target/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add target/i })).toBeInTheDocument();
    });

    it('should show instructions when no targets added', () => {
      render(<MultiTargetCalculator />);

      expect(screen.getByText(/add characters you want to pull/i)).toBeInTheDocument();
    });
  });

  describe('Default settings', () => {
    it('prefills calculator values from stored defaults', async () => {
      const user = userEvent.setup();
      useUIStore.setState((state) => ({
        ...state,
        settings: {
          ...state.settings,
          calculatorDefaults: {
            ...state.settings.calculatorDefaults,
            bannerType: 'weapon',
            simulationCount: 20000,
            availablePulls: 75,
            pityPreset: {
              pity: 15,
              guaranteed: true,
              radiantStreak: 1,
            },
          },
        },
      }));

      render(<MultiTargetCalculator />);

      expect(screen.getByLabelText(/banner type/i)).toHaveValue('weapon');
      expect(screen.getByLabelText(/simulation count/i)).toHaveValue('20000');
      expect(screen.getByLabelText(/available pulls/i)).toHaveValue(75);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      expect(screen.getByLabelText(/current pity/i)).toHaveValue(15);
      expect(screen.getByLabelText(/guaranteed/i)).toBeChecked();
      expect(screen.getByLabelText(/radiant streak/i)).toHaveValue(1);
    });
  });

  describe('Adding targets', () => {
    it('should add a new target when clicking Add Target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      const addButton = screen.getByRole('button', { name: /add target/i });
      await user.click(addButton);

      expect(screen.getByPlaceholderText(/character name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current pity/i)).toBeInTheDocument();
    });

    it('should allow adding multiple targets', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      const addButton = screen.getByRole('button', { name: /add target/i });
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      const characterInputs = screen.getAllByPlaceholderText(/character name/i);
      expect(characterInputs).toHaveLength(3);
    });

    it('should initialize targets with default values', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const pityInput = screen.getByLabelText(/current pity/i);
      expect(pityInput).toHaveValue(0);

      const guaranteeCheckbox = screen.getByLabelText(/guaranteed/i);
      expect(guaranteeCheckbox).not.toBeChecked();
    });
  });

  describe('Editing targets', () => {
    it('should allow entering character name', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const nameInput = screen.getByPlaceholderText(/character name/i);
      await user.type(nameInput, 'Furina');

      expect(nameInput).toHaveValue('Furina');
    });

    it('should allow setting pity value', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const pityInput = screen.getByLabelText(/current pity/i);
      await user.clear(pityInput);
      await user.type(pityInput, '70');

      expect(pityInput).toHaveValue(70);
    });

    it('should allow toggling guarantee status', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const guaranteeCheckbox = screen.getByLabelText(/guaranteed/i);
      await user.click(guaranteeCheckbox);

      expect(guaranteeCheckbox).toBeChecked();
    });

    it('should allow setting radiant streak', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const radiantInput = screen.getByLabelText(/radiant streak/i);
      await user.clear(radiantInput);
      await user.type(radiantInput, '2');

      expect(radiantInput).toHaveValue(2);
    });
  });

  describe('Removing targets', () => {
    it('should allow removing a target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.click(screen.getByRole('button', { name: /add target/i }));

      expect(screen.getAllByPlaceholderText(/character name/i)).toHaveLength(2);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      expect(screen.getAllByPlaceholderText(/character name/i)).toHaveLength(1);
    });

    it('should clear results when removing a target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      // Add targets and calculate (would show results)
      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');

      // Remove target
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Results should be cleared
      expect(screen.queryByText(/probability/i)).not.toBeInTheDocument();
    });
  });

  describe('Reordering targets', () => {
    it('should allow moving targets up in priority', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.click(screen.getByRole('button', { name: /add target/i }));

      const nameInputs = screen.getAllByPlaceholderText(/character name/i);
      await user.type(nameInputs[0], 'Furina');
      await user.type(nameInputs[1], 'Neuvillette');

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
      await user.click(moveUpButtons[1]); // Move Neuvillette up

      const updatedInputs = screen.getAllByPlaceholderText(/character name/i);
      expect(updatedInputs[0]).toHaveValue('Neuvillette');
      expect(updatedInputs[1]).toHaveValue('Furina');
    });

    it('should disable move up button for first target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const moveUpButton = screen.getByRole('button', { name: /move up/i });
      expect(moveUpButton).toBeDisabled();
    });

    it('should disable move down button for last target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const moveDownButton = screen.getByRole('button', { name: /move down/i });
      expect(moveDownButton).toBeDisabled();
    });
  });

  describe('Available pulls input', () => {
    it('should show available pulls input field', () => {
      render(<MultiTargetCalculator />);

      expect(screen.getByLabelText(/available pulls/i)).toBeInTheDocument();
    });

    it('should allow setting available pulls', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      const pullsInput = screen.getByLabelText(/available pulls/i);
      await user.clear(pullsInput);
      await user.type(pullsInput, '200');

      expect(pullsInput).toHaveValue(200);
    });
  });

  describe('Calculate button', () => {
    it('should be disabled when no targets added', () => {
      render(<MultiTargetCalculator />);

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      expect(calculateButton).toBeDisabled();
    });

    it('should be enabled when targets are added', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      expect(calculateButton).toBeEnabled();
    });

    it('should show loading state when calculating', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should show loading state briefly
      expect(screen.getByText(/calculating/i)).toBeInTheDocument();
    });
  });

  describe('Results display', () => {
    it('should display success probability after calculation', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');
      await user.type(screen.getByLabelText(/available pulls/i), '100');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText(/probability of getting all targets/i)).toBeInTheDocument();
      });
    });

    it('should display per-character probabilities', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getAllByPlaceholderText(/character name/i)[0], 'Furina');

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getAllByPlaceholderText(/character name/i)[1], 'Neuvillette');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText(/furina/i)).toBeInTheDocument();
        expect(screen.getByText(/neuvillette/i)).toBeInTheDocument();
      });
    });

    it('should show pulls used for each target', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText(/average pulls/i)).toBeInTheDocument();
      });
    });
  });

  describe('Banner type selection', () => {
    it('should allow selecting banner type', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      const bannerSelect = screen.getByLabelText(/banner type/i);
      expect(bannerSelect).toBeInTheDocument();

      await user.selectOptions(bannerSelect, 'character');
      expect(bannerSelect).toHaveValue('character');
    });

    it('should default to character banner', () => {
      render(<MultiTargetCalculator />);

      const bannerSelect = screen.getByLabelText(/banner type/i);
      expect(bannerSelect).toHaveValue('character');
    });
  });

  describe('Validation', () => {
    it('should validate pity is within range', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const pityInput = screen.getByLabelText(/current pity/i);
      await user.clear(pityInput);
      await user.type(pityInput, '100');

      expect(screen.getByText(/pity must be between 0 and 89/i)).toBeInTheDocument();
    });

    it('should validate radiant streak is valid', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const radiantInput = screen.getByLabelText(/radiant streak/i);
      await user.clear(radiantInput);
      await user.type(radiantInput, '5');

      expect(screen.getByText(/radiant streak should be 0-2/i)).toBeInTheDocument();
    });

    it('should require at least one target to calculate', async () => {
      render(<MultiTargetCalculator />);

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      expect(calculateButton).toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle calculation with 0 available pulls', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');

      const pullsInput = screen.getByLabelText(/available pulls/i);
      await user.clear(pullsInput);
      await user.type(pullsInput, '0');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText(/0%/i)).toBeInTheDocument();
      });
    });

    it('should handle very high pity values correctly', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));

      const pityInput = screen.getByLabelText(/current pity/i);
      await user.clear(pityInput);
      await user.type(pityInput, '89');

      expect(pityInput).toHaveValue(89);
    });
  });

  describe('Worker integration', () => {
    it('should send simulation input to the worker api', async () => {
      const user = userEvent.setup();
      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');
      await user.type(screen.getByLabelText(/available pulls/i), '120');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
      expect(runSimulationMock).toHaveBeenCalledTimes(1);
    });

      const input = runSimulationMock.mock.calls[0][0];
      expect(input.startingPulls).toBe(120);
      expect(input.targets[0].characterKey).toBe('Furina');
      expect(input.rules).toBeDefined();
      expect(input.config.iterations).toBe(5000);
    });

    it('should display results returned from the worker', async () => {
      const user = userEvent.setup();
      runSimulationMock.mockResolvedValueOnce({
        perCharacter: [
          {
            characterKey: 'Furina',
            probability: 0.9,
            averagePullsUsed: 50,
            medianPullsUsed: 45,
          },
        ],
        allMustHavesProbability: 0.9,
        pullTimeline: [],
      });

      render(<MultiTargetCalculator />);

      await user.click(screen.getByRole('button', { name: /add target/i }));
      await user.type(screen.getByPlaceholderText(/character name/i), 'Furina');
      await user.type(screen.getByLabelText(/available pulls/i), '160');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText(/90.0%/i)).toBeInTheDocument();
        expect(screen.getByText(/average pulls/i)).toBeInTheDocument();
      });
    });
  });
});
