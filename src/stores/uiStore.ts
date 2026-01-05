import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Roster filters
  rosterFilter: {
    element: string | null;
    weaponType: string | null;
    rarity: number | null;
    priority: string | null;
    search: string;
  };
  setRosterFilter: (filter: Partial<UIState['rosterFilter']>) => void;

  // Wishes filters
  wishesFilter: {
    bannerType: string | null;
    rarity: number | null;
    dateRange: { start: string; end: string } | null;
  };
  setWishesFilter: (filter: Partial<UIState['wishesFilter']>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  rosterFilter: {
    element: null,
    weaponType: null,
    rarity: null,
    priority: null,
    search: '',
  },
  setRosterFilter: (filter) =>
    set((state) => ({
      rosterFilter: { ...state.rosterFilter, ...filter },
    })),

  wishesFilter: {
    bannerType: null,
    rarity: null,
    dateRange: null,
  },
  setWishesFilter: (filter) =>
    set((state) => ({
      wishesFilter: { ...state.wishesFilter, ...filter },
    })),
}));
