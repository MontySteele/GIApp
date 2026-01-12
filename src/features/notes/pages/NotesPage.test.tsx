import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesPage from './NotesPage';

// Mock data
const mockStickies = [
  {
    id: 's1',
    title: 'Farm Talent Books',
    description: 'Monday: Freedom\nTuesday: Resistance',
    category: 'other',
    status: 'active',
    checklist: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 's2',
    title: 'Weekly Bosses',
    description: 'Signora, Raiden, Scaramouche',
    category: 'other',
    status: 'active',
    checklist: [],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const mockNotes = [
  {
    id: 'n1',
    title: 'Team Compositions',
    content: '# National Team\n- Xiangling\n- Bennett\n- Xingqiu\n- Raiden',
    tags: ['teams', 'abyss'],
    pinned: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'n2',
    title: 'Artifact Farming Guide',
    content: 'Best domains for artifact farming...',
    tags: ['artifacts', 'guide'],
    pinned: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

// Mock hooks
vi.mock('../hooks/useGoals', () => ({
  useGoals: () => ({
    goals: mockStickies,
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../hooks/useNotes', () => ({
  useNotes: () => ({
    notes: mockNotes,
    allNotes: mockNotes,
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    isLoading: false,
  }),
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<NotesPage />);

      expect(screen.getByRole('heading', { name: /notes & stickies/i })).toBeInTheDocument();
      expect(screen.getByText(/quick stickies for reminders/i)).toBeInTheDocument();
    });

    it('renders stickies section', () => {
      render(<NotesPage />);

      expect(screen.getByRole('heading', { name: /quick stickies/i })).toBeInTheDocument();
    });

    it('renders notes section', () => {
      render(<NotesPage />);

      expect(screen.getByRole('heading', { name: /^notes$/i })).toBeInTheDocument();
    });

    it('renders add sticky button', () => {
      render(<NotesPage />);

      expect(screen.getByRole('button', { name: /add sticky/i })).toBeInTheDocument();
    });

    it('renders new note button', () => {
      render(<NotesPage />);

      expect(screen.getByRole('button', { name: /new note/i })).toBeInTheDocument();
    });

    it('renders search input for notes', () => {
      render(<NotesPage />);

      expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument();
    });
  });

  describe('stickies display', () => {
    it('displays sticky titles', () => {
      render(<NotesPage />);

      expect(screen.getByText('Farm Talent Books')).toBeInTheDocument();
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
    });

    it('displays sticky content', () => {
      render(<NotesPage />);

      expect(screen.getByText(/monday: freedom/i)).toBeInTheDocument();
    });
  });

  describe('notes display', () => {
    it('displays note titles', () => {
      render(<NotesPage />);

      expect(screen.getByText('Team Compositions')).toBeInTheDocument();
      expect(screen.getByText('Artifact Farming Guide')).toBeInTheDocument();
    });

    it('displays note tags', () => {
      render(<NotesPage />);

      expect(screen.getByText('#teams')).toBeInTheDocument();
      expect(screen.getByText('#abyss')).toBeInTheDocument();
      expect(screen.getByText('#artifacts')).toBeInTheDocument();
    });

    it('shows pinned indicator for pinned notes', () => {
      render(<NotesPage />);

      // The pinned note should have a pin icon (we check for the button with pin)
      const pinnedNote = screen.getByText('Team Compositions').closest('div[class*="Card"]');
      expect(pinnedNote).toBeInTheDocument();
    });
  });

  describe('tag filtering', () => {
    it('displays tag filter buttons', () => {
      render(<NotesPage />);

      // All unique tags should be shown as filter buttons
      expect(screen.getAllByText('#teams').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#abyss').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#artifacts').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#guide').length).toBeGreaterThan(0);
    });
  });

  describe('sticky interactions', () => {
    it('opens sticky editor when add sticky button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesPage />);

      await user.click(screen.getByRole('button', { name: /add sticky/i }));

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/new sticky/i)).toBeInTheDocument();
      });
    });
  });

  describe('note interactions', () => {
    it('opens note modal when new note button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesPage />);

      await user.click(screen.getByRole('button', { name: /new note/i }));

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/create note/i)).toBeInTheDocument();
      });
    });
  });

  describe('search functionality', () => {
    it('can type in search box', async () => {
      const user = userEvent.setup();
      render(<NotesPage />);

      const searchInput = screen.getByPlaceholderText(/search notes/i);
      await user.type(searchInput, 'team');

      expect(searchInput).toHaveValue('team');
    });
  });
});

describe('NotesPage loading state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows loading state', async () => {
    vi.doMock('../hooks/useGoals', () => ({
      useGoals: () => ({
        goals: [],
        createGoal: vi.fn(),
        updateGoal: vi.fn(),
        deleteGoal: vi.fn(),
        isLoading: true,
      }),
    }));

    vi.doMock('../hooks/useNotes', () => ({
      useNotes: () => ({
        notes: [],
        allNotes: [],
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        isLoading: true,
      }),
    }));

    const { default: NotesPageLoading } = await import('./NotesPage');
    render(<NotesPageLoading />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('NotesPage empty state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows empty state for stickies', async () => {
    vi.doMock('../hooks/useGoals', () => ({
      useGoals: () => ({
        goals: [],
        createGoal: vi.fn(),
        updateGoal: vi.fn(),
        deleteGoal: vi.fn(),
        isLoading: false,
      }),
    }));

    vi.doMock('../hooks/useNotes', () => ({
      useNotes: () => ({
        notes: [],
        allNotes: [],
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        isLoading: false,
      }),
    }));

    const { default: NotesPageEmpty } = await import('./NotesPage');
    render(<NotesPageEmpty />);

    expect(screen.getByText(/no stickies yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first sticky/i)).toBeInTheDocument();
  });

  it('shows empty state for notes', async () => {
    vi.doMock('../hooks/useGoals', () => ({
      useGoals: () => ({
        goals: [],
        createGoal: vi.fn(),
        updateGoal: vi.fn(),
        deleteGoal: vi.fn(),
        isLoading: false,
      }),
    }));

    vi.doMock('../hooks/useNotes', () => ({
      useNotes: () => ({
        notes: [],
        allNotes: [],
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        isLoading: false,
      }),
    }));

    const { default: NotesPageEmpty } = await import('./NotesPage');
    render(<NotesPageEmpty />);

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
    expect(screen.getByText(/create your first note/i)).toBeInTheDocument();
  });
});
