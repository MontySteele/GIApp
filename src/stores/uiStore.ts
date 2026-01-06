import { create } from 'zustand';

interface CalculatorDefaults {
  availablePulls: number;
  simulationCount: 5000 | 20000 | 100000;
  confidenceLevel: 50 | 80 | 90 | 99;
}

interface UISettings {
  dateFormat: string;
  defaultTheme: 'light' | 'dark' | 'system';
  backupReminderCadenceDays: number;
  calculatorDefaults: CalculatorDefaults;
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
  calculatorDefaults: {
    availablePulls: 0,
    simulationCount: 20000,
    confidenceLevel: 80,
  },
};

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  settings: {
    ...DEFAULT_SETTINGS,
    calculatorDefaults: { ...DEFAULT_SETTINGS.calculatorDefaults },
  },
  updateSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
        calculatorDefaults: {
          ...state.settings.calculatorDefaults,
          ...(settings.calculatorDefaults ?? {}),
        },
      },
    })),
  resetSettings: () =>
    set({
      settings: {
        ...DEFAULT_SETTINGS,
        calculatorDefaults: { ...DEFAULT_SETTINGS.calculatorDefaults },
      },
    }),

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
