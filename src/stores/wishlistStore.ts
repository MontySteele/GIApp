/**
 * Wishlist Store (Zustand)
 *
 * Manages characters the user wants to pre-farm for (but doesn't own yet).
 * Replaces the previous useWishlist hook that used manual localStorage.
 *
 * Using Zustand's persist middleware ensures a single source of truth —
 * every component that calls useWishlistStore shares the same state,
 * eliminating the dual-hook synchronization bug.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistCharacter {
  /** Character key (e.g., "Furina", "KaedeharaKazuha") */
  key: string;
  /** Target goal for material calculation */
  targetGoal: 'functional' | 'comfortable' | 'full';
  /** When added to wishlist */
  addedAt: string;
  /** Optional notes */
  notes?: string;
}

interface WishlistState {
  characters: WishlistCharacter[];

  addCharacter: (key: string, targetGoal?: WishlistCharacter['targetGoal'], notes?: string) => void;
  removeCharacter: (key: string) => void;
  updateCharacter: (key: string, updates: Partial<Omit<WishlistCharacter, 'key' | 'addedAt'>>) => void;
  isWishlisted: (key: string) => boolean;
  getWishlistCharacter: (key: string) => WishlistCharacter | undefined;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      characters: [],

      addCharacter: (key, targetGoal = 'comfortable', notes) => {
        set((state) => {
          // Case-insensitive duplicate check
          if (state.characters.some((c) => c.key.toLowerCase() === key.toLowerCase())) {
            return state;
          }
          return {
            characters: [
              ...state.characters,
              {
                key,
                targetGoal,
                addedAt: new Date().toISOString(),
                notes,
              },
            ],
          };
        });
      },

      removeCharacter: (key) => {
        set((state) => ({
          characters: state.characters.filter(
            (c) => c.key.toLowerCase() !== key.toLowerCase()
          ),
        }));
      },

      updateCharacter: (key, updates) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.key.toLowerCase() === key.toLowerCase() ? { ...c, ...updates } : c
          ),
        }));
      },

      isWishlisted: (key) => {
        return get().characters.some(
          (c) => c.key.toLowerCase() === key.toLowerCase()
        );
      },

      getWishlistCharacter: (key) => {
        return get().characters.find(
          (c) => c.key.toLowerCase() === key.toLowerCase()
        );
      },

      clearWishlist: () => {
        set({ characters: [] });
      },
    }),
    {
      name: 'genshin-character-wishlist',
    }
  )
);
