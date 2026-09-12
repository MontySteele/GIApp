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

/**
 * How the displayed season relates to the current month:
 * - 'current'  — its month is in progress
 * - 'selected' — the user picked it from the season selector
 * - 'stale'    — no season is known for the current month; the newest known
 *                season is shown as a labelled fallback, not as current data
 * - 'none'     — no season data at all
 */
export type TheaterSeasonStatus = 'current' | 'selected' | 'stale' | 'none';

export interface UseTheaterReadinessResult {
  /** Newest first, for the season selector */
  seasons: TheaterSeason[];
  season: TheaterSeason | undefined;
  seasonStatus: TheaterSeasonStatus;
  /** 'YYYY-MM' of the current month (UTC) */
  currentMonthId: string;
  /** Season whose month is in progress, if any */
  currentSeason: TheaterSeason | undefined;
  readiness: SeasonReadiness | undefined;
  characters: Character[];
  isLoading: boolean;
}

export function toMonthId(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Joins the owned roster with the selected Imaginarium Theatre season.
 *
 * Resolution order: an explicitly selected season, then the season for the
 * current month. When neither exists the newest known season is still
 * returned so the UI can show it, but `seasonStatus` is 'stale' so callers
 * must label it rather than present it as the current line-up.
 */
export function useTheaterReadiness(seasonId?: string): UseTheaterReadinessResult {
  const characters = useLiveQuery(() => characterRepo.getAll(), []);

  const seasons = useMemo(
    () => getAllSeasons().sort((a, b) => b.id.localeCompare(a.id)),
    []
  );

  const { season, seasonStatus, currentMonthId, currentSeason } = useMemo(() => {
    const now = new Date();
    const month = toMonthId(now);
    const current = getCurrentSeason(now);
    const selected = seasonId ? seasons.find((entry) => entry.id === seasonId) : undefined;

    if (selected) {
      return {
        season: selected,
        seasonStatus: 'selected' as const,
        currentMonthId: month,
        currentSeason: current,
      };
    }
    if (current) {
      return {
        season: current,
        seasonStatus: 'current' as const,
        currentMonthId: month,
        currentSeason: current,
      };
    }
    const fallback = seasons[0];
    return {
      season: fallback,
      seasonStatus: fallback ? ('stale' as const) : ('none' as const),
      currentMonthId: month,
      currentSeason: undefined,
    };
  }, [seasonId, seasons]);

  const readiness = useMemo(
    () => (season ? computeSeasonReadiness(season, characters ?? []) : undefined),
    [season, characters]
  );

  return {
    seasons,
    season,
    seasonStatus,
    currentMonthId,
    currentSeason,
    readiness,
    characters: characters ?? [],
    isLoading: characters === undefined,
  };
}
