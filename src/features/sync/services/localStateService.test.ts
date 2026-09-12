import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BACKED_UP_LOCAL_STATE_KEYS, STORAGE_KEYS } from '@/lib/constants/storageKeys';
import { useWishlistStore } from '@/stores/wishlistStore';
import { collectLocalState, restoreLocalState } from './localStateService';

const wishlistBlob = JSON.stringify({
  state: {
    characters: [{ key: 'Furina', targetGoal: 'full', addedAt: '2026-01-01T00:00:00.000Z' }],
  },
  version: 0,
});

describe('localStateService', () => {
  // setState triggers the persist middleware, so reset the store first and
  // clear storage second, otherwise the wishlist key reappears.
  beforeEach(() => {
    useWishlistStore.setState({ characters: [] });
    localStorage.clear();
  });

  afterEach(() => {
    useWishlistStore.setState({ characters: [] });
    localStorage.clear();
  });

  describe('collectLocalState', () => {
    it('returns only allowlisted keys that have a value, as raw strings', () => {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, wishlistBlob);
      localStorage.setItem(STORAGE_KEYS.RESIN_BUDGET, '{"maxResin":200}');
      localStorage.setItem(STORAGE_KEYS.CHECKLIST_DISMISSED, 'true');
      localStorage.setItem(STORAGE_KEYS.UI_SETTINGS, '{"state":{"theme":"dark"}}');
      localStorage.setItem('unrelated', 'x');

      const entries = collectLocalState();
      const keys = entries.map((e) => e.key);

      expect(keys).toEqual(
        expect.arrayContaining([STORAGE_KEYS.WISHLIST, STORAGE_KEYS.RESIN_BUDGET, STORAGE_KEYS.CHECKLIST_DISMISSED])
      );
      expect(keys).not.toContain(STORAGE_KEYS.UI_SETTINGS);
      expect(keys).not.toContain('unrelated');
      expect(entries.find((e) => e.key === STORAGE_KEYS.WISHLIST)?.value).toBe(wishlistBlob);
      for (const key of keys) expect(BACKED_UP_LOCAL_STATE_KEYS).toContain(key);
    });

    it('returns an empty array when nothing is stored', () => {
      expect(collectLocalState()).toEqual([]);
    });
  });

  describe('restoreLocalState', () => {
    it('writes allowlisted keys and ignores unknown or preference keys', async () => {
      const stats = await restoreLocalState([
        { key: STORAGE_KEYS.PLANNER_STATE, value: '{"mode":"multi"}' },
        { key: STORAGE_KEYS.UI_SETTINGS, value: '{"state":{"theme":"light"}}' },
        { key: 'evil-key', value: 'nope' },
      ]);

      expect(stats).toEqual({ created: 1, skipped: 2 });
      expect(localStorage.getItem(STORAGE_KEYS.PLANNER_STATE)).toBe('{"mode":"multi"}');
      expect(localStorage.getItem(STORAGE_KEYS.UI_SETTINGS)).toBeNull();
      expect(localStorage.getItem('evil-key')).toBeNull();
    });

    it('overwrites existing values (last-write-wins)', async () => {
      localStorage.setItem(STORAGE_KEYS.RESIN_BUDGET, 'old');
      await restoreLocalState([{ key: STORAGE_KEYS.RESIN_BUDGET, value: 'new' }]);
      expect(localStorage.getItem(STORAGE_KEYS.RESIN_BUDGET)).toBe('new');
    });

    it('handles empty or missing input', async () => {
      await expect(restoreLocalState(undefined)).resolves.toEqual({ created: 0, skipped: 0 });
      await expect(restoreLocalState([])).resolves.toEqual({ created: 0, skipped: 0 });
    });

    it('rehydrates the wishlist store so Targets see the restored wishlist', async () => {
      await restoreLocalState([{ key: STORAGE_KEYS.WISHLIST, value: wishlistBlob }]);

      expect(localStorage.getItem(STORAGE_KEYS.WISHLIST)).toBe(wishlistBlob);
      expect(useWishlistStore.getState().characters.map((c) => c.key)).toEqual(['Furina']);
    });

    it('round-trips a wishlist string through collect -> restore', async () => {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, wishlistBlob);
      const snapshot = collectLocalState();
      localStorage.clear();

      await restoreLocalState(snapshot);

      expect(localStorage.getItem(STORAGE_KEYS.WISHLIST)).toBe(wishlistBlob);
    });
  });
});
