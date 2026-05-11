import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GOODImport from './GOODImport';
import { writeLastImportSummary } from '@/features/sync/domain/lastImportSummary';

vi.mock('@/mappers/good', () => ({
  validateGOOD: vi.fn(() => true),
  fromGOODWithInventory: vi.fn(() => ({
    characters: [{ id: 'furina', key: 'Furina' }],
    inventoryArtifacts: [{ id: 'artifact-1' }],
    inventoryWeapons: [{ id: 'weapon-1' }],
  })),
}));

vi.mock('../repo/characterRepo', () => ({
  characterRepo: {
    bulkCreate: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/features/artifacts/repo/artifactRepo', () => ({
  artifactRepo: {
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/features/weapons/repo/weaponRepo', () => ({
  weaponRepo: {
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/features/sync/domain/lastImportSummary', () => ({
  writeLastImportSummary: vi.fn(),
}));

describe('GOODImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists an import impact summary after a successful import', async () => {
    const user = userEvent.setup();

    render(<GOODImport onSuccess={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: JSON.stringify({ format: 'GOOD', version: 2, source: 'GOOD', characters: [] }) },
    });
    await user.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(writeLastImportSummary).toHaveBeenCalledWith(expect.objectContaining({
        source: 'GOOD',
        totals: {
          created: 1,
          updated: 2,
          skipped: 0,
        },
      }));
    });
  });
});
