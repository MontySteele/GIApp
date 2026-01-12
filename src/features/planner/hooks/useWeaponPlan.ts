/**
 * useWeaponPlan Hook
 *
 * Manages weapon material planning with reactive updates
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  calculateWeaponAscensionSummary,
  createWeaponGoal,
  type WeaponAscensionSummary,
} from '../domain/weaponCalculator';

export type WeaponGoalType = 'full' | 'comfortable' | 'next';

export interface Weapon {
  id: string;
  key: string;
  level: number;
  ascension: number;
  rarity: 4 | 5;
  refinement?: number;
  equippedBy?: string;
}

interface UseWeaponPlanOptions {
  weapons: Weapon[];
  inventory: Record<string, number>;
  initialSelectedKeys?: string[];
  initialGoalType?: WeaponGoalType;
}

interface UseWeaponPlanResult {
  // Selection state
  selectedWeaponKeys: string[];
  selectWeapon: (key: string) => void;
  deselectWeapon: (key: string) => void;
  toggleWeapon: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (key: string) => boolean;

  // Goal type
  goalType: WeaponGoalType;
  setGoalType: (type: WeaponGoalType) => void;

  // Calculated summaries
  summaries: WeaponAscensionSummary[];
  aggregatedMaterials: AggregatedWeaponMaterials;
  isCalculating: boolean;
  calculationError: string | null;

  // Helpers
  selectedWeapons: Weapon[];
  selectedCount: number;
  hasSelection: boolean;
  totalMora: number;
  totalResin: number;
  totalDays: number;

  // Refresh calculation
  refresh: () => Promise<void>;
}

interface AggregatedWeaponMaterials {
  mora: { required: number; owned: number; deficit: number };
  domain: Map<string, { name: string; required: number; owned: number; deficit: number; tier?: number; availability?: string[] }>;
  elite: Map<string, { name: string; required: number; owned: number; deficit: number; tier?: number }>;
  common: Map<string, { name: string; required: number; owned: number; deficit: number; tier?: number }>;
}

const EMPTY_AGGREGATED: AggregatedWeaponMaterials = {
  mora: { required: 0, owned: 0, deficit: 0 },
  domain: new Map(),
  elite: new Map(),
  common: new Map(),
};

export function useWeaponPlan({
  weapons,
  inventory,
  initialSelectedKeys = [],
  initialGoalType = 'full',
}: UseWeaponPlanOptions): UseWeaponPlanResult {
  // Selection state
  const [selectedWeaponKeys, setSelectedWeaponKeys] = useState<string[]>(
    initialSelectedKeys
  );

  // Goal type state
  const [goalType, setGoalType] = useState<WeaponGoalType>(initialGoalType);

  // Calculation state
  const [summaries, setSummaries] = useState<WeaponAscensionSummary[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Derived: selected weapons
  const selectedWeapons = useMemo(
    () => weapons.filter((w) => selectedWeaponKeys.includes(w.key)),
    [weapons, selectedWeaponKeys]
  );

  const selectedCount = selectedWeaponKeys.length;
  const hasSelection = selectedCount > 0;

  // Selection handlers
  const selectWeapon = useCallback((key: string) => {
    setSelectedWeaponKeys((prev) => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  }, []);

  const deselectWeapon = useCallback((key: string) => {
    setSelectedWeaponKeys((prev) => prev.filter((k) => k !== key));
  }, []);

  const toggleWeapon = useCallback((key: string) => {
    setSelectedWeaponKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedWeaponKeys(weapons.map((w) => w.key));
  }, [weapons]);

  const deselectAll = useCallback(() => {
    setSelectedWeaponKeys([]);
  }, []);

  const isSelected = useCallback(
    (key: string) => selectedWeaponKeys.includes(key),
    [selectedWeaponKeys]
  );

  // Calculate summaries when selection or goal type changes
  const calculateSummaries = useCallback(async () => {
    if (selectedWeapons.length === 0) {
      setSummaries([]);
      setCalculationError(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const goals = selectedWeapons.map((weapon) =>
        createWeaponGoal(weapon, goalType)
      );

      const results = await Promise.all(
        goals.map((goal) => calculateWeaponAscensionSummary(goal, inventory))
      );

      setSummaries(results);

      // Collect errors
      const errors = results
        .filter((s) => s.error)
        .map((s) => `${s.weaponKey}: ${s.error}`);

      if (errors.length > 0) {
        setCalculationError(errors.join('; '));
      }
    } catch (err) {
      setCalculationError(
        err instanceof Error ? err.message : 'Failed to calculate weapon summaries'
      );
    } finally {
      setIsCalculating(false);
    }
  }, [selectedWeapons, goalType, inventory]);

  // Auto-calculate when dependencies change
  useEffect(() => {
    calculateSummaries();
  }, [calculateSummaries]);

  // Aggregate materials from all summaries
  const aggregatedMaterials = useMemo<AggregatedWeaponMaterials>(() => {
    if (summaries.length === 0) return EMPTY_AGGREGATED;

    const result: AggregatedWeaponMaterials = {
      mora: { required: 0, owned: inventory['Mora'] ?? 0, deficit: 0 },
      domain: new Map(),
      elite: new Map(),
      common: new Map(),
    };

    for (const summary of summaries) {
      for (const mat of summary.materials) {
        if (mat.category === 'mora') {
          result.mora.required += mat.required;
        } else if (mat.category === 'domain') {
          const key = `${mat.key}-${mat.tier || 0}`;
          const existing = result.domain.get(key);
          if (existing) {
            existing.required += mat.required;
            existing.deficit = Math.max(0, existing.required - existing.owned);
          } else {
            result.domain.set(key, {
              name: mat.name,
              required: mat.required,
              owned: mat.owned,
              deficit: mat.deficit,
              tier: mat.tier,
              availability: mat.availability,
            });
          }
        } else if (mat.category === 'elite') {
          const key = `${mat.key}-${mat.tier || 0}`;
          const existing = result.elite.get(key);
          if (existing) {
            existing.required += mat.required;
            existing.deficit = Math.max(0, existing.required - existing.owned);
          } else {
            result.elite.set(key, {
              name: mat.name,
              required: mat.required,
              owned: mat.owned,
              deficit: mat.deficit,
              tier: mat.tier,
            });
          }
        } else if (mat.category === 'common') {
          const key = `${mat.key}-${mat.tier || 0}`;
          const existing = result.common.get(key);
          if (existing) {
            existing.required += mat.required;
            existing.deficit = Math.max(0, existing.required - existing.owned);
          } else {
            result.common.set(key, {
              name: mat.name,
              required: mat.required,
              owned: mat.owned,
              deficit: mat.deficit,
              tier: mat.tier,
            });
          }
        }
      }
    }

    result.mora.deficit = Math.max(0, result.mora.required - result.mora.owned);

    return result;
  }, [summaries, inventory]);

  // Calculate totals
  const totalMora = summaries.reduce((sum, s) => sum + s.totalMora, 0);
  const totalResin = summaries.reduce((sum, s) => sum + s.estimatedResin, 0);
  const totalDays = Math.ceil(totalResin / 180);

  return {
    // Selection state
    selectedWeaponKeys,
    selectWeapon,
    deselectWeapon,
    toggleWeapon,
    selectAll,
    deselectAll,
    isSelected,

    // Goal type
    goalType,
    setGoalType,

    // Calculated summaries
    summaries,
    aggregatedMaterials,
    isCalculating,
    calculationError,

    // Helpers
    selectedWeapons,
    selectedCount,
    hasSelection,
    totalMora,
    totalResin,
    totalDays,

    // Refresh
    refresh: calculateSummaries,
  };
}
