import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const shellOpen = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: shellOpen,
}));

import { isTauri, openExternal } from './openExternal';

const tauriWindow = window as unknown as Record<string, unknown>;

describe('openExternal', () => {
  beforeEach(() => {
    shellOpen.mockClear();
  });

  afterEach(() => {
    delete tauriWindow.__TAURI__;
    vi.restoreAllMocks();
  });

  it('reports non-Tauri by default in the browser', () => {
    expect(isTauri()).toBe(false);
  });

  it('calls window.open synchronously with noopener in a browser', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    openExternal('https://example.com/page');

    // Synchronous: assert before yielding to the event loop
    expect(windowOpen).toHaveBeenCalledTimes(1);
    expect(windowOpen).toHaveBeenCalledWith('https://example.com/page', '_blank', 'noopener,noreferrer');
    expect(shellOpen).not.toHaveBeenCalled();
  });

  it('uses the Tauri shell plugin when running inside Tauri', async () => {
    tauriWindow.__TAURI__ = {};
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(isTauri()).toBe(true);
    openExternal('https://example.com/page');

    await vi.waitFor(() => {
      expect(shellOpen).toHaveBeenCalledWith('https://example.com/page');
    });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('logs instead of throwing when the shell plugin rejects', async () => {
    tauriWindow.__TAURI__ = {};
    shellOpen.mockRejectedValueOnce(new Error('denied'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => openExternal('https://example.com/page')).not.toThrow();

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to open external URL:', expect.any(Error));
    });
  });
});
