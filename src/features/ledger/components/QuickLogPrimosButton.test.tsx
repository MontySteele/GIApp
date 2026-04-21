import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickLogPrimosButton from './QuickLogPrimosButton';
import { resourceSnapshotRepo } from '../repo/resourceSnapshotRepo';
import type { ResourceSnapshot } from '@/types';

vi.mock('../repo/resourceSnapshotRepo', () => ({
  resourceSnapshotRepo: {
    create: vi.fn(async () => 'new-id'),
  },
}));

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  custom: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => toastMock,
}));

function makeSnapshot(overrides: Partial<ResourceSnapshot> = {}): ResourceSnapshot {
  return {
    id: 'snap-1',
    timestamp: '2026-04-20T10:00:00.000Z',
    createdAt: '2026-04-20T10:00:00.000Z',
    primogems: 1200,
    genesisCrystals: 60,
    intertwined: 15,
    acquaint: 5,
    starglitter: 40,
    stardust: 900,
    ...overrides,
  };
}

describe('QuickLogPrimosButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the inline input when the button is clicked and autofocuses it', async () => {
    const user = userEvent.setup();
    render(<QuickLogPrimosButton latestSnapshot={makeSnapshot()} />);

    await user.click(screen.getByRole('button', { name: /quick log current primogems/i }));

    const input = await screen.findByLabelText(/current primogems/i);
    expect(input).toHaveFocus();
  });

  it('submits a new snapshot inheriting non-primo fields from the latest snapshot', async () => {
    const user = userEvent.setup();
    const latest = makeSnapshot({
      primogems: 1200,
      genesisCrystals: 60,
      intertwined: 15,
      acquaint: 5,
      starglitter: 40,
      stardust: 900,
    });
    render(<QuickLogPrimosButton latestSnapshot={latest} />);

    await user.click(screen.getByRole('button', { name: /quick log current primogems/i }));
    const input = await screen.findByLabelText(/current primogems/i);

    await user.clear(input);
    await user.type(input, '3500');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(resourceSnapshotRepo.create).toHaveBeenCalledTimes(1);
    });
    expect(resourceSnapshotRepo.create).toHaveBeenCalledWith({
      primogems: 3500,
      genesisCrystals: 60,
      intertwined: 15,
      acquaint: 5,
      starglitter: 40,
      stardust: 900,
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('falls back to zeros for non-primo fields when there is no previous snapshot', async () => {
    const user = userEvent.setup();
    render(<QuickLogPrimosButton latestSnapshot={undefined} />);

    await user.click(screen.getByRole('button', { name: /quick log current primogems/i }));
    const input = await screen.findByLabelText(/current primogems/i);

    await user.type(input, '500');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(resourceSnapshotRepo.create).toHaveBeenCalledWith({
        primogems: 500,
        genesisCrystals: 0,
        intertwined: 0,
        acquaint: 0,
        starglitter: 0,
        stardust: 0,
      });
    });
  });

  it('shows a toast and does not save when the input is negative', async () => {
    const user = userEvent.setup();
    render(<QuickLogPrimosButton latestSnapshot={makeSnapshot()} />);

    await user.click(screen.getByRole('button', { name: /quick log current primogems/i }));
    const input = await screen.findByLabelText(/current primogems/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '-5' } });
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(resourceSnapshotRepo.create).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalled();
  });

  it('closes the inline input when Escape is pressed without saving', async () => {
    const user = userEvent.setup();
    render(<QuickLogPrimosButton latestSnapshot={makeSnapshot()} />);

    await user.click(screen.getByRole('button', { name: /quick log current primogems/i }));
    const input = await screen.findByLabelText(/current primogems/i);
    await user.type(input, '{Escape}');

    expect(resourceSnapshotRepo.create).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /quick log current primogems/i })).toBeInTheDocument();
  });
});
