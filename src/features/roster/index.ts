/**
 * Roster Feature
 *
 * Public API for character and team management
 */

// Pages
export { default as RosterPage } from './pages/RosterPage';
export { default as CharacterDetailPage } from './pages/CharacterDetailPage';

// Hooks
export { useCharacters, useCharacter } from './hooks/useCharacters';
export { useTeams, useTeam } from './hooks/useTeams';
export { useRosterModals } from './hooks/useRosterModals';

// Repositories
export { characterRepo } from './repo/characterRepo';
export { teamRepo } from './repo/teamRepo';
export { materialRepo, importRecordRepo } from './repo/inventoryRepo';

// Selectors
export {
  filterAndSortCharacters,
  type CharacterQuery,
  type CharacterSortField,
  type SortDirection,
} from './selectors/characterSelectors';

// Data
export { getCharacterMetadata } from './data/characterMetadata';

// Services
export {
  parseIrminsulJson,
  previewImport,
  importIrminsul,
  getLastImport,
  getImportHistory,
  type ImportOptions,
  type ImportSummary,
} from './services/irminsulImport';

// Components
export { default as CharacterCard } from './components/CharacterCard';
export { default as CharacterForm } from './components/CharacterForm';
export { default as CharacterToolbar, type FilterState } from './components/CharacterToolbar';
export { default as TeamCard } from './components/TeamCard';
export { default as TeamForm } from './components/TeamForm';
export { default as TeamSection } from './components/TeamSection';
export { default as AddCharacterModal } from './components/AddCharacterModal';
export { default as DeleteConfirmModal } from './components/DeleteConfirmModal';
export { default as EmptyState } from './components/EmptyState';
export { default as GOODExport } from './components/GOODExport';
export { default as GOODImport } from './components/GOODImport';
export { default as IrminsulImport } from './components/IrminsulImport';
export { default as EnkaImport } from './components/EnkaImport';
export { default as QRCameraScanner } from './components/QRCameraScanner';
export { default as TeamSnapshotExport } from './components/TeamSnapshotExport';
