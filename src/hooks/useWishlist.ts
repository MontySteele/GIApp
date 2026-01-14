/**
 * Character Wishlist Hook
 *
 * Manages a list of characters the user wants to pre-farm for (but doesn't own yet).
 * Stores data in localStorage for simplicity.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'genshin-character-wishlist';

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

export interface WishlistState {
  characters: WishlistCharacter[];
}

const defaultState: WishlistState = {
  characters: [],
};

function loadState(): WishlistState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load wishlist state:', e);
  }
  return defaultState;
}

function saveState(state: WishlistState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save wishlist state:', e);
  }
}

export function useWishlist() {
  const [state, setState] = useState<WishlistState>(loadState);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const addCharacter = useCallback((key: string, targetGoal: WishlistCharacter['targetGoal'] = 'comfortable', notes?: string) => {
    setState((prev) => {
      // Don't add duplicates
      if (prev.characters.some((c) => c.key === key)) {
        return prev;
      }
      return {
        ...prev,
        characters: [
          ...prev.characters,
          {
            key,
            targetGoal,
            addedAt: new Date().toISOString(),
            notes,
          },
        ],
      };
    });
  }, []);

  const removeCharacter = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.key !== key),
    }));
  }, []);

  const updateCharacter = useCallback((key: string, updates: Partial<Omit<WishlistCharacter, 'key' | 'addedAt'>>) => {
    setState((prev) => ({
      ...prev,
      characters: prev.characters.map((c) =>
        c.key === key ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const isWishlisted = useCallback((key: string) => {
    return state.characters.some((c) => c.key === key);
  }, [state.characters]);

  const getWishlistCharacter = useCallback((key: string) => {
    return state.characters.find((c) => c.key === key);
  }, [state.characters]);

  const clearWishlist = useCallback(() => {
    setState(defaultState);
  }, []);

  return {
    wishlistCharacters: state.characters,
    addCharacter,
    removeCharacter,
    updateCharacter,
    isWishlisted,
    getWishlistCharacter,
    clearWishlist,
    wishlistCount: state.characters.length,
  };
}
