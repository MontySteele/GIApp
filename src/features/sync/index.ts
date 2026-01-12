/**
 * Sync Feature
 *
 * Public API for backup, sync, and settings management
 */

// Pages
export { default as SyncPage } from './pages/SyncPage';

// Hooks
export { useAppMetaStatus } from './hooks/useAppMetaStatus';

// Services
export {
  appMetaService,
  parseDateString,
  resolveBackupCadenceDays,
  type AppMetaStatus,
} from './services/appMetaService';

export {
  validateBackup,
  importBackup,
  importPartial,
  type MergeStrategy,
  type BackupData,
  type ImportResult,
  type ValidationResult,
  type ImportableTable,
} from './services/importService';

export {
  compressData,
  decompressData,
  encryptData,
  decryptData,
} from './services/syncUtils';

// Components
export { default as BackupReminderBanner } from './components/BackupReminderBanner';
export { default as DataTransfer } from './components/DataTransfer';
export { default as ImportBackup } from './components/ImportBackup';
