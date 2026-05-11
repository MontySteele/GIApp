import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImportHubPage from './ImportHubPage';
import { writeLastImportSummary } from '../domain/lastImportSummary';

const mocks = vi.hoisted(() => ({
  characterCount: 3,
  wishCount: 24,
  resourceSnapshotCount: 2,
  campaignCount: 1,
  plannedBannerCount: 0,
  wishlist: [] as Array<Record<string, unknown>>,
  accountFreshnessStatus: 'stale' as 'fresh' | 'stale' | 'missing',
  accountFreshnessDetail: 'Last GOOD import was 14 days ago.',
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((query: () => unknown) => {
    const querySource = query.toString();
    if (querySource.includes('db.characters.count')) return mocks.characterCount;
    if (querySource.includes('db.wishRecords.count')) return mocks.wishCount;
    if (querySource.includes('db.resourceSnapshots.count')) return mocks.resourceSnapshotCount;
    if (querySource.includes('db.campaigns.count')) return mocks.campaignCount;
    if (querySource.includes('db.plannedBanners.count')) return mocks.plannedBannerCount;
    throw new Error(`Unexpected ImportHubPage live query: ${querySource}`);
  }),
}));

vi.mock('@/stores/wishlistStore', () => ({
  useWishlistStore: () => mocks.wishlist,
}));

vi.mock('../hooks/useAccountDataFreshness', () => ({
  useAccountDataFreshness: () => ({
    status: mocks.accountFreshnessStatus,
    latestImport: null,
    daysSinceImport: 14,
    label: 'Refresh account data',
    detail: mocks.accountFreshnessDetail,
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
    mocks.characterCount = 3;
    mocks.wishCount = 24;
    mocks.resourceSnapshotCount = 2;
    mocks.campaignCount = 1;
    mocks.plannedBannerCount = 0;
    mocks.wishlist = [];
    mocks.accountFreshnessStatus = 'stale';
    mocks.accountFreshnessDetail = 'Last GOOD import was 14 days ago.';
  });

  it('centralizes import status and setup actions', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /import hub/i })).toBeInTheDocument();
    expect(screen.getByText('Roster and inventory')).toBeInTheDocument();
    expect(screen.getByText('Wish history')).toBeInTheDocument();
    expect(screen.getByText('Manual fast path')).toBeInTheDocument();
    expect(screen.getByText('Backup and restore')).toBeInTheDocument();
    expect(screen.queryByText('First target is ready')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh roster/i })).toHaveAttribute('href', '/roster?import=irminsul');
    expect(screen.getByRole('link', { name: /enter manually/i })).toHaveAttribute('href', '/pulls/calculator');
  });

  it('shows first-target setup while setup is still incomplete', () => {
    mocks.campaignCount = 0;
    mocks.wishCount = 0;
    mocks.resourceSnapshotCount = 0;
    mocks.accountFreshnessStatus = 'fresh';
    mocks.accountFreshnessDetail = 'Last GOOD import was today.';

    renderPage();

    expect(screen.getByRole('heading', { name: /set up your first target/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /set resources/i })).toHaveAttribute('href', '/pulls');
  });

  it('hides first-target setup when a non-campaign target already exists', () => {
    mocks.campaignCount = 0;
    mocks.plannedBannerCount = 1;
    mocks.accountFreshnessStatus = 'fresh';
    mocks.accountFreshnessDetail = 'Last GOOD import was today.';

    renderPage();

    expect(screen.queryByRole('heading', { name: /set up your first target/i })).not.toBeInTheDocument();
    expect(screen.queryByText('First target is ready')).not.toBeInTheDocument();
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
