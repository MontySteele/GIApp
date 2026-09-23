import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { characterRepo } from '@/features/roster/repo/characterRepo';
import type { Character } from '@/types';
import {
  getAllSeasons,
  getCurrentSeason,
  type TheaterSeason,
} from '../data/theaterSeasons';
import { computeSeasonReadiness, type SeasonReadiness } from '../domain/readiness';

export interface UseTheaterReadinessResult {
  /** Newest first, for the season selector */
  seasons: TheaterSeason[];
  season: TheaterSeason | undefined;
  readiness: SeasonReadiness | undefined;
  characters: Character[];
  isLoading: boolean;
}

/**
 * Joins the owned roster with the selected Imaginarium Theatre season.
 * Falls back to the current season, then the newest known season.
 */
export function useTheaterReadiness(seasonId?: string): UseTheaterReadinessResult {
  const characters = useLiveQuery(() => characterRepo.getAll(), []);

  const seasons = useMemo(
    () => getAllSeasons().sort((a, b) => b.id.localeCompare(a.id)),
    []
  );

  const season = useMemo(() => {
    if (seasonId) {
      const match = seasons.find((entry) => entry.id === seasonId);
      if (match) return match;
    }
    return getCurrentSeason(new Date()) ?? seasons[0];
  }, [seasonId, seasons]);

  const readiness = useMemo(
    () => (season ? computeSeasonReadiness(season, characters ?? []) : undefined),
    [season, characters]
  );

  return {
    seasons,
    season,
    readiness,
    characters: characters ?? [],
    isLoading: characters === undefined,
  };
}
