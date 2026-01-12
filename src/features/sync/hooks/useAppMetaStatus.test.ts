import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppMetaStatus } from './useAppMetaStatus';
import { appMetaService, type AppMetaStatus } from '../services/appMetaService';

// Mock dependencies
vi.mock('../services/appMetaService', () => ({
  appMetaService: {
    getMetaStatus: vi.fn(),
  },
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}));

const mockStatus: AppMetaStatus = {
  createdAt: '2024-01-01T00:00:00Z',
  lastBackupAt: '2024-01-15T00:00:00Z',
  schemaVersion: 5,
  needsBackup: false,
  schemaMismatch: false,
};

const defaultStatus: AppMetaStatus = {
  createdAt: undefined,
  lastBackupAt: undefined,
  schemaVersion: undefined,
  needsBackup: false,
  schemaMismatch: false,
};

describe('useAppMetaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('returns default status when loading', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.status).toEqual(defaultStatus);
    });

    it('returns loaded status when data is available', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toEqual(mockStatus);
    });
  });

  describe('status values', () => {
    it('returns createdAt from status', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('returns lastBackupAt from status', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.lastBackupAt).toBe('2024-01-15T00:00:00Z');
    });

    it('returns schemaVersion from status', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.schemaVersion).toBe(5);
    });
  });

  describe('backup indicators', () => {
    it('returns needsBackup false when recent backup exists', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.needsBackup).toBe(false);
    });

    it('returns needsBackup true when backup is needed', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue({ ...mockStatus, needsBackup: true });

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.needsBackup).toBe(true);
    });
  });

  describe('schema indicators', () => {
    it('returns schemaMismatch false when schema matches', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.schemaMismatch).toBe(false);
    });

    it('returns schemaMismatch true when schema differs', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue({ ...mockStatus, schemaMismatch: true });

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.schemaMismatch).toBe(true);
    });
  });

  describe('default values', () => {
    it('provides safe defaults for undefined status', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(undefined);

      const { result } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.createdAt).toBeUndefined();
      expect(result.current.status.lastBackupAt).toBeUndefined();
      expect(result.current.status.schemaVersion).toBeUndefined();
      expect(result.current.status.needsBackup).toBe(false);
      expect(result.current.status.schemaMismatch).toBe(false);
    });
  });

  describe('state changes', () => {
    it('updates when status changes', async () => {
      const { useLiveQuery } = vi.mocked(await import('dexie-react-hooks'));
      useLiveQuery.mockReturnValue(mockStatus);

      const { result, rerender } = renderHook(() => useAppMetaStatus());

      expect(result.current.status.needsBackup).toBe(false);

      // Simulate status change
      useLiveQuery.mockReturnValue({ ...mockStatus, needsBackup: true });
      rerender();

      expect(result.current.status.needsBackup).toBe(true);
    });
  });
});
