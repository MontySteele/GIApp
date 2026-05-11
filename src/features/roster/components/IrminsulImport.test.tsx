import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { writeLastImportSummary } from '@/features/sync/domain/lastImportSummary';
import IrminsulImport from './IrminsulImport';

vi.mock('../services/irminsulImport', () => ({
  parseIrminsulJson: vi.fn(() => ({ source: 'Irminsul' })),
  previewImport: vi.fn(() => ({
    stats: {
      characterCount: 2,
      artifactCount: 3,
      weaponCount: 4,
      materialCount: 5,
    },
  })),
  importIrminsul: vi.fn().mockResolvedValue({
    success: true,
    charactersImported: 1,
    charactersUpdated: 1,
    charactersSkipped: 0,
    artifactsImported: 3,
    weaponsImported: 4,
    materialsImported: 5,
  }),
}));

vi.mock('@/features/sync/domain/lastImportSummary', () => ({
  writeLastImportSummary: vi.fn(),
}));

describe('IrminsulImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists an import impact summary after a successful import', async () => {
    const user = userEvent.setup();
    render(<IrminsulImport onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: JSON.stringify({ format: 'GOOD', source: 'Irminsul' }) },
    });
    await user.click(screen.getByRole('button', { name: /import data/i }));

    await waitFor(() => {
      expect(writeLastImportSummary).toHaveBeenCalledWith(expect.objectContaining({
        source: 'Irminsul',
        totals: { created: 1, updated: 13, skipped: 0 },
      }));
    });
  });
});
