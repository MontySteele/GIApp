import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/db/schema';
import { primogemEntryRepo } from '../repo/primogemEntryRepo';
import QuickResourceLogger from './QuickResourceLogger';

beforeEach(async () => {
  await db.primogemEntries.clear();
});

afterEach(async () => {
  await db.primogemEntries.clear();
});

describe('QuickResourceLogger', () => {
  it('logs a preset primogem income entry', async () => {
    const user = userEvent.setup();
    render(<QuickResourceLogger />);

    await user.click(screen.getByRole('button', { name: /commissions \+60/i }));

    await waitFor(async () => {
      const entries = await primogemEntryRepo.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        amount: 60,
        source: 'daily_commission',
      });
      expect(screen.getByText(/logged 60 primogems/i)).toBeInTheDocument();
    });
  });

  it('logs a custom quick entry', async () => {
    const user = userEvent.setup();
    render(<QuickResourceLogger />);

    await user.type(screen.getByLabelText(/custom primogem amount/i), '160');
    await user.type(screen.getByLabelText(/custom primogem note/i), 'Daily web event');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(async () => {
      const entries = await primogemEntryRepo.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        amount: 160,
        source: 'other',
        notes: 'Daily web event',
      });
    });
  });

  it('repeats the latest non-purchase entry', async () => {
    await primogemEntryRepo.create({
      amount: 90,
      source: 'welkin',
      notes: 'Welkin Moon',
    });

    const user = userEvent.setup();
    render(<QuickResourceLogger />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /repeat last/i })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: /repeat last/i }));

    await waitFor(async () => {
      const entries = await primogemEntryRepo.getAll();
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({
        amount: 90,
        source: 'welkin',
      });
    });
  });

  it('undoes the last quick log entry', async () => {
    const user = userEvent.setup();
    render(<QuickResourceLogger />);

    await user.click(screen.getByRole('button', { name: /welkin \+90/i }));

    await waitFor(async () => {
      expect(await primogemEntryRepo.getAll()).toHaveLength(1);
    });

    await user.click(screen.getByRole('button', { name: /undo/i }));

    await waitFor(async () => {
      expect(await primogemEntryRepo.getAll()).toHaveLength(0);
      expect(screen.queryByText(/logged 90 primogems/i)).not.toBeInTheDocument();
    });
  });
});
