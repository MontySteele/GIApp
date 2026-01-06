import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SingleTargetCalculator from './SingleTargetCalculator';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

const mockUseCurrentPity = vi.fn();

vi.mock('@/features/wishes/hooks/useCurrentPity', () => ({
  useCurrentPity: () => mockUseCurrentPity(),
}));

describe('SingleTargetCalculator defaults', () => {
  beforeEach(() => {
    mockUseCurrentPity.mockReturnValue(null);
    useUIStore.persist?.clearStorage();
    useUIStore.setState((state) => ({
      ...state,
      settings: {
        ...DEFAULT_SETTINGS,
        calculatorDefaults: {
          ...DEFAULT_SETTINGS.calculatorDefaults,
          availablePulls: 120,
          targetProbability: 75,
          pityPreset: {
            pity: 10,
            guaranteed: true,
            radiantStreak: 2,
          },
        },
      },
    }));
  });

  it('initializes inputs from calculator defaults', () => {
    render(<SingleTargetCalculator />);

    expect(screen.getByLabelText(/current pity/i)).toHaveValue(10);
    expect(screen.getByLabelText(/available pulls/i)).toHaveValue(120);
    expect(screen.getByLabelText(/guarantee status/i)).toHaveValue('guaranteed');
    expect(screen.getByLabelText(/radiant streak/i)).toHaveValue(2);
  });

  it('resets to stored defaults', async () => {
    const user = userEvent.setup();
    render(<SingleTargetCalculator />);

    await user.clear(screen.getByLabelText(/current pity/i));
    await user.type(screen.getByLabelText(/current pity/i), '5');
    await user.clear(screen.getByLabelText(/available pulls/i));
    await user.type(screen.getByLabelText(/available pulls/i), '5');
    await user.clear(screen.getByLabelText(/radiant streak/i));
    await user.type(screen.getByLabelText(/radiant streak/i), '0');
    await user.selectOptions(screen.getByLabelText(/guarantee status/i), 'not-guaranteed');

    await user.click(screen.getByRole('button', { name: /reset to defaults/i }));

    expect(screen.getByLabelText(/current pity/i)).toHaveValue(10);
    expect(screen.getByLabelText(/available pulls/i)).toHaveValue(120);
    expect(screen.getByLabelText(/guarantee status/i)).toHaveValue('guaranteed');
    expect(screen.getByLabelText(/radiant streak/i)).toHaveValue(2);
  });
});
