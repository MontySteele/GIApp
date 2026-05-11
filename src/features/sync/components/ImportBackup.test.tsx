import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ImportBackup from './ImportBackup';
import { importBackup, validateBackup } from '../services/importService';
import type { ImportResult } from '../services/importService';

vi.mock('../services/importService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/importService')>();

  return {
    ...actual,
    validateBackup: vi.fn(),
    importBackup: vi.fn(),
  };
});

function createImportResult(): ImportResult {
  return {
    success: true,
    warnings: [],
    errors: [],
    stats: {
      characters: { created: 2, updated: 0, skipped: 0 },
      teams: { created: 0, updated: 0, skipped: 0 },
      wishRecords: { created: 10, skipped: 0 },
      primogemEntries: { created: 1, updated: 0, skipped: 0 },
      fateEntries: { created: 0, updated: 0, skipped: 0 },
      resourceSnapshots: { created: 0, updated: 0, skipped: 0 },
      goals: { created: 0, updated: 0, skipped: 0 },
      notes: { created: 0, updated: 0, skipped: 0 },
      plannedBanners: { created: 0, updated: 0, skipped: 0 },
      calculatorScenarios: { created: 0, updated: 0, skipped: 0 },
      inventoryArtifacts: { created: 0, updated: 3, skipped: 0 },
      inventoryWeapons: { created: 0, updated: 0, skipped: 0 },
      materialInventory: { created: 0, updated: 0, skipped: 0 },
      campaigns: { created: 1, updated: 0, skipped: 0 },
    },
  };
}

function renderImportBackup() {
  return render(
    <MemoryRouter>
      <ImportBackup />
    </MemoryRouter>
  );
}

describe('ImportBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateBackup).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
      backupInfo: {
        exportedAt: '2026-05-01T00:00:00.000Z',
        schemaVersion: 5,
        recordCounts: {
          characters: 2,
          inventoryArtifacts: 3,
          wishRecords: 10,
          primogemEntries: 1,
          campaigns: 1,
        },
      },
    });
    vi.mocked(importBackup).mockResolvedValue(createImportResult());
  });

  it('shows user-facing what-changed links after a successful import', async () => {
    const user = userEvent.setup();
    const { container } = renderImportBackup();
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File([JSON.stringify({ schemaVersion: 5 })], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue(JSON.stringify({ schemaVersion: 5 })),
    });

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput as HTMLInputElement, file);

    await screen.findByText('Backup Details');
    await user.click(screen.getByRole('button', { name: /import data/i }));

    await waitFor(() => {
      expect(screen.getByText('What changed')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /roster refreshed/i })).toHaveAttribute('href', '/roster');
    expect(screen.getByRole('link', { name: /build planning updated/i })).toHaveAttribute('href', '/planner');
    expect(screen.getByRole('link', { name: /wish history refreshed/i })).toHaveAttribute('href', '/pulls/history');
    expect(screen.getByRole('link', { name: /budget refreshed/i })).toHaveAttribute('href', '/pulls');
    expect(screen.getByRole('link', { name: /targets restored/i })).toHaveAttribute('href', '/campaigns');
  });
});
