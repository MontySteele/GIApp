/**
 * useTodayFarming Hook
 *
 * Fetches characters and their talent book needs for today's farming recommendations
 */

import { useState, useEffect, useMemo } from 'react';
import { useCharacters } from '@/features/roster/hooks/useCharacters';
import { useTeams } from '@/features/roster/hooks/useTeams';
import { getCharacterMaterials } from '@/lib/services/genshinDbService';
import { getTodayName, type DayName } from '@/features/planner/domain/farmingSchedule';
import { DOMAIN_SCHEDULE, TALENT_BOOK_REGIONS } from '@/features/planner/domain/materialConstants';

/** Scope for which characters to show farming recommendations for */
export type FarmingScope = 'team' | 'priority' | 'all';

export interface CharacterBookNeed {
  characterKey: string;
  characterLevel: number;
  bookSeries: string;
  region: string;
  availableToday: boolean;
}

export interface TodayFarmingData {
  today: DayName;
  isLoading: boolean;
  // Characters grouped by book series they need
  charactersByBook: Map<string, CharacterBookNeed[]>;
  // Only books available today with characters needing them
  availableTodayWithCharacters: Array<{
    series: string;
    region: string;
    characters: CharacterBookNeed[];
  }>;
  // Books not available today but characters need them
  notAvailableToday: Array<{
    series: string;
    region: string;
    characters: CharacterBookNeed[];
    nextAvailableDay: DayName;
  }>;
  // Total characters with book needs identified
  totalCharactersProcessed: number;
}

/**
 * Find which region a book series belongs to
 */
function getRegionForSeries(series: string): string {
  for (const [region, seriesList] of Object.entries(TALENT_BOOK_REGIONS)) {
    if (seriesList.includes(series)) {
      return region;
    }
  }
  return 'Unknown';
}

/**
 * Check if a book series is available today
 */
function isAvailableToday(series: string, today: DayName): boolean {
  const days = DOMAIN_SCHEDULE[series];
  return days?.includes(today) ?? false;
}

/**
 * Get the next available day for a book series
 */
function getNextAvailableDay(series: string, today: DayName): DayName {
  const days = DOMAIN_SCHEDULE[series];
  if (!days || days.length === 0) return 'Sunday';

  const dayOrder: DayName[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayIndex = dayOrder.indexOf(today);

  // Find the next day after today that the series is available
  for (let i = 1; i <= 7; i++) {
    const checkDay = dayOrder[(todayIndex + i) % 7] as DayName;
    if (days.includes(checkDay)) {
      return checkDay;
    }
  }

  return 'Sunday';
}

export interface UseTodayFarmingOptions {
  scope?: FarmingScope;
}

export function useTodayFarming(options: UseTodayFarmingOptions = {}): TodayFarmingData {
  const { scope = 'team' } = options;
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { teams, isLoading: teamsLoading } = useTeams();
  const [characterBookNeeds, setCharacterBookNeeds] = useState<CharacterBookNeed[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  const today = useMemo(() => getTodayName(), []);

  // Filter characters based on scope
  const filteredCharacters = useMemo(() => {
    switch (scope) {
      case 'all':
        return characters;
      case 'priority':
        // Main and secondary priority characters
        return characters.filter((c) => c.priority === 'main' || c.priority === 'secondary');
      case 'team':
      default:
        // Characters in at least one team
        if (teams.length === 0) return [];
        const teamCharacterKeys = new Set<string>();
        for (const team of teams) {
          for (const key of team.characterKeys) {
            teamCharacterKeys.add(key);
          }
        }
        return characters.filter((c) => teamCharacterKeys.has(c.key));
    }
  }, [characters, teams, scope]);

  // Fetch material data for filtered characters
  useEffect(() => {
    if (charactersLoading || teamsLoading || filteredCharacters.length === 0) {
      setCharacterBookNeeds([]);
      return;
    }

    let cancelled = false;
    setIsLoadingMaterials(true);

    async function fetchMaterialData() {
      const needs: CharacterBookNeed[] = [];

      // Fetch in parallel with a concurrency limit
      const batchSize = 5;
      for (let i = 0; i < filteredCharacters.length; i += batchSize) {
        const batch = filteredCharacters.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (char) => {
            const { data } = await getCharacterMaterials(char.key, {
              useStaleOnError: true,
            });

            if (data?.talentMaterials?.books?.series) {
              const series = data.talentMaterials.books.series;
              return {
                characterKey: char.key,
                characterLevel: char.level,
                bookSeries: series,
                region: data.talentMaterials.books.region || getRegionForSeries(series),
                availableToday: isAvailableToday(series, today),
              };
            }
            return null;
          })
        );

        if (cancelled) return;

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            needs.push(result.value);
          }
        }
      }

      if (!cancelled) {
        setCharacterBookNeeds(needs);
        setIsLoadingMaterials(false);
      }
    }

    void fetchMaterialData();

    return () => {
      cancelled = true;
    };
  }, [filteredCharacters, charactersLoading, teamsLoading, today]);

  // Group characters by book series
  const charactersByBook = useMemo(() => {
    const map = new Map<string, CharacterBookNeed[]>();
    for (const need of characterBookNeeds) {
      const existing = map.get(need.bookSeries);
      if (existing) {
        existing.push(need);
      } else {
        map.set(need.bookSeries, [need]);
      }
    }
    return map;
  }, [characterBookNeeds]);

  // Compute available today with characters
  const availableTodayWithCharacters = useMemo(() => {
    const result: Array<{
      series: string;
      region: string;
      characters: CharacterBookNeed[];
    }> = [];

    for (const [series, chars] of charactersByBook.entries()) {
      if (isAvailableToday(series, today)) {
        result.push({
          series,
          region: chars[0]?.region ?? getRegionForSeries(series),
          characters: chars,
        });
      }
    }

    // Sort by number of characters (most needed first)
    return result.sort((a, b) => b.characters.length - a.characters.length);
  }, [charactersByBook, today]);

  // Compute not available today
  const notAvailableToday = useMemo(() => {
    const result: Array<{
      series: string;
      region: string;
      characters: CharacterBookNeed[];
      nextAvailableDay: DayName;
    }> = [];

    for (const [series, chars] of charactersByBook.entries()) {
      if (!isAvailableToday(series, today)) {
        result.push({
          series,
          region: chars[0]?.region ?? getRegionForSeries(series),
          characters: chars,
          nextAvailableDay: getNextAvailableDay(series, today),
        });
      }
    }

    return result.sort((a, b) => b.characters.length - a.characters.length);
  }, [charactersByBook, today]);

  return {
    today,
    isLoading: charactersLoading || teamsLoading || isLoadingMaterials,
    charactersByBook,
    availableTodayWithCharacters,
    notAvailableToday,
    totalCharactersProcessed: characterBookNeeds.length,
  };
}
