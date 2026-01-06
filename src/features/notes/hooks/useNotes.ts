import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { noteRepo, type NoteQuery } from '../repo/noteRepo';
import type { Note } from '@/types';

export function useNotes(filters: NoteQuery = {}) {
  const notes = useLiveQuery(() => noteRepo.query(filters), [
    filters.tags?.join(','),
    filters.search,
    filters.pinnedOnly,
  ]);

  const sortedNotes = useMemo(() => notes ?? [], [notes]);

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
    notes: sortedNotes,
    isLoading: notes === undefined,
    createNote,
    updateNote,
    deleteNote,
  };
}

export function useNote(id: string | undefined) {
  const note = useLiveQuery(() => (id ? noteRepo.getById(id) : undefined), [id]);

  return {
    note,
    isLoading: note === undefined && id !== undefined,
  };
}
