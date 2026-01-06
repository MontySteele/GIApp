import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { noteRepo } from '../repo/noteRepo';
import type { Note } from '@/types';

interface NoteQuery {
  search?: string;
  tags?: string[];
}

export function useNotes(query?: NoteQuery) {
  const notes = useLiveQuery(() => noteRepo.getAll(), []);

  const filteredNotes = useMemo(() => {
    let results = notes ?? [];

    if (query?.tags?.length) {
      results = results.filter((note) => query.tags?.every((tag) => note.tags.includes(tag)));
    }

    if (query?.search) {
      const search = query.search.toLowerCase();
      results = results.filter(
        (note) =>
          note.title.toLowerCase().includes(search) ||
          note.content.toLowerCase().includes(search) ||
          note.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    return [...results].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, query?.search, query?.tags]);

  const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    return noteRepo.create(note);
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
    return noteRepo.update(id, updates);
  };

  const deleteNote = async (id: string) => {
    return noteRepo.delete(id);
  };

  return {
    notes: filteredNotes,
    allNotes: notes ?? [],
    createNote,
    updateNote,
    deleteNote,
    isLoading: notes === undefined,
  };
}
