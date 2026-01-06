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
    createCharacter: vi.fn(),
    updateCharacter: mockUpdateCharacter,
    deleteCharacter: mockDeleteCharacter,
    isLoading: false,
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
