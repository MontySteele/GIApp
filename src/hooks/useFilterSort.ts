/**
 * useFilterSort Hook
 *
 * Provides reusable state management for filtering and sorting data.
 * Consolidates the duplicate filter/sort state patterns found across features.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  filterAndSort,
  type SortDirection,
  type SortConfig,
  type FilterConfig,
} from '@/lib/utils/filterSort';

// ============================================
// Types
// ============================================

export interface UseFilterSortOptions<T, F extends Record<string, unknown>> {
  /** Initial filter values */
  initialFilters?: Partial<F>;
  /** Initial sort configuration */
  initialSort?: SortConfig<T>;
  /** Fields to search across when using search query */
  searchFields?: (keyof T)[];
  /** Convert filter state object to FilterConfig array */
  filterMapper?: (filters: F) => FilterConfig<T>[];
}

export interface UseFilterSortResult<T, F extends Record<string, unknown>> {
  /** Current filter values */
  filters: F;
  /** Update a single filter value */
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  /** Update multiple filter values at once */
  setFilters: (updates: Partial<F>) => void;
  /** Reset all filters to initial values */
  resetFilters: () => void;

  /** Current search query */
  searchQuery: string;
  /** Update search query */
  setSearchQuery: (query: string) => void;

  /** Current sort field */
  sortField: keyof T | string;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Update sort configuration */
  setSort: (field: keyof T | string, direction?: SortDirection) => void;
  /** Toggle sort direction for current field, or set new field */
  toggleSort: (field: keyof T | string) => void;

  /** Whether filter panel is visible */
  showFilters: boolean;
  /** Toggle filter panel visibility */
  toggleFilters: () => void;
  /** Set filter panel visibility */
  setShowFilters: (show: boolean) => void;

  /** Apply filters and sort to data */
  applyTo: (items: T[]) => T[];

  /** Whether any filters are active */
  hasActiveFilters: boolean;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Default filter mapper - converts filter object to FilterConfig array
 * Assumes each key in the filter object maps to a field with 'equals' operator
 */
function defaultFilterMapper<T, F extends Record<string, unknown>>(
  filters: F
): FilterConfig<T>[] {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([field, value]) => ({
      field: field as keyof T | string,
      value,
      operator: 'equals' as const,
    }));
}

export function useFilterSort<T, F extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFilterSortOptions<T, F> = {}
): UseFilterSortResult<T, F> {
  const {
    initialFilters = {} as F,
    initialSort = { field: 'name' as keyof T, direction: 'asc' },
    searchFields = [],
    filterMapper = defaultFilterMapper,
  } = options;

  // Filter state
  const [filters, setFiltersState] = useState<F>(initialFilters as F);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<keyof T | string>(initialSort.field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSort.direction);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Filter setters
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((updates: Partial<F>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters as F);
    setSearchQuery('');
  }, [initialFilters]);

  // Sort setters
  const setSort = useCallback((field: keyof T | string, direction?: SortDirection) => {
    setSortField(field);
    if (direction) {
      setSortDirection(direction);
    }
  }, []);

  const toggleSort = useCallback((field: keyof T | string) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new field with default ascending
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // UI toggles
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim()) return true;
    return Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== ''
    );
  }, [filters, searchQuery]);

  // Apply filters and sort to data
  const applyTo = useCallback(
    (items: T[]): T[] => {
      const filterConfigs = filterMapper(filters);

      return filterAndSort(items, {
        filters: filterConfigs,
        searchQuery: searchQuery.trim() || undefined,
        searchFields: searchFields.length > 0 ? searchFields : undefined,
        sort: { field: sortField, direction: sortDirection },
      });
    },
    [filters, searchQuery, searchFields, sortField, sortDirection, filterMapper]
  );

  return {
    // Filters
    filters,
    setFilter,
    setFilters,
    resetFilters,

    // Search
    searchQuery,
    setSearchQuery,

    // Sort
    sortField,
    sortDirection,
    setSort,
    toggleSort,

    // UI
    showFilters,
    toggleFilters,
    setShowFilters,

    // Apply
    applyTo,
    hasActiveFilters,
  };
}

// ============================================
// Preset Hooks for Common Use Cases
// ============================================

/**
 * Character filter/sort hook with common defaults
 */
export interface CharacterFilters extends Record<string, unknown> {
  element?: string;
  weaponType?: string;
  rarity?: number;
  priority?: string;
}

export function useCharacterFilterSort<T extends { key: string; element?: string; weaponType?: string; rarity?: number; priority?: string }>() {
  return useFilterSort<T, CharacterFilters>({
    searchFields: ['key'] as (keyof T)[],
    initialSort: { field: 'key', direction: 'asc' },
  });
}

/**
 * Weapon filter/sort hook with common defaults
 */
export interface WeaponFilters extends Record<string, unknown> {
  type?: string;
  rarity?: number;
  equipped?: boolean;
}

export function useWeaponFilterSort<T extends { key: string; type?: string; rarity?: number }>() {
  return useFilterSort<T, WeaponFilters>({
    searchFields: ['key'] as (keyof T)[],
    initialSort: { field: 'rarity', direction: 'desc' },
  });
}

/**
 * Artifact filter/sort hook with common defaults
 */
export interface ArtifactFilters extends Record<string, unknown> {
  setKey?: string;
  slotKey?: string;
  rarity?: number;
  mainStatKey?: string;
  equipped?: boolean;
  locked?: boolean;
}

export function useArtifactFilterSort<T extends { setKey?: string; slotKey?: string; rarity?: number }>() {
  return useFilterSort<T, ArtifactFilters>({
    searchFields: ['setKey'] as (keyof T)[],
    initialSort: { field: 'rarity', direction: 'desc' },
  });
}

/**
 * Build template filter/sort hook with common defaults
 */
export interface BuildTemplateFilters extends Record<string, unknown> {
  characterKey?: string;
  role?: string;
  difficulty?: string;
  budget?: string;
  isOfficial?: boolean;
}

export function useBuildTemplateFilterSort<T extends { name: string; characterKey?: string; role?: string }>() {
  return useFilterSort<T, BuildTemplateFilters>({
    searchFields: ['name', 'characterKey'] as (keyof T)[],
    initialSort: { field: 'name', direction: 'asc' },
  });
}
