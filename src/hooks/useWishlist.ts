/**
 * Character Wishlist Hook — thin wrapper around the Zustand store.
 *
 * Kept for backward compatibility so existing imports continue to work.
 * All state now lives in the shared Zustand store, eliminating
 * the dual-hook synchronization problem.
 */

export type { WishlistCharacter } from '@/stores/wishlistStore';
import { useWishlistStore } from '@/stores/wishlistStore';

export function useWishlist() {
  const store = useWishlistStore();

  return {
    wishlistCharacters: store.characters,
    addCharacter: store.addCharacter,
    removeCharacter: store.removeCharacter,
    updateCharacter: store.updateCharacter,
    isWishlisted: store.isWishlisted,
    getWishlistCharacter: store.getWishlistCharacter,
    clearWishlist: store.clearWishlist,
    wishlistCount: store.characters.length,
  };
}
