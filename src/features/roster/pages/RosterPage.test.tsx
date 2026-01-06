import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RosterPage from './RosterPage';
import type { CharacterQuery } from '../selectors/characterSelectors';
import { MemoryRouter } from 'react-router-dom';

const useCharactersSpy = vi.fn<(query?: CharacterQuery) => void>();

const mockCharacter = {
  id: '1',
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: { auto: 1, skill: 1, burst: 1 },
  weapon: { key: 'Splendor', level: 90, ascension: 6, refinement: 1 },
  artifacts: [],
  notes: '',
  priority: 'main' as const,
  teamIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock('../hooks/useCharacters', () => {
  return {
    useCharacters: (query?: CharacterQuery) => {
      useCharactersSpy(query);
      return {
        characters: [mockCharacter],
        isLoading: false,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      };
    },
  };
});

const renderPage = (props?: ComponentProps<typeof RosterPage>) =>
  render(
    <MemoryRouter>
      <RosterPage {...props} />
    </MemoryRouter>
  );

describe('RosterPage', () => {
  beforeEach(() => {
    useCharactersSpy.mockClear();
  });

  it('hides filters toggle when feature flag is disabled', () => {
    renderPage({ enableFilters: false });

    expect(screen.queryByText(/filters/i)).not.toBeInTheDocument();
  });

  it('passes query options to useCharacters when filters and sorting are used', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/search characters/i), 'furina');

    await user.click(screen.getByText(/filters/i));

    await user.selectOptions(screen.getByLabelText(/filter by element/i), 'Hydro');
    await user.selectOptions(screen.getByLabelText(/filter by weapon type/i), 'Sword');
    await user.selectOptions(screen.getByLabelText(/filter by rarity/i), '5');
    await user.selectOptions(screen.getByLabelText(/filter by priority/i), 'main');
    await user.selectOptions(screen.getByLabelText(/sort characters/i), 'priority');

    await waitFor(() => {
      const lastCall = useCharactersSpy.mock.calls.at(-1)?.[0];
      expect(lastCall?.filters).toEqual({
        element: 'Hydro',
        weaponType: 'Sword',
        rarity: 5,
        priority: 'main',
        search: 'furina',
      });
      expect(lastCall?.sort).toEqual({
        field: 'priority',
        direction: 'asc',
      });
    });
  });
});
