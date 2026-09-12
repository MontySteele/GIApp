import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatabaseGate from './DatabaseGate';

describe('DatabaseGate', () => {
  it('renders children only after the database initializes', async () => {
    let resolve!: () => void;
    const initialize = vi.fn(() => new Promise<void>((r) => { resolve = r; }));

    render(
      <DatabaseGate initialize={initialize}>
        <div>app content</div>
      </DatabaseGate>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();

    resolve();
    await waitFor(() => expect(screen.getByText('app content')).toBeInTheDocument());
  });

  it('shows the recovery screen and never mounts children when initialization rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const initialize = vi.fn().mockRejectedValue(new Error('VersionError: requested 5, existing 7'));

    render(
      <DatabaseGate initialize={initialize}>
        <div>app content</div>
      </DatabaseGate>
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByText(/VersionError/)).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('retries on demand and only resets after typed confirmation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const initialize = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(undefined);
    const resetDatabase = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <DatabaseGate initialize={initialize} resetDatabase={resetDatabase}>
        <div>app content</div>
      </DatabaseGate>
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    const resetButton = screen.getByRole('button', { name: /reset database/i });
    expect(resetButton).toBeDisabled();
    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE');
    expect(resetButton).toBeEnabled();
    await user.click(resetButton);
    expect(resetDatabase).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('app content')).toBeInTheDocument());
    expect(initialize).toHaveBeenCalledTimes(2);
  });
});
