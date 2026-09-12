import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StorageHealthCard from './StorageHealthCard';
import { __testUtils } from '../services/storageHealth';

type StorageMock = {
  estimate: ReturnType<typeof vi.fn>;
  persisted: ReturnType<typeof vi.fn>;
  persist: ReturnType<typeof vi.fn>;
};

function installStorageMock(overrides: Partial<StorageMock> = {}): StorageMock {
  const mock: StorageMock = {
    estimate: vi.fn().mockResolvedValue({ usage: 5 * 1024 * 1024, quota: 100 * 1024 * 1024 }),
    persisted: vi.fn().mockResolvedValue(false),
    persist: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
  Object.defineProperty(navigator, 'storage', { value: mock, configurable: true });
  return mock;
}

describe('StorageHealthCard', () => {
  beforeEach(() => {
    __testUtils.resetPersistMemo();
  });

  afterEach(() => {
    __testUtils.resetPersistMemo();
    Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, 'storage');
  });

  it('shows usage, quota and the unpersisted warning', async () => {
    installStorageMock();
    render(<StorageHealthCard onReset={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('storage-usage')).toHaveTextContent('5.0 MB of 100 MB (5%)');
    });
    expect(screen.getByTestId('storage-persisted')).toHaveTextContent('may be evicted');
    expect(screen.getByRole('button', { name: 'Request persistent storage' })).toBeInTheDocument();
  });

  it('requests persistence and flips to granted', async () => {
    const mock = installStorageMock();
    // After persist() succeeds, persisted() reports true on refresh.
    mock.persist.mockImplementation(async () => {
      mock.persisted.mockResolvedValue(true);
      return true;
    });

    render(<StorageHealthCard onReset={vi.fn()} />);
    const user = userEvent.setup();

    const button = await screen.findByRole('button', { name: 'Request persistent storage' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('storage-persisted')).toHaveTextContent('Persistent storage granted');
    });
    expect(mock.persist).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Request persistent storage' })).not.toBeInTheDocument();
  });

  it('explains when the browser declines persistence', async () => {
    installStorageMock({ persist: vi.fn().mockResolvedValue(false) });
    render(<StorageHealthCard onReset={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Request persistent storage' }));

    expect(await screen.findByRole('status')).toHaveTextContent('declined');
  });

  it('reports when the storage API is unavailable', async () => {
    render(<StorageHealthCard onReset={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('storage-usage')).toHaveTextContent('Not available in this browser');
    });
  });

  it('only resets after the user types DELETE', async () => {
    installStorageMock();
    const onReset = vi.fn().mockResolvedValue(undefined);
    render(<StorageHealthCard onReset={onReset} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Reset all data/ }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: 'Delete everything' });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'delete');
    expect(confirm).toBeDisabled();
    expect(onReset).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Type DELETE to confirm'));
    await user.type(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
  });

  it('surfaces a reset failure inside the modal', async () => {
    installStorageMock();
    const onReset = vi.fn().mockRejectedValue(new Error('blocked by another tab'));
    render(<StorageHealthCard onReset={onReset} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Reset all data/ }));
    await user.type(await screen.findByLabelText('Type DELETE to confirm'), 'DELETE');
    await user.click(screen.getByRole('button', { name: 'Delete everything' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('blocked by another tab');
  });
});
