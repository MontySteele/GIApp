import { create } from 'zustand';

interface UISettings {
  dateFormat: string;
  defaultTheme: 'light' | 'dark' | 'system';
  backupReminderCadenceDays: number;
}

interface UIState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Settings surface
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
  defaultTheme: 'system',
  backupReminderCadenceDays: 14,
};

const SETTINGS_STORAGE_KEY = 'ui-settings';
const THEME_STORAGE_KEY = 'ui-theme';

const loadStoredSettings = (): UISettings => {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };

  const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(stored) as Partial<UISettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.warn('Failed to parse stored UI settings', error);
    return { ...DEFAULT_SETTINGS };
  }
};

const loadStoredTheme = (): UIState['theme'] | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return null;
};

export const useUIStore = create<UIState>((set, get) => ({
  theme: loadStoredTheme() ?? loadStoredSettings().defaultTheme,
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    set({ theme });
  },

  settings: loadStoredSettings(),
  updateSettings: (settings) =>
    set((state) => {
      const mergedSettings = { ...state.settings, ...settings };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
      }

      if (settings.defaultTheme) {
        const currentTheme = get().theme;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(THEME_STORAGE_KEY, settings.defaultTheme);
        }
        return { settings: mergedSettings, theme: settings.defaultTheme ?? currentTheme };
      }

      return { settings: mergedSettings };
    }),
  resetSettings: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_SETTINGS.defaultTheme);
    }
    set({ settings: { ...DEFAULT_SETTINGS }, theme: DEFAULT_SETTINGS.defaultTheme });
  },

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
