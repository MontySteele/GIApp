/**
 * Shared Filter/Sort Utilities
 *
 * Consolidates duplicate filter and sort logic used across multiple features.
 * Provides type-safe, reusable functions for common data operations.
 */

// ============================================
// Types
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T | string;
  direction: SortDirection;
}

export interface FilterConfig<T> {
  field: keyof T | string;
  value: unknown;
  operator?: 'equals' | 'includes' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

// ============================================
// Search Utilities
// ============================================

/**
 * Normalize text for search comparison
 * Converts to lowercase and trims whitespace
 */
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if an item matches a search query
 * Searches across multiple fields
 */
export function matchesSearch<T>(
  item: T,
  searchQuery: string,
  fields: (keyof T)[]
): boolean {
  if (!searchQuery.trim()) return true;

  const normalizedQuery = normalizeSearchText(searchQuery);

  return fields.some((field) => {
    const value = item[field];
    if (value === null || value === undefined) return false;
    return normalizeSearchText(String(value)).includes(normalizedQuery);
  });
}

// ============================================
// Filter Utilities
// ============================================

/**
 * Apply a single filter to check if an item matches
 */
export function matchesFilter<T>(
  item: T,
  filter: FilterConfig<T>
): boolean {
  const { field, value, operator = 'equals' } = filter;

  // Skip if filter value is empty/undefined
  if (value === undefined || value === null || value === '') return true;

  const itemValue = getNestedValue(item, field as string);

  switch (operator) {
    case 'equals':
      return itemValue === value;
    case 'includes':
      if (typeof itemValue === 'string') {
        return normalizeSearchText(itemValue).includes(normalizeSearchText(String(value)));
      }
      if (Array.isArray(itemValue)) {
        return itemValue.includes(value);
      }
      return false;
    case 'startsWith':
      return typeof itemValue === 'string' && itemValue.startsWith(String(value));
    case 'endsWith':
      return typeof itemValue === 'string' && itemValue.endsWith(String(value));
    case 'gt':
      return typeof itemValue === 'number' && itemValue > (value as number);
    case 'lt':
      return typeof itemValue === 'number' && itemValue < (value as number);
    case 'gte':
      return typeof itemValue === 'number' && itemValue >= (value as number);
    case 'lte':
      return typeof itemValue === 'number' && itemValue <= (value as number);
    default:
      return itemValue === value;
  }
}

/**
 * Apply multiple filters to an item
 * All filters must match (AND logic)
 */
export function matchesAllFilters<T>(
  item: T,
  filters: FilterConfig<T>[]
): boolean {
  return filters.every((filter) => matchesFilter(item, filter));
}

/**
 * Filter an array by multiple criteria
 */
export function filterItems<T>(
  items: T[],
  filters: FilterConfig<T>[],
  searchQuery?: string,
  searchFields?: (keyof T)[]
): T[] {
  return items.filter((item) => {
    // Check search query if provided
    if (searchQuery && searchFields) {
      if (!matchesSearch(item, searchQuery, searchFields)) {
        return false;
      }
    }

    // Check all filters
    return matchesAllFilters(item, filters);
  });
}

// ============================================
// Sort Utilities
// ============================================

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'a.b.c') returns obj.a.b.c
 */
export function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Compare two values for sorting
 * Handles strings, numbers, dates, and nullish values
 */
export function compareValues(a: unknown, b: unknown): number {
  // Handle nullish values - push to end
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  // String comparison (case-insensitive)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  }

  // Number comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // ISO date string comparison
  if (typeof a === 'string' && typeof b === 'string') {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);
    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateA - dateB;
    }
  }

  // Fallback to string comparison
  return String(a).localeCompare(String(b));
}

/**
 * Create a sort comparator function
 */
export function createSortComparator<T>(
  config: SortConfig<T>
): (a: T, b: T) => number {
  const { field, direction } = config;
  const multiplier = direction === 'desc' ? -1 : 1;

  return (a: T, b: T) => {
    const valueA = getNestedValue(a, field as string);
    const valueB = getNestedValue(b, field as string);
    return compareValues(valueA, valueB) * multiplier;
  };
}

/**
 * Sort an array by a field
 */
export function sortItems<T>(
  items: T[],
  config: SortConfig<T>
): T[] {
  const comparator = createSortComparator(config);
  return [...items].sort(comparator);
}

/**
 * Sort by multiple fields (primary, secondary, etc.)
 */
export function sortByMultiple<T>(
  items: T[],
  configs: SortConfig<T>[]
): T[] {
  if (configs.length === 0) return items;

  const comparators = configs.map(createSortComparator);

  return [...items].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}

// ============================================
// Combined Filter + Sort
// ============================================

/**
 * Filter and sort items in one operation
 */
export function filterAndSort<T>(
  items: T[],
  options: {
    filters?: FilterConfig<T>[];
    searchQuery?: string;
    searchFields?: (keyof T)[];
    sort?: SortConfig<T>;
  }
): T[] {
  const { filters = [], searchQuery, searchFields, sort } = options;

  let result = filterItems(items, filters, searchQuery, searchFields);

  if (sort) {
    result = sortItems(result, sort);
  }

  return result;
}

// ============================================
// Rarity/Priority Helpers (Genshin-specific)
// ============================================

/**
 * Sort by rarity (5-star first, then 4-star, etc.)
 */
export function sortByRarity<T extends { rarity?: number }>(
  items: T[],
  direction: SortDirection = 'desc'
): T[] {
  return sortItems(items, { field: 'rarity', direction });
}

/**
 * Priority order for character priority field
 */
export const PRIORITY_ORDER: Record<string, number> = {
  'main-dps': 1,
  'sub-dps': 2,
  'support': 3,
  'flex': 4,
  'unassigned': 5,
};

/**
 * Sort by priority (main-dps first, then sub-dps, etc.)
 */
export function sortByPriority<T extends { priority?: string }>(
  items: T[],
  direction: SortDirection = 'asc'
): T[] {
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const orderA = PRIORITY_ORDER[a.priority ?? 'unassigned'] ?? 99;
    const orderB = PRIORITY_ORDER[b.priority ?? 'unassigned'] ?? 99;
    return (orderA - orderB) * multiplier;
  });
}

// ============================================
// Element/Weapon Type Helpers
// ============================================

/**
 * Element order for consistent sorting
 */
export const ELEMENT_ORDER: Record<string, number> = {
  'Pyro': 1,
  'Hydro': 2,
  'Electro': 3,
  'Cryo': 4,
  'Anemo': 5,
  'Geo': 6,
  'Dendro': 7,
};

/**
 * Weapon type order for consistent sorting
 */
export const WEAPON_TYPE_ORDER: Record<string, number> = {
  'Sword': 1,
  'Claymore': 2,
  'Polearm': 3,
  'Bow': 4,
  'Catalyst': 5,
};
