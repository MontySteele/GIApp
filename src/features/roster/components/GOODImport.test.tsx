import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GOODImport from './GOODImport';
import { writeLastImportSummary } from '@/features/sync/domain/lastImportSummary';
import { importIrminsul } from '../services/irminsulImport';

vi.mock('../services/irminsulImport', async () => {
  const actual = await vi.importActual<typeof import('../services/irminsulImport')>(
    '../services/irminsulImport'
  );
  return {
    ...actual,
    importIrminsul: vi.fn().mockResolvedValue({
      success: true,
      charactersImported: 1,
      charactersUpdated: 0,
      charactersSkipped: 0,
      artifactsImported: 2,
      weaponsImported: 1,
      materialsImported: 0,
    }),
  };
});

vi.mock('@/features/sync/domain/lastImportSummary', () => ({
  writeLastImportSummary: vi.fn(),
}));

const validGoodJson = JSON.stringify({
  format: 'GOOD',
  version: 2,
  source: 'GOOD',
  characters: [
    {
      key: 'Furina',
      level: 90,
      constellation: 2,
      ascension: 6,
      talent: { auto: 9, skill: 10, burst: 10 },
    },
  ],
});

describe('GOODImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes the import through the shared Irminsul pipeline', async () => {
    const user = userEvent.setup();

    render(<GOODImport onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: validGoodJson },
    });
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(importIrminsul).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'GOOD' }),
        {},
        undefined
      );
    });
  });

  it('persists an import impact summary after a successful import', async () => {
    const user = userEvent.setup();

    render(<GOODImport onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: validGoodJson },
    });
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(writeLastImportSummary).toHaveBeenCalledWith(expect.objectContaining({
        source: 'GOOD',
        totals: {
          created: 1,
          updated: 3,
          skipped: 0,
        },
      }));
    });
  });

  it('surfaces pipeline failures instead of reporting success', async () => {
    vi.mocked(importIrminsul).mockResolvedValueOnce({
      success: false,
      error: 'boom',
      charactersImported: 0,
      charactersUpdated: 0,
      charactersSkipped: 0,
      artifactsImported: 0,
      weaponsImported: 0,
      materialsImported: 0,
    });
    const user = userEvent.setup();

    render(<GOODImport onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: validGoodJson },
    });
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(screen.getByText('boom')).toBeInTheDocument();
    });
    expect(writeLastImportSummary).not.toHaveBeenCalled();
  });
});
