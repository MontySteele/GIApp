import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Character } from '@/types';
import TheaterTab from './TheaterTab';

const mockCharacters: { value: Character[] | undefined } = { value: [] };

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => mockCharacters.value,
}));

vi.mock('@/features/roster/repo/characterRepo', () => ({
  characterRepo: { getAll: vi.fn(async () => []) },
}));

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-id-1',
    key: 'Xingqiu',
    level: 90,
    ascension: 6,
    constellation: 0,
    talent: { auto: 1, skill: 1, burst: 1 },
    weapon: { key: 'SacrificialSword', level: 90, ascension: 6, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'support',
    teamIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

const renderTab = () =>
  render(
    <MemoryRouter>
      <TheaterTab />
    </MemoryRouter>
  );

describe('TheaterTab', () => {
  beforeEach(() => {
    mockCharacters.value = [];
    // Only the seeded 2026-08 season exists; pin the clock inside that month so
    // these cases exercise the "current season" path deterministically.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show a stale-season notice while the season month is in progress', () => {
    renderTab();

    expect(screen.queryByText(/No season data for/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Previous season/i)).not.toBeInTheDocument();
  });

  it('should render an empty-roster state without crashing', () => {
    renderTab();

    expect(screen.getByRole('heading', { name: 'Imaginarium Theatre' })).toBeInTheDocument();
    expect(
      screen.getByText(/No characters in your roster yet/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Import your roster/i })).toBeInTheDocument();
  });

  it('should render all five difficulty cards', () => {
    renderTab();

    for (const label of ['Easy', 'Normal', 'Hard', 'Visionary', 'Lunar']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
  });

  it('should count the six opener trials for an empty roster', () => {
    renderTab();

    expect(screen.getByText('6 / 8')).toBeInTheDocument();
    expect(screen.getByText('6 / 28')).toBeInTheDocument();
  });

  it('should convey readiness with text and not colour alone', () => {
    mockCharacters.value = [
      'Xingqiu',
      'Mona',
      'Barbara',
      'Candace',
      'Nilou',
      'Fischl',
      'Beidou',
      'Lisa',
    ].map((key, index) => makeCharacter({ id: `c-${index}`, key }));

    renderTab();

    expect(screen.getByText('14 / 8')).toBeInTheDocument();
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\d+ short/).length).toBeGreaterThan(0);
  });

  it('should list near-miss characters with the levels they need', () => {
    mockCharacters.value = [makeCharacter({ id: 'c-1', key: 'Fischl', level: 69 })];

    renderTab();

    expect(screen.getAllByText(/Fischl — Lv\. 69, needs 1 more level/).length).toBeGreaterThan(0);
  });

  it('should expose an accessible season selector', () => {
    renderTab();

    const select = screen.getByLabelText('Season');
    expect(select).toHaveValue('2026-08');
    expect(within(select).getByRole('option', { name: '2026-08' })).toBeInTheDocument();
  });

  it('should show the season line-up and advantage note', () => {
    renderTab();

    expect(screen.getByText(/Yelan, Aino, Flins, Ororon, Skirk, Layla/)).toBeInTheDocument();
    expect(
      screen.getByText(/Arlecchino, Chevreuse, KaedeharaKazuha, Tighnari/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Lunar-Charged reactions have an advantage/)).toBeInTheDocument();
  });

  it('should toggle the leveling plan panel from a short difficulty card', async () => {
    const user = userEvent.setup();
    mockCharacters.value = [makeCharacter({ id: 'c-1', key: 'Fischl', level: 69 })];

    renderTab();

    const toggle = screen.getByRole('button', { name: /Plan leveling for Easy/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(
      screen.getByRole('button', { name: /Hide leveling for Easy/i })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /Plan leveling to Lv\. 60/ })).toBeInTheDocument();
  });

  describe('when no season matches the current month', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2026-09-12T12:00:00Z'));
    });

    it('shows a clear no-season-data state for the current month', () => {
      renderTab();

      expect(screen.getByRole('status')).toHaveTextContent('No season data for September 2026.');
      expect(
        screen.getByText(/Showing the last known season \(2026-08\) for reference only/i)
      ).toBeInTheDocument();
    });

    it('labels the last known season as previous/stale instead of presenting it as current', () => {
      renderTab();

      expect(screen.getByText('Previous season — stale')).toBeInTheDocument();
      expect(screen.getByLabelText('Season')).toHaveValue('2026-08');
      // The stale line-up is still visible for reference.
      expect(screen.getByText(/Yelan, Aino, Flins, Ororon, Skirk, Layla/)).toBeInTheDocument();
    });

    it('keeps the no-season notice when a previous season is explicitly selected', async () => {
      const user = userEvent.setup();
      renderTab();

      await user.selectOptions(screen.getByLabelText('Season'), '2026-08');

      expect(screen.getByRole('status')).toHaveTextContent('No season data for September 2026.');
      expect(screen.getByText('Previous season (2026-08)')).toBeInTheDocument();
    });
  });
});
