import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlannedBanner } from '@/types';
import BannersTab from './BannersTab';

const mocks = vi.hoisted(() => ({
  plannedBanners: [] as PlannedBanner[] | undefined,
  createBanner: vi.fn(),
  deleteBanner: vi.fn(),
  openExternal: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => mocks.plannedBanners,
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: mocks.openExternal,
}));

vi.mock('../repo/upcomingWishRepo', () => ({
  upcomingWishRepo: {
    getAll: vi.fn(),
    create: mocks.createBanner,
    delete: mocks.deleteBanner,
  },
}));

function makeBanner(overrides: Partial<PlannedBanner> = {}): PlannedBanner {
  return {
    id: 'banner-1',
    characterKey: 'Furina',
    expectedStartDate: '2026-06-01T00:00:00.000Z',
    expectedEndDate: '2026-06-21T23:59:59.999Z',
    priority: 1,
    maxPullBudget: 180,
    isConfirmed: true,
    notes: 'Hydro Archon rerun',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <BannersTab />
    </MemoryRouter>
  );
}

describe('BannersTab', () => {
  beforeEach(() => {
    mocks.plannedBanners = [];
    mocks.createBanner.mockReset();
    mocks.deleteBanner.mockReset();
    mocks.openExternal.mockReset();
  });

  it('shows an empty planned-banner state', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: /banner planning/i })).toBeInTheDocument();
    expect(screen.getByText('No planned banners yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add banner/i })).toBeInTheDocument();
  });

  it('renders planned banners with campaign and calculator links', () => {
    mocks.plannedBanners = [makeBanner()];

    renderPage();

    expect(screen.getByRole('heading', { name: 'Furina' })).toBeInTheDocument();
    expect(screen.getByText('Hydro Archon rerun')).toBeInTheDocument();
    expect(screen.getByText('180 pulls')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /add to campaign/i })).toHaveAttribute(
      'href',
      '/campaigns?character=Furina&buildGoal=comfortable&priority=1&budget=180&deadline=2026-06-01&pullPlan=1'
    );

    const simulateHref = screen.getByRole('link', { name: /simulate/i }).getAttribute('href') ?? '';
    expect(simulateHref).toContain('/pulls/calculator?mode=multi');
    expect(simulateHref).toContain('name=Furina+banner');
    expect(simulateHref).toContain('pulls=180');
  });

  it('creates a planned banner from the form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByLabelText('Expected start'));
    await user.type(screen.getByLabelText('Expected start'), '2026-06-01');
    await user.clear(screen.getByLabelText('Expected end'));
    await user.type(screen.getByLabelText('Expected end'), '2026-06-21');
    await user.selectOptions(screen.getByLabelText('Priority'), '1');
    await user.type(screen.getByLabelText('Pull budget'), '160');
    await user.selectOptions(screen.getByLabelText('Status'), 'confirmed');
    await user.type(screen.getByLabelText('Notes'), 'Saving for C0');
    await user.click(screen.getByRole('button', { name: /add banner/i }));

    expect(mocks.createBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        characterKey: 'Furina',
        expectedStartDate: '2026-06-01T00:00:00.000Z',
        expectedEndDate: '2026-06-21T23:59:59.999Z',
        priority: 1,
        maxPullBudget: 160,
        isConfirmed: true,
        notes: 'Saving for C0',
      })
    );
  });

  it('accepts unreleased character names that are not in the local character list', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByRole('combobox', { name: /banner character/i }));
    await user.type(screen.getByRole('combobox', { name: /banner character/i }), 'Columbina');
    await user.clear(screen.getByLabelText('Expected start'));
    await user.type(screen.getByLabelText('Expected start'), '2026-06-01');
    await user.clear(screen.getByLabelText('Expected end'));
    await user.type(screen.getByLabelText('Expected end'), '2026-06-21');
    await user.click(screen.getByRole('button', { name: /add banner/i }));

    expect(mocks.createBanner).toHaveBeenCalledWith(
      expect.objectContaining({
        characterKey: 'Columbina',
      })
    );
  });

  it('deletes a planned banner', async () => {
    const user = userEvent.setup();
    mocks.plannedBanners = [makeBanner()];
    renderPage();

    await user.click(screen.getByRole('button', { name: /delete planned banner for furina/i }));

    expect(mocks.deleteBanner).toHaveBeenCalledWith('banner-1');
  });
});
