import { useState, useEffect, useMemo } from 'react';
import type { InventoryArtifact } from '@/types';
import { artifactRepo } from '../repo/artifactRepo';
import { scoreInventoryArtifact, type ArtifactScore } from '../domain/artifactScoring';
import {
  isValuableOffsetMainStat,
  getOffsetCategory,
  getAllOffsetCategories,
  OFFSET_PRESERVE_MINIMUM,
} from '../domain/artifactQualityFilter';
import { normalizeStatKey } from '../domain/artifactConstants';

export interface ArtifactWithScore extends InventoryArtifact {
  score: ArtifactScore;
}

export interface ArtifactFilters {
  setKey?: string;
  slotKey?: string;
  rarity?: number;
  mainStatKey?: string;
  equipped?: boolean;
  locked?: boolean;
  trashOnly?: boolean;
  /** Show only artifacts that no build wants (build-aware filter) */
  noBuildDemand?: boolean;
}

export type ArtifactSortField = 'score' | 'critValue' | 'level' | 'rarity' | 'updatedAt';

export interface UseArtifactsOptions {
  filters?: ArtifactFilters;
  sort?: {
    field: ArtifactSortField;
    direction: 'asc' | 'desc';
  };
}

export function useArtifacts(options: UseArtifactsOptions = {}) {
  const [artifacts, setArtifacts] = useState<InventoryArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load artifacts
  useEffect(() => {
    async function loadArtifacts() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await artifactRepo.getAll();
        setArtifacts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artifacts');
      } finally {
        setIsLoading(false);
      }
    }
    loadArtifacts();
  }, []);

  // Score artifacts and apply offset preservation
  const scoredArtifacts = useMemo(() => {
    const scored = artifacts.map((artifact) => ({
      ...artifact,
      score: scoreInventoryArtifact(artifact),
    }));

    // Offset preservation pass: protect a minimum number of unequipped
    // valuable offset pieces (elemental DMG% goblets, crit circlets) from
    // being marked as strongbox trash, even if their set isn't in demand.
    applyOffsetPreservation(scored);

    return scored;
  }, [artifacts]);

  // Apply filters
  const filteredArtifacts = useMemo(() => {
    const { filters } = options;
    if (!filters) return scoredArtifacts;

    return scoredArtifacts.filter((artifact) => {
      if (filters.setKey && artifact.setKey !== filters.setKey) return false;
      if (filters.slotKey && artifact.slotKey !== filters.slotKey) return false;
      if (filters.rarity !== undefined && artifact.rarity !== filters.rarity) return false;
      if (filters.mainStatKey && artifact.mainStatKey !== filters.mainStatKey) return false;
      if (filters.equipped !== undefined) {
        const isEquipped = artifact.location !== '';
        if (filters.equipped !== isEquipped) return false;
      }
      if (filters.locked !== undefined && artifact.lock !== filters.locked) return false;
      if (filters.trashOnly && !artifact.score.isStrongboxTrash) return false;
      if (filters.noBuildDemand && !artifact.score.qualityFilter?.isUseless) return false;
      return true;
    });
  }, [scoredArtifacts, options.filters]);

  // Apply sorting
  const sortedArtifacts = useMemo(() => {
    const { sort } = options;
    if (!sort) return filteredArtifacts;

    const sorted = [...filteredArtifacts].sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'score':
          comparison = a.score.score - b.score.score;
          break;
        case 'critValue':
          comparison = a.score.critValue - b.score.critValue;
          break;
        case 'level':
          comparison = a.level - b.level;
          break;
        case 'rarity':
          comparison = a.rarity - b.rarity;
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredArtifacts, options.sort]);

  // Stats
  const stats = useMemo(() => {
    const total = scoredArtifacts.length;
    const trash = scoredArtifacts.filter((a) => a.score.isStrongboxTrash).length;
    const equipped = scoredArtifacts.filter((a) => a.location !== '').length;
    const fiveStar = scoredArtifacts.filter((a) => a.rarity === 5).length;
    const noBuildDemand = scoredArtifacts.filter((a) => a.score.qualityFilter?.isUseless).length;

    // Grade distribution
    const grades = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    scoredArtifacts.forEach((a) => {
      grades[a.score.grade]++;
    });

    // Offset piece inventory: count unequipped 5-star pieces per valuable main stat
    const offsetCounts = computeOffsetCounts(scoredArtifacts);

    return {
      total,
      trash,
      equipped,
      unequipped: total - equipped,
      fiveStar,
      noBuildDemand,
      grades,
      offsetCounts,
    };
  }, [scoredArtifacts]);

  return {
    artifacts: sortedArtifacts,
    allArtifacts: scoredArtifacts,
    isLoading,
    error,
    stats,
  };
}

