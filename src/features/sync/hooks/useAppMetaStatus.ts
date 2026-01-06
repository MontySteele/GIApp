import { useLiveQuery } from 'dexie-react-hooks';
import { appMetaService, type AppMetaStatus } from '../services/appMetaService';

const defaultStatus: AppMetaStatus = {
  createdAt: undefined,
  schemaVersion: undefined,
  needsBackup: false,
  schemaMismatch: false,
};

export function useAppMetaStatus() {
  const status = useLiveQuery(() => appMetaService.getMetaStatus(), []);

  return {
    status: status ?? defaultStatus,
    isLoading: status === undefined,
  };
}
