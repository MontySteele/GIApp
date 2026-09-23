import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage } from './storagePersistence';

describe('requestPersistentStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks for persistence when storage is not yet persistent', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { storage: { persisted: vi.fn().mockResolvedValue(false), persist } });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('skips the request when storage is already persistent', async () => {
    const persist = vi.fn();
    vi.stubGlobal('navigator', { storage: { persisted: vi.fn().mockResolvedValue(true), persist } });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('returns false when the Storage API is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    await expect(requestPersistentStorage()).resolves.toBe(false);
  });
});
