import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SERVER_REGION,
  getServerRegionFromTimezone,
  isServerRegion,
  type ServerRegion,
} from '@/lib/time/serverTime';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UISettings {
  dateFormat: string;
  theme: ThemeMode;
  backupReminderCadenceDays: number;
  showManualWishEntry: boolean;
  showManualPrimogemEntry: boolean;
  /** Genshin server the player is on; drives daily/weekly reset and "today's domains". */
  serverRegion: ServerRegion;
}

interface UIState {
  // Settings surface (persisted)
  settings: UISettings;
  updateSettings: (settings: Partial<UISettings>) => void;
  resetSettings: () => void;

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

export const DEFAULT_SETTINGS: UISettings = {
  dateFormat: 'MM/dd/yyyy',
  theme: 'dark',
  backupReminderCadenceDays: 14,
  showManualWishEntry: false,
  showManualPrimogemEntry: false,
  serverRegion: getServerRegionFromTimezone(),
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
      resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),

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
    }),
    {
      name: 'giapp-ui-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

/**
 * Resolve the configured server region, tolerating settings persisted before
 * `serverRegion` existed (the persisted `settings` object replaces the default
 * wholesale, so the field may be missing).
 */
function resolveServerRegion(settings: Partial<UISettings> | undefined): ServerRegion {
  const region = settings?.serverRegion;
  if (isServerRegion(region)) return region;
  return DEFAULT_SETTINGS.serverRegion ?? DEFAULT_SERVER_REGION;
}

/** React hook: the user's configured server region. */
export function useServerRegion(): ServerRegion {
  return useUIStore((state) => resolveServerRegion(state.settings));
}

/** Non-hook accessor for the configured server region (domain code, defaults). */
export function getCurrentServerRegion(): ServerRegion {
  return resolveServerRegion(useUIStore.getState().settings);
}
