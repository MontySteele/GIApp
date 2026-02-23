import { describe, it, expect, beforeEach } from 'vitest';
import { useWishlistStore } from './wishlistStore';

describe('wishlistStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useWishlistStore.setState({ characters: [] });
  });

  describe('addCharacter', () => {
    it('adds a character to the wishlist', () => {
      useWishlistStore.getState().addCharacter('Furina', 'full');

      const { characters } = useWishlistStore.getState();
      expect(characters).toHaveLength(1);
      expect(characters[0].key).toBe('Furina');
      expect(characters[0].targetGoal).toBe('full');
      expect(characters[0].addedAt).toBeDefined();
    });

    it('defaults targetGoal to comfortable', () => {
      useWishlistStore.getState().addCharacter('Furina');

      expect(useWishlistStore.getState().characters[0].targetGoal).toBe('comfortable');
    });

    it('does not add duplicate characters (case-insensitive)', () => {
      useWishlistStore.getState().addCharacter('Furina');
      useWishlistStore.getState().addCharacter('furina');
      useWishlistStore.getState().addCharacter('FURINA');

      expect(useWishlistStore.getState().characters).toHaveLength(1);
    });

    it('stores optional notes', () => {
      useWishlistStore.getState().addCharacter('Furina', 'full', 'Want C2');

      expect(useWishlistStore.getState().characters[0].notes).toBe('Want C2');
    });
  });

  describe('removeCharacter', () => {
    it('removes a character by key', () => {
      useWishlistStore.getState().addCharacter('Furina');
      useWishlistStore.getState().addCharacter('Neuvillette');

      useWishlistStore.getState().removeCharacter('Furina');

      const keys = useWishlistStore.getState().characters.map((c) => c.key);
      expect(keys).toEqual(['Neuvillette']);
    });

    it('removes case-insensitively', () => {
      useWishlistStore.getState().addCharacter('Furina');
      useWishlistStore.getState().removeCharacter('furina');

      expect(useWishlistStore.getState().characters).toHaveLength(0);
    });
  });

  describe('updateCharacter', () => {
    it('updates targetGoal for existing character', () => {
      useWishlistStore.getState().addCharacter('Furina', 'comfortable');
      useWishlistStore.getState().updateCharacter('Furina', { targetGoal: 'full' });

      expect(useWishlistStore.getState().characters[0].targetGoal).toBe('full');
    });

    it('updates case-insensitively', () => {
      useWishlistStore.getState().addCharacter('Furina', 'comfortable');
      useWishlistStore.getState().updateCharacter('furina', { targetGoal: 'full' });

      expect(useWishlistStore.getState().characters[0].targetGoal).toBe('full');
    });
  });

  describe('isWishlisted', () => {
    it('returns true for wishlisted character', () => {
      useWishlistStore.getState().addCharacter('Furina');

      expect(useWishlistStore.getState().isWishlisted('Furina')).toBe(true);
    });

    it('returns false for non-wishlisted character', () => {
      expect(useWishlistStore.getState().isWishlisted('Furina')).toBe(false);
    });

    it('is case-insensitive', () => {
      useWishlistStore.getState().addCharacter('Furina');

      expect(useWishlistStore.getState().isWishlisted('furina')).toBe(true);
      expect(useWishlistStore.getState().isWishlisted('FURINA')).toBe(true);
    });
  });

  describe('getWishlistCharacter', () => {
    it('returns the wishlist entry for a character', () => {
      useWishlistStore.getState().addCharacter('Furina', 'full', 'Notes');

      const entry = useWishlistStore.getState().getWishlistCharacter('Furina');
      expect(entry?.key).toBe('Furina');
      expect(entry?.targetGoal).toBe('full');
      expect(entry?.notes).toBe('Notes');
    });

    it('returns undefined for non-wishlisted character', () => {
      expect(useWishlistStore.getState().getWishlistCharacter('Furina')).toBeUndefined();
    });

    it('is case-insensitive', () => {
      useWishlistStore.getState().addCharacter('Furina');

      expect(useWishlistStore.getState().getWishlistCharacter('furina')).toBeDefined();
    });
  });

  describe('clearWishlist', () => {
    it('removes all characters', () => {
      useWishlistStore.getState().addCharacter('Furina');
      useWishlistStore.getState().addCharacter('Neuvillette');

      useWishlistStore.getState().clearWishlist();

      expect(useWishlistStore.getState().characters).toHaveLength(0);
    });
  });
});