export interface OffsetCount {
  label: string;
  slotKey: string;
  mainStatKey: string;
  unequipped: number;
  total: number;
  belowMinimum: boolean;
}

/**
 * Count unequipped 5-star pieces per valuable offset main stat category.
 */
function computeOffsetCounts(artifacts: ArtifactWithScore[]): OffsetCount[] {
  const categories = getAllOffsetCategories();
  return categories.map(({ slotKey, mainStatKey, label }) => {
    const matching = artifacts.filter((a) =>
      a.rarity === 5 &&
      a.slotKey === slotKey &&
      isValuableOffsetMainStat(a.slotKey, a.mainStatKey) &&
      normalizeMainStatForDemand(a.mainStatKey) === mainStatKey
    );
    const unequipped = matching.filter((a) => a.location === '').length;
    return {
      label,
      slotKey,
      mainStatKey,
      unequipped,
      total: matching.length,
      belowMinimum: unequipped < OFFSET_PRESERVE_MINIMUM,
    };
  });
}

/**
 * Normalize main stat key for comparison with offset categories.
 * Re-implements the same logic from artifactQualityFilter to avoid circular deps.
 */
function normalizeMainStatForDemand(mainStatKey: string): string {
  const normalized = normalizeStatKey(mainStatKey);
  if (normalized.includes('physical') || mainStatKey.includes('physical')) return 'physical_dmg_';
  if (normalized.includes('pyro') || mainStatKey.includes('pyro')) return 'pyro_dmg_';
  if (normalized.includes('hydro') || mainStatKey.includes('hydro')) return 'hydro_dmg_';
  if (normalized.includes('cryo') || mainStatKey.includes('cryo')) return 'cryo_dmg_';
  if (normalized.includes('electro') || mainStatKey.includes('electro')) return 'electro_dmg_';
  if (normalized.includes('anemo') || mainStatKey.includes('anemo')) return 'anemo_dmg_';
  if (normalized.includes('geo') || mainStatKey.includes('geo')) return 'geo_dmg_';
  if (normalized.includes('dendro') || mainStatKey.includes('dendro')) return 'dendro_dmg_';
  const mapping: Record<string, string> = {
    'hp_': 'hp_', 'atk_': 'atk_', 'def_': 'def_',
    'eleMas': 'eleMas', 'enerRech_': 'enerRech_',
    'critRate_': 'critRate_', 'critDMG_': 'critDMG_', 'heal_': 'heal_',
  };
  return mapping[normalized] || normalized;
}

/**
 * Offset preservation: After individual scoring, un-mark artifacts as strongbox
 * trash if doing so would leave fewer than OFFSET_PRESERVE_MINIMUM unequipped
 * 5-star pieces with a valuable offset main stat.
 *
 * This ensures the player always keeps a handful of elemental DMG% goblets
 * and crit circlets around as flex/offset pieces.
 */
function applyOffsetPreservation(artifacts: ArtifactWithScore[]): void {
  const categories = getAllOffsetCategories();

  for (const { slotKey, mainStatKey } of categories) {
    // Find all unequipped 5-star pieces in this offset category
    const unequippedInCategory = artifacts.filter((a) =>
      a.rarity === 5 &&
      a.location === '' &&
      a.slotKey === slotKey &&
      normalizeMainStatForDemand(a.mainStatKey) === mainStatKey
    );

    // Count how many are NOT marked as trash
    const keptCount = unequippedInCategory.filter((a) => !a.score.isStrongboxTrash).length;

    if (keptCount >= OFFSET_PRESERVE_MINIMUM) continue;

    // Need to protect some pieces. Pick the best trash-marked ones by score.
    const trashPieces = unequippedInCategory
      .filter((a) => a.score.isStrongboxTrash)
      .sort((a, b) => b.score.score - a.score.score);

    const toProtect = OFFSET_PRESERVE_MINIMUM - keptCount;
    for (let i = 0; i < Math.min(toProtect, trashPieces.length); i++) {
      const piece = trashPieces[i];
      if (!piece) continue;
      piece.score = {
        ...piece.score,
        isStrongboxTrash: false,
        trashReason: undefined,
        qualityFilter: piece.score.qualityFilter ? {
          ...piece.score.qualityFilter,
          isUseless: false,
          reason: `Preserved as offset piece (${getOffsetCategory(slotKey, mainStatKey)})`,
        } : undefined,
      };
    }
  }
}
