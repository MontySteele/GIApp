import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImportHubPage from './ImportHubPage';
import { writeLastImportSummary } from '../domain/lastImportSummary';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((query: () => unknown) => {
    const querySource = query.toString();
    if (querySource.includes('db.characters.count')) return 3;
    if (querySource.includes('db.wishRecords.count')) return 24;
    if (querySource.includes('db.resourceSnapshots.count')) return 2;
    if (querySource.includes('db.campaigns.count')) return 1;
    throw new Error(`Unexpected ImportHubPage live query: ${querySource}`);
  }),
}));

vi.mock('../hooks/useAccountDataFreshness', () => ({
  useAccountDataFreshness: () => ({
    status: 'stale',
    latestImport: null,
    daysSinceImport: 14,
    label: 'Refresh account data',
    detail: 'Last GOOD import was 14 days ago.',
  }),
}));

vi.mock('../hooks/useAppMetaStatus', () => ({
  useAppMetaStatus: () => ({
    status: {
      lastBackupAt: '2026-05-01T00:00:00.000Z',
      needsBackup: true,
      schemaMismatch: false,
    },
    isLoading: false,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ImportHubPage />
    </MemoryRouter>
  );
}

describe('ImportHubPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('centralizes import status and setup actions', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /import hub/i })).toBeInTheDocument();
    expect(screen.getByText('Roster and inventory')).toBeInTheDocument();
    expect(screen.getByText('Wish history')).toBeInTheDocument();
    expect(screen.getByText('Manual fast path')).toBeInTheDocument();
    expect(screen.getByText('Backup and restore')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh roster/i })).toHaveAttribute('href', '/roster?import=irminsul');
    expect(screen.getByRole('link', { name: /enter manually/i })).toHaveAttribute('href', '/pulls/calculator');
  });

  it('shows the persisted last import impact', () => {
    writeLastImportSummary({
      source: 'Backup restore',
      importedAt: '2026-05-11T00:00:00.000Z',
      totals: {
        created: 2,
        updated: 1,
        skipped: 0,
      },
      rows: [
        {
          id: 'targets',
          title: 'Targets restored',
          detail: '1 target record ready for dashboard next actions.',
          href: '/campaigns',
        },
      ],
    });

    renderPage();

    expect(screen.getByText('Last Import Impact')).toBeInTheDocument();
    expect(screen.getByText('Targets restored')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /targets restored/i })).toHaveAttribute('href', '/campaigns');
  });
});
