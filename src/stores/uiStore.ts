import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { INCOME_F2P } from '@/lib/constants';
import type { BannerType } from '@/types';

interface CalculatorDefaults {
  bannerType: BannerType;
  simulationCount: number;
  confidenceLevel: number;
  availablePulls: number;
  dailyPrimogemIncome: number;
  daysAvailable: number;
  targetProbability: number;
  pityPreset: {
    pity: number;
    guaranteed: boolean;
    radiantStreak: number;
  };
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

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const DEFAULT_SETTINGS: UISettings = {
  dateFormat: 'MM/dd/yyyy',
  defaultTheme: 'system',
  backupReminderCadenceDays: 14,
  calculatorDefaults: {
    bannerType: 'character',
    simulationCount: 5000,
    confidenceLevel: 80,
    availablePulls: 0,
    dailyPrimogemIncome: INCOME_F2P,
    daysAvailable: 42,
    targetProbability: 80,
    pityPreset: {
      pity: 0,
      guaranteed: false,
      radiantStreak: 0,
    },
  },
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
            calculatorDefaults: settings.calculatorDefaults
              ? { ...state.settings.calculatorDefaults, ...settings.calculatorDefaults }
              : state.settings.calculatorDefaults,
          },
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
      name: 'ui-store',
      partialize: (state) => ({
        settings: state.settings,
        theme: state.theme,
      }),
      storage: createJSONStorage(() =>
        typeof window === 'undefined' || !window.localStorage ? fallbackStorage : window.localStorage
      ),
    }
  )
);
