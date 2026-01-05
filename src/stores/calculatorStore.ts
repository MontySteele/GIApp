import { create } from 'zustand';
import type { BannerPityState } from '@/types';

interface CalculatorState {
  // Current pity state
  pityState: BannerPityState;
  setPityState: (state: BannerPityState) => void;

  // Calculator inputs
  availablePulls: number;
  setAvailablePulls: (pulls: number) => void;

  // Simulation config
  simulationCount: 5000 | 20000 | 100000;
  setSimulationCount: (count: 5000 | 20000 | 100000) => void;

  confidenceLevel: 50 | 80 | 90 | 99;
  setConfidenceLevel: (level: 50 | 80 | 90 | 99) => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  pityState: {
    character: {
      pity: 0,
      guaranteed: false,
      radiantStreak: 0,
    },
    weapon: {
      pity: 0,
      fatePoints: 0,
      chartedWeapon: null,
    },
    standard: {
      pity: 0,
    },
    chronicled: {
      pity: 0,
      guaranteed: false,
    },
  },
  setPityState: (state) => set({ pityState: state }),

  availablePulls: 0,
  setAvailablePulls: (pulls) => set({ availablePulls: pulls }),

  simulationCount: 20000,
  setSimulationCount: (count) => set({ simulationCount: count }),

  confidenceLevel: 80,
  setConfidenceLevel: (level) => set({ confidenceLevel: level }),
}));
