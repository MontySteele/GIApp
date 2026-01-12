import { useState, useEffect, useMemo } from 'react';
import type { InventoryArtifact } from '@/types';
import { artifactRepo } from '../repo/artifactRepo';
import { scoreInventoryArtifact, type ArtifactScore } from '../domain/artifactScoring';

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

  // Score and filter artifacts
  const scoredArtifacts = useMemo(() => {
    return artifacts.map((artifact) => ({
      ...artifact,
      score: scoreInventoryArtifact(artifact),
    }));
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

    // Grade distribution
    const grades = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    scoredArtifacts.forEach((a) => {
      grades[a.score.grade]++;
    });

    return {
      total,
      trash,
      equipped,
      unequipped: total - equipped,
      fiveStar,
      grades,
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
