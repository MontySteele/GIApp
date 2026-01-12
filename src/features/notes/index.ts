/**
 * Notes Feature
 *
 * Public API for notes and goals management
 */

// Pages
export { default as NotesPage } from './pages/NotesPage';

// Hooks
export { useNotes } from './hooks/useNotes';
export { useGoals } from './hooks/useGoals';

// Repositories
export { noteRepo } from './repo/noteRepo';
export { goalRepo } from './repo/goalRepo';
