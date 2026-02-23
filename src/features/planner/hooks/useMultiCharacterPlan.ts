/**
 * useMultiCharacterPlan Hook
 *
 * Manages multi-character material planning with reactive updates
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  calculateMultiCharacterSummary,
  createGoalsFromCharacters,
  type AggregatedMaterialSummary,
} from '../domain/multiCharacterCalculator';
import type { Character } from '@/types';
import type { WishlistCharacter } from '@/hooks/useWishlist';

export type GoalType = 'full' | 'comfortable' | 'functional' | 'next';

interface UseMultiCharacterPlanOptions {
  characters: Character[];
  inventory: Record<string, number>;
  initialSelectedKeys?: string[];
  initialGoalType?: GoalType;
  /** Wishlist characters (not yet owned) to include in planning */
  wishlistCharacters?: WishlistCharacter[];
}

interface UseMultiCharacterPlanResult {
  // Selection state
  selectedCharacterKeys: string[];
  selectCharacter: (key: string) => void;
  deselectCharacter: (key: string) => void;
  toggleCharacter: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (key: string) => boolean;

  // Goal type
  goalType: GoalType;
  setGoalType: (type: GoalType) => void;

  // Calculated summary
  summary: AggregatedMaterialSummary | null;
  isCalculating: boolean;
  calculationError: string | null;

  // Helpers
  selectedCharacters: Character[];
  selectedCount: number;
  hasSelection: boolean;

  // Refresh calculation
  refresh: () => Promise<void>;
}

const EMPTY_SUMMARY: AggregatedMaterialSummary = {
  characterSummaries: [],
  aggregatedMaterials: [],
  groupedMaterials: {
    mora: [],
    exp: [],
    boss: [],
    gem: [],
    localSpecialty: [],
    common: [],
    talent: [],
    weekly: [],
    crown: [],
  },
  totalMora: 0,
  totalExp: 0,
  totalEstimatedResin: 0,
  totalEstimatedDays: 0,
  resinBreakdown: {
    talentBoss: 0,
    expMora: 0,
    total: 0,
  },
  allCanAscend: true,
  anyStale: false,
  errors: [],
};

export function useMultiCharacterPlan({
  characters,
  inventory,
  initialSelectedKeys = [],
  initialGoalType = 'full',
  wishlistCharacters = [],
}: UseMultiCharacterPlanOptions): UseMultiCharacterPlanResult {
  // Selection state
  const [selectedCharacterKeys, setSelectedCharacterKeys] = useState<string[]>(
    initialSelectedKeys
  );

  // Goal type state
  const [goalType, setGoalType] = useState<GoalType>(initialGoalType);

  // Calculation state
  const [summary, setSummary] = useState<AggregatedMaterialSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Derived: selected characters
  const selectedCharacters = useMemo(
    () => characters.filter((c) => selectedCharacterKeys.includes(c.key)),
    [characters, selectedCharacterKeys]
  );

  const selectedCount = selectedCharacterKeys.length;
  const wishlistCount = wishlistCharacters.length;
  const totalSelectedCount = selectedCount + wishlistCount;
  const hasSelection = totalSelectedCount > 0;

  // Selection handlers
  const selectCharacter = useCallback((key: string) => {
    setSelectedCharacterKeys((prev) => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  }, []);

  const deselectCharacter = useCallback((key: string) => {
    setSelectedCharacterKeys((prev) => prev.filter((k) => k !== key));
  }, []);

  const toggleCharacter = useCallback((key: string) => {
    setSelectedCharacterKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCharacterKeys(characters.map((c) => c.key));
  }, [characters]);

  const deselectAll = useCallback(() => {
    setSelectedCharacterKeys([]);
  }, []);

  const isSelected = useCallback(
    (key: string) => selectedCharacterKeys.includes(key),
    [selectedCharacterKeys]
  );

  // Calculate summary when selection or goal type changes
  const calculateSummary = useCallback(async () => {
    const hasOwnedSelection = selectedCharacters.length > 0;
    const hasWishlistSelection = wishlistCharacters.length > 0;

    if (!hasOwnedSelection && !hasWishlistSelection) {
      setSummary(EMPTY_SUMMARY);
      setCalculationError(null);
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Create goals from owned characters
      const ownedGoals = createGoalsFromCharacters(
        selectedCharacters.map((c) => ({
          key: c.key,
          level: c.level,
          ascension: c.ascension,
          talent: c.talent,
        })),
        goalType
      );

      // Create goals from wishlist characters with their individual target goals
      const adjustedWishlistGoals = wishlistCharacters.map((wc) => {
        const goals = createGoalsFromCharacters(
          [{
            key: wc.key,
            level: 1,
            ascension: 0,
            talent: { auto: 1, skill: 1, burst: 1 },
          }],
          wc.targetGoal
        );
        return goals[0];
      }).filter((g): g is NonNullable<typeof g> => g !== undefined);

      // Combine all goals
      const allGoals = [...ownedGoals, ...adjustedWishlistGoals];

      const result = await calculateMultiCharacterSummary(allGoals, inventory);
      setSummary(result);

      // Set error if any character failed
      if (result.errors.length > 0) {
        setCalculationError(result.errors.join('; '));
      }
    } catch (err) {
      setCalculationError(
        err instanceof Error ? err.message : 'Failed to calculate summary'
      );
    } finally {
      setIsCalculating(false);
    }
  }, [selectedCharacters, goalType, inventory, wishlistCharacters]);

  // Auto-calculate when dependencies change
  // Note: we include selectedCharacterKeys directly to ensure the effect fires
  // when selection changes, even if React's reference comparison on the
  // memoized selectedCharacters array doesn't trigger properly
  useEffect(() => {
    void calculateSummary();
  }, [calculateSummary, selectedCharacterKeys, wishlistCharacters]);

  return {
    // Selection state
    selectedCharacterKeys,
    selectCharacter,
    deselectCharacter,
    toggleCharacter,
    selectAll,
    deselectAll,
    isSelected,

    // Goal type
    goalType,
    setGoalType,

    // Calculated summary
    summary,
    isCalculating,
    calculationError,

    // Helpers
    selectedCharacters,
    selectedCount,
    hasSelection,

    // Refresh
    refresh: calculateSummary,
  };
}
