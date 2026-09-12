import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { db } from '@/db/schema';
import { ALL_APP_STORAGE_KEYS, STORAGE_KEYS } from '@/lib/constants/storageKeys';
import {
  __testUtils,
  clearAppLocalStorage,
  ensurePersistentStorage,
  formatBytes,
  getStorageEstimate,
  requestPersistentStorage,
  resetAllLocalData,
} from './storageHealth';

function installStorageMock(mock: Partial<StorageManager>): void {
  Object.defineProperty(navigator, 'storage', { value: mock, configurable: true });
}

function removeStorageMock(): void {
  Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, 'storage');
}

describe('storageHealth', () => {
  beforeEach(() => {
    __testUtils.resetPersistMemo();
    localStorage.clear();
  });

  afterEach(() => {
    __testUtils.resetPersistMemo();
    removeStorageMock();
    localStorage.clear();
  });

  describe('requestPersistentStorage', () => {
    it('returns false when navigator.storage is unavailable', async () => {
      await expect(requestPersistentStorage()).resolves.toBe(false);
    });

    it('calls persist() once and memoizes the answer', async () => {
      const persist = vi.fn().mockResolvedValue(true);
      const persisted = vi.fn().mockResolvedValue(false);
      installStorageMock({ persist, persisted });

      await expect(requestPersistentStorage()).resolves.toBe(true);
      await expect(requestPersistentStorage()).resolves.toBe(true);
      ensurePersistentStorage();
      await Promise.resolve();

      expect(persist).toHaveBeenCalledTimes(1);
    });

    it('skips persist() when the origin is already persisted', async () => {
      const persist = vi.fn().mockResolvedValue(true);
      installStorageMock({ persist, persisted: vi.fn().mockResolvedValue(true) });

      await expect(requestPersistentStorage()).resolves.toBe(true);
      expect(persist).not.toHaveBeenCalled();
    });

    it('returns false instead of throwing when persist() rejects', async () => {
      installStorageMock({
        persist: vi.fn().mockRejectedValue(new Error('nope')),
        persisted: vi.fn().mockResolvedValue(false),
      });

      await expect(requestPersistentStorage()).resolves.toBe(false);
    });
  });

  describe('getStorageEstimate', () => {
    it('returns null when estimate() is unavailable', async () => {
      await expect(getStorageEstimate()).resolves.toBeNull();
    });

    it('returns usage, quota and persisted', async () => {
      installStorageMock({
        estimate: vi.fn().mockResolvedValue({ usage: 1234, quota: 5678 }),
        persisted: vi.fn().mockResolvedValue(true),
      });

      await expect(getStorageEstimate()).resolves.toEqual({ usage: 1234, quota: 5678, persisted: true });
    });

    it('defaults missing fields to 0 / false', async () => {
      installStorageMock({ estimate: vi.fn().mockResolvedValue({}) });

      await expect(getStorageEstimate()).resolves.toEqual({ usage: 0, quota: 0, persisted: false });
    });
  });

  describe('clearAppLocalStorage', () => {
    it('removes every app key and leaves foreign keys alone', () => {
      for (const key of ALL_APP_STORAGE_KEYS) localStorage.setItem(key, 'x');
      localStorage.setItem('someone-elses-key', 'keep');

      clearAppLocalStorage();

      for (const key of ALL_APP_STORAGE_KEYS) expect(localStorage.getItem(key)).toBeNull();
      expect(localStorage.getItem('someone-elses-key')).toBe('keep');
    });
  });

  describe('resetAllLocalData', () => {
    it('deletes the database, clears app localStorage (including UI settings) and reloads', async () => {
      await db.open();
      await db.notes.put({
        id: 'n1',
        title: 't',
        content: '',
        tags: [],
        pinned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      localStorage.setItem(STORAGE_KEYS.WISHLIST, '{"state":{"characters":[]}}');
      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, '{"state":{}}');
      const reload = vi.fn();

      await resetAllLocalData({ reload });

      expect(reload).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(STORAGE_KEYS.WISHLIST)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.UI_SETTINGS)).toBeNull();
      expect(await Dexie.exists(db.name)).toBe(false);

      // Re-open for any later test in this worker; Dexie recreates the DB.
      await db.open();
      expect(await db.notes.count()).toBe(0);
    });
  });

  describe('formatBytes', () => {
    it('formats byte counts', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
      expect(formatBytes(250 * 1024 * 1024)).toBe('250 MB');
    });
  });
});
