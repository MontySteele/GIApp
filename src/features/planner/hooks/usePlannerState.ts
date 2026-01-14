/**
 * usePlannerState Hook
 *
 * Manages planner state persistence across navigation.
 * Stores state in localStorage to maintain user selections.
 */

import { useState, useCallback, useEffect } from 'react';
import type { GoalType } from './useMultiCharacterPlan';

type PlannerMode = 'single' | 'multi';
type MultiTab = 'characters' | 'weapons';

interface PlannerPersistedState {
  mode: PlannerMode;
  singleGoalType: GoalType;
  singleCharacterId: string;
  multiTab: MultiTab;
  multiGoalType: GoalType;
  multiSelectedKeys: string[];
  weaponGoalType: GoalType;
  weaponSelectedIds: string[];
}

interface UsePlannerStateOptions {
  /** Initial mode from URL params (e.g., team link) */
  initialModeFromUrl?: PlannerMode;
  /** Initial character keys from URL params */
  initialCharacterKeysFromUrl?: string[];
  /** Initial character ID from URL params (single mode) */
  initialCharacterIdFromUrl?: string;
}

interface UsePlannerStateResult {
  // Mode
  plannerMode: PlannerMode;
  setPlannerMode: (mode: PlannerMode) => void;

  // Single mode state
  selectedCharacterId: string;
  setSelectedCharacterId: (id: string) => void;
  singleGoalType: GoalType;
  setSingleGoalType: (type: GoalType) => void;

  // Multi mode state
  multiTab: MultiTab;
  setMultiTab: (tab: MultiTab) => void;
  multiGoalType: GoalType;
  setMultiGoalType: (type: GoalType) => void;
  multiSelectedKeys: string[];
  setMultiSelectedKeys: (keys: string[]) => void;

  // Weapon state
  weaponGoalType: GoalType;
  setWeaponGoalType: (type: GoalType) => void;
  weaponSelectedIds: string[];
  setWeaponSelectedIds: (ids: string[]) => void;
}

const STORAGE_KEY = 'plannerState';

const DEFAULT_STATE: PlannerPersistedState = {
  mode: 'single',
  singleGoalType: 'next',
  singleCharacterId: '',
  multiTab: 'characters',
  multiGoalType: 'full',
  multiSelectedKeys: [],
  weaponGoalType: 'full',
  weaponSelectedIds: [],
};

function loadPersistedState(): PlannerPersistedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle missing fields from older versions
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_STATE;
}

function savePersistedState(state: PlannerPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function usePlannerState(options: UsePlannerStateOptions = {}): UsePlannerStateResult {
  const {
    initialModeFromUrl,
    initialCharacterKeysFromUrl = [],
    initialCharacterIdFromUrl,
  } = options;

  // Load persisted state once on mount
  const [persistedState] = useState<PlannerPersistedState>(() => {
    const loaded = loadPersistedState();

    // URL params override persisted state
    if (initialModeFromUrl) {
      loaded.mode = initialModeFromUrl;
    }
    if (initialCharacterKeysFromUrl.length > 0) {
      loaded.multiSelectedKeys = initialCharacterKeysFromUrl;
      loaded.mode = 'multi';
    }
    if (initialCharacterIdFromUrl) {
      loaded.singleCharacterId = initialCharacterIdFromUrl;
      loaded.mode = 'single';
    }

    return loaded;
  });

  // Mode state
  const [plannerMode, setPlannerModeInternal] = useState<PlannerMode>(persistedState.mode);

  // Single mode state
  const [selectedCharacterId, setSelectedCharacterIdInternal] = useState<string>(
    persistedState.singleCharacterId
  );
  const [singleGoalType, setSingleGoalTypeInternal] = useState<GoalType>(
    persistedState.singleGoalType
  );

  // Multi mode state
  const [multiTab, setMultiTabInternal] = useState<MultiTab>(persistedState.multiTab);
  const [multiGoalType, setMultiGoalTypeInternal] = useState<GoalType>(
    persistedState.multiGoalType
  );
  const [multiSelectedKeys, setMultiSelectedKeysInternal] = useState<string[]>(
    persistedState.multiSelectedKeys
  );

  // Weapon state
  const [weaponGoalType, setWeaponGoalTypeInternal] = useState<GoalType>(
    persistedState.weaponGoalType
  );
  const [weaponSelectedIds, setWeaponSelectedIdsInternal] = useState<string[]>(
    persistedState.weaponSelectedIds
  );

  // Persist state changes
  useEffect(() => {
    savePersistedState({
      mode: plannerMode,
      singleGoalType,
      singleCharacterId: selectedCharacterId,
      multiTab,
      multiGoalType,
      multiSelectedKeys,
      weaponGoalType,
      weaponSelectedIds,
    });
  }, [
    plannerMode,
    singleGoalType,
    selectedCharacterId,
    multiTab,
    multiGoalType,
    multiSelectedKeys,
    weaponGoalType,
    weaponSelectedIds,
  ]);

  // Wrapped setters
  const setPlannerMode = useCallback((mode: PlannerMode) => {
    setPlannerModeInternal(mode);
  }, []);

  const setSelectedCharacterId = useCallback((id: string) => {
    setSelectedCharacterIdInternal(id);
  }, []);

  const setSingleGoalType = useCallback((type: GoalType) => {
    setSingleGoalTypeInternal(type);
  }, []);

  const setMultiTab = useCallback((tab: MultiTab) => {
    setMultiTabInternal(tab);
  }, []);

  const setMultiGoalType = useCallback((type: GoalType) => {
    setMultiGoalTypeInternal(type);
  }, []);

  const setMultiSelectedKeys = useCallback((keys: string[]) => {
    setMultiSelectedKeysInternal(keys);
  }, []);

  const setWeaponGoalType = useCallback((type: GoalType) => {
    setWeaponGoalTypeInternal(type);
  }, []);

  const setWeaponSelectedIds = useCallback((ids: string[]) => {
    setWeaponSelectedIdsInternal(ids);
  }, []);

  return {
    plannerMode,
    setPlannerMode,
    selectedCharacterId,
    setSelectedCharacterId,
    singleGoalType,
    setSingleGoalType,
    multiTab,
    setMultiTab,
    multiGoalType,
    setMultiGoalType,
    multiSelectedKeys,
    setMultiSelectedKeys,
    weaponGoalType,
    setWeaponGoalType,
    weaponSelectedIds,
    setWeaponSelectedIds,
  };
}
