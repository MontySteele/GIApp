// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CharacterDetailPage from './CharacterDetailPage';
import type { Character } from '@/types';

const mockUpdateCharacter = vi.fn();
const mockDeleteCharacter = vi.fn();
const mockNavigate = vi.fn();

const mockCharacter: Character = {
  id: '1',
  key: 'Furina',
  level: 80,
  ascension: 5,
  constellation: 1,
  talent: { auto: 8, skill: 9, burst: 10 },
  weapon: { key: 'Wolf-Fang', level: 80, ascension: 5, refinement: 1 },
  artifacts: [],
  notes: 'Great support',
  priority: 'main',
  teamIds: [],
  createdAt: '',
  updatedAt: '',
};

vi.mock('../hooks/useCharacters', () => ({
  useCharacter: () => ({ character: mockCharacter, isLoading: false }),
  useCharacters: () => ({
    characters: [],
    allCharacters: [],
    createCharacter: vi.fn(),
    updateCharacter: mockUpdateCharacter,
    deleteCharacter: mockDeleteCharacter,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTeams', () => ({
  useTeams: () => ({
    teams: [
      {
        id: 'team-1',
        name: 'Support Core',
        characterKeys: ['Furina'],
        rotationNotes: 'Battery duties',
        tags: ['support'],
        createdAt: '',
        updatedAt: '',
      },
    ],
    isLoading: false,
    createTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/CharacterForm', () => ({
  __esModule: true,
  default: ({ onSubmit, onCancel, initialData }: any) => (
    <div>
      <div>Mock CharacterForm {initialData?.key}</div>
      <button onClick={() => onSubmit({ key: 'Updated Furina' })}>Submit Edit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/roster/1']}>
      <Routes>
        <Route path="/roster/:id" element={<CharacterDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CharacterDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('links owned characters into constellation chase campaign drafts', () => {
    renderPage();

    expect(screen.getByRole('link', { name: /build campaign/i })).toHaveAttribute(
      'href',
      '/campaigns?type=character-polish&character=Furina&buildGoal=comfortable&pullPlan=0'
    );
    expect(screen.getByRole('link', { name: /target c2/i })).toHaveAttribute(
      'href',
      '/campaigns?character=Furina&buildGoal=comfortable&copies=1&constellation=2&pullPlan=1'
    );
    expect(screen.getByRole('link', { name: /target c6/i })).toHaveAttribute(
      'href',
      '/campaigns?character=Furina&buildGoal=comfortable&copies=5&constellation=6&pullPlan=1'
    );
  });

  it('opens edit modal and submits updates to the repository', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText(/mock characterform furina/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /submit edit/i }));

    expect(mockUpdateCharacter).toHaveBeenCalledWith('1', expect.objectContaining({ key: 'Updated Furina' }));
  });

  it('deletes the character and navigates back to the roster', async () => {
    const user = userEvent.setup();
    mockDeleteCharacter.mockResolvedValueOnce(undefined);

    renderPage();

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete character/i }));

    expect(mockDeleteCharacter).toHaveBeenCalledWith('1');
    expect(mockNavigate).toHaveBeenCalledWith('/roster');
  });
});
