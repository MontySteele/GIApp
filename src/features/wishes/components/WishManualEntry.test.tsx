import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishManualEntry } from './WishManualEntry';
import { db } from '@/db/schema';
import { wishRepo } from '../repo/wishRepo';

beforeEach(async () => {
  await db.wishRecords.clear();
});

afterEach(async () => {
  await db.wishRecords.clear();
});

describe('WishManualEntry', () => {
  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<WishManualEntry />);

    await user.click(screen.getByRole('button', { name: /add wish/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    const stored = await wishRepo.getAll();
    expect(stored).toHaveLength(0);
  });

  it('saves a manual wish to the repository', async () => {
    const user = userEvent.setup();
    const onEntrySaved = vi.fn();
    render(<WishManualEntry onEntrySaved={onEntrySaved} />);

    await user.type(screen.getByLabelText(/item name/i), 'Testing Wish');
    await user.type(screen.getByLabelText(/time/i), '2024-02-01T12:00');
    await user.selectOptions(screen.getByLabelText(/rarity/i), '4');
    await user.selectOptions(screen.getByLabelText(/item type/i), 'weapon');
    await user.click(screen.getByRole('button', { name: /add wish/i }));

    await waitFor(async () => {
      expect(screen.getByText(/wish saved/i)).toBeInTheDocument();
      const stored = await wishRepo.getAll();
      expect(stored).toHaveLength(1);
      expect(onEntrySaved).toHaveBeenCalled();
    });
  });
});
