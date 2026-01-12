import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotes } from './useNotes';
import { noteRepo } from '../repo/noteRepo';
import type { Note } from '@/types';

// Mock the noteRepo
vi.mock('../repo/noteRepo', () => ({
  noteRepo: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useLiveQuery
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Farming Routes',
    content: 'Best routes for Cor Lapis and Noctilucous Jade',
    tags: ['farming', 'materials'],
    pinned: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'note-2',
    title: 'Team Compositions',
    content: 'Notes on Hu Tao team variations',
    tags: ['teams', 'hu tao'],
    pinned: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'note-3',
    title: 'Weekly Checklist',
    content: 'Things to do every week',
    tags: ['weekly', 'checklist'],
    pinned: false,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
];

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('data loading', () => {
    it('returns empty array when loading', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useNotes());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.notes).toEqual([]);
      expect(result.current.allNotes).toEqual([]);
    });

    it('returns notes when loaded', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);

      const { result } = renderHook(() => useNotes());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.allNotes).toHaveLength(3);
    });
  });

  describe('sorting', () => {
    it('sorts pinned notes first', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);

      const { result } = renderHook(() => useNotes());

      expect(result.current.notes[0].pinned).toBe(true);
      expect(result.current.notes[0].title).toBe('Farming Routes');
    });

    it('sorts unpinned notes by updatedAt descending', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);

      const { result } = renderHook(() => useNotes());

      // After pinned note, unpinned should be sorted by updatedAt desc
      const unpinnedNotes = result.current.notes.filter((n) => !n.pinned);
      expect(unpinnedNotes[0].title).toBe('Team Compositions'); // Jan 10
      expect(unpinnedNotes[1].title).toBe('Weekly Checklist'); // Jan 8
    });
  });

  describe('filtering by tags', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);
    });

    it('filters by single tag', () => {
      const { result } = renderHook(() => useNotes({ tags: ['farming'] }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Farming Routes');
    });

    it('filters by multiple tags (AND logic)', () => {
      const { result } = renderHook(() => useNotes({ tags: ['farming', 'materials'] }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].tags).toContain('farming');
      expect(result.current.notes[0].tags).toContain('materials');
    });

    it('returns empty when no notes match all tags', () => {
      const { result } = renderHook(() => useNotes({ tags: ['farming', 'teams'] }));

      expect(result.current.notes).toHaveLength(0);
    });
  });

  describe('filtering by search', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);
    });

    it('searches in title', () => {
      const { result } = renderHook(() => useNotes({ search: 'farming' }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Farming Routes');
    });

    it('searches in content', () => {
      const { result } = renderHook(() => useNotes({ search: 'cor lapis' }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Farming Routes');
    });

    it('searches in tags', () => {
      const { result } = renderHook(() => useNotes({ search: 'checklist' }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Weekly Checklist');
    });

    it('search is case insensitive', () => {
      const { result } = renderHook(() => useNotes({ search: 'HU TAO' }));

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Team Compositions');
    });

    it('returns empty when no match found', () => {
      const { result } = renderHook(() => useNotes({ search: 'nonexistent' }));

      expect(result.current.notes).toHaveLength(0);
    });
  });

  describe('combining filters', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);
    });

    it('combines tags and search filters', () => {
      const { result } = renderHook(() =>
        useNotes({ tags: ['farming'], search: 'routes' })
      );

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].title).toBe('Farming Routes');
    });

    it('returns empty when combined filters match nothing', () => {
      const { result } = renderHook(() =>
        useNotes({ tags: ['teams'], search: 'farming' })
      );

      expect(result.current.notes).toHaveLength(0);
    });
  });

  describe('CRUD operations', () => {
    beforeEach(async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockNotes);
    });

    it('provides createNote function', () => {
      const { result } = renderHook(() => useNotes());
      expect(typeof result.current.createNote).toBe('function');
    });

    it('provides updateNote function', () => {
      const { result } = renderHook(() => useNotes());
      expect(typeof result.current.updateNote).toBe('function');
    });

    it('provides deleteNote function', () => {
      const { result } = renderHook(() => useNotes());
      expect(typeof result.current.deleteNote).toBe('function');
    });

    it('calls repo.create when createNote is called', async () => {
      vi.mocked(noteRepo.create).mockResolvedValue('new-note-id');

      const { result } = renderHook(() => useNotes());
      const newNote = {
        title: 'New Note',
        content: 'Note content',
        tags: ['test'],
        pinned: false,
      };

      await result.current.createNote(newNote);

      expect(noteRepo.create).toHaveBeenCalledWith(newNote);
    });

    it('calls repo.update when updateNote is called', async () => {
      vi.mocked(noteRepo.update).mockResolvedValue();

      const { result } = renderHook(() => useNotes());

      await result.current.updateNote('note-1', { title: 'Updated Title' });

      expect(noteRepo.update).toHaveBeenCalledWith('note-1', { title: 'Updated Title' });
    });

    it('calls repo.delete when deleteNote is called', async () => {
      vi.mocked(noteRepo.delete).mockResolvedValue();

      const { result } = renderHook(() => useNotes());

      await result.current.deleteNote('note-1');

      expect(noteRepo.delete).toHaveBeenCalledWith('note-1');
    });
  });
});
