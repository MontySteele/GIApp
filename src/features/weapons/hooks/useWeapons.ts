/**
 * Weapons Hook
 *
 * Provides weapon inventory data with filtering and sorting
 */

import { useState, useEffect, useMemo } from 'react';
import type { InventoryWeapon } from '@/types';
import { weaponRepo } from '../repo/weaponRepo';
import { getWeaponName, getWeaponType, getWeaponRarity, type WeaponType } from '../domain/weaponConstants';

export type WeaponSortKey = 'rarity' | 'level' | 'refinement' | 'name' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface WeaponFilters {
  type: WeaponType | 'all';
  rarity: number | 'all';
  equipped: 'all' | 'equipped' | 'unequipped';
  search: string;
}

export interface EnrichedWeapon extends InventoryWeapon {
  displayName: string;
  weaponType: WeaponType | undefined;
  displayRarity: number;
}

export function useWeapons() {
  const [weapons, setWeapons] = useState<InventoryWeapon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load weapons
  useEffect(() => {
    const loadWeapons = async () => {
      try {
        setIsLoading(true);
        const data = await weaponRepo.getAll();
        setWeapons(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load weapons'));
      } finally {
        setIsLoading(false);
      }
    };

    loadWeapons();
  }, []);

  // Enrich weapons with display data
  const enrichedWeapons = useMemo<EnrichedWeapon[]>(() => {
    return weapons.map((weapon) => ({
      ...weapon,
      displayName: getWeaponName(weapon.key),
      weaponType: getWeaponType(weapon.key),
      displayRarity: getWeaponRarity(weapon.key),
    }));
  }, [weapons]);

  // Stats
  const stats = useMemo(() => {
    const total = weapons.length;
    const equipped = weapons.filter((w) => w.location).length;
    const unequipped = total - equipped;
    const fiveStars = enrichedWeapons.filter((w) => w.displayRarity === 5).length;
    const fourStars = enrichedWeapons.filter((w) => w.displayRarity === 4).length;
    const threeStars = enrichedWeapons.filter((w) => w.displayRarity === 3).length;
    const maxRefinement = weapons.filter((w) => w.refinement === 5).length;

    const byType: Record<WeaponType, number> = {
      sword: 0,
      claymore: 0,
      polearm: 0,
      bow: 0,
      catalyst: 0,
    };

    enrichedWeapons.forEach((w) => {
      if (w.weaponType) {
        byType[w.weaponType]++;
      }
    });

    return {
      total,
      equipped,
      unequipped,
      fiveStars,
      fourStars,
      threeStars,
      maxRefinement,
      byType,
    };
  }, [weapons, enrichedWeapons]);

  // Refresh function
  const refresh = async () => {
    try {
      const data = await weaponRepo.getAll();
      setWeapons(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh weapons'));
    }
  };

  return {
    weapons: enrichedWeapons,
    rawWeapons: weapons,
    isLoading,
    error,
    stats,
    hasWeapons: weapons.length > 0,
    refresh,
  };
}

/**
 * Filter and sort weapons
 */
export function filterAndSortWeapons(
  weapons: EnrichedWeapon[],
  filters: WeaponFilters,
  sortKey: WeaponSortKey,
  sortDirection: SortDirection
): EnrichedWeapon[] {
  // Apply filters
  let filtered = weapons;

  // Type filter
  if (filters.type !== 'all') {
    filtered = filtered.filter((w) => w.weaponType === filters.type);
  }

  // Rarity filter
  if (filters.rarity !== 'all') {
    filtered = filtered.filter((w) => w.displayRarity === filters.rarity);
  }

  // Equipped filter
  if (filters.equipped === 'equipped') {
    filtered = filtered.filter((w) => w.location);
  } else if (filters.equipped === 'unequipped') {
    filtered = filtered.filter((w) => !w.location);
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (w) =>
        w.displayName.toLowerCase().includes(searchLower) ||
        w.key.toLowerCase().includes(searchLower) ||
        w.location.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'rarity':
        comparison = b.displayRarity - a.displayRarity;
        break;
      case 'level':
        comparison = b.level - a.level;
        break;
      case 'refinement':
        comparison = b.refinement - a.refinement;
        break;
      case 'name':
        comparison = a.displayName.localeCompare(b.displayName);
        break;
      case 'type':
        comparison = (a.weaponType || '').localeCompare(b.weaponType || '');
        break;
    }

    return sortDirection === 'desc' ? comparison : -comparison;
  });

  return sorted;
}
