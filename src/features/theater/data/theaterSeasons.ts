/**
 * Imaginarium Theatre season data.
 *
 * Each season runs for one calendar month and features 3 of the 7 elements,
 * 6 Opening Characters (free Lv. 90 trials are always offered) and 4 Special
 * Guests (only count when you actually own them).
 *
 * Hand-seeded entries are the authority for their month. Beta seasons parsed
 * from a community mirror can be merged in via `getAllSeasons`.
 */

export type TheaterElement =
  | 'Pyro'
  | 'Hydro'
  | 'Anemo'
  | 'Electro'
  | 'Dendro'
  | 'Cryo'
  | 'Geo';

export interface TheaterSeason {
  /** 'YYYY-MM' */
  id: string;
  /** ISO date, 1st of the season's month */
  startDate: string;
  elements: [TheaterElement, TheaterElement, TheaterElement];
  /** 6 character keys */
  openingCharacters: string[];
  /** 4 character keys */
  specialGuests: string[];
  /** 'beta' entries are leaked/tentative and may still change */
  source: 'official' | 'beta';
  advantageNotes?: string;
}

export const THEATER_SEASONS: TheaterSeason[] = [
  {
    id: '2026-08',
    startDate: '2026-08-01',
    elements: ['Hydro', 'Electro', 'Cryo'],
    openingCharacters: ['Yelan', 'Aino', 'Flins', 'Ororon', 'Skirk', 'Layla'],
    specialGuests: ['Arlecchino', 'Chevreuse', 'KaedeharaKazuha', 'Tighnari'],
    source: 'official',
    advantageNotes: 'Lunar-Charged reactions have an advantage',
  },
];

export function getSeasonById(id: string): TheaterSeason | undefined {
  return THEATER_SEASONS.find((season) => season.id === id);
}

/**
 * Parses a 'YYYY-MM' season id into the UTC millisecond bounds of its month.
 * Returns null when the id is not a well-formed month.
 */
function monthBounds(id: string): { start: number; end: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(id);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return {
    start: Date.UTC(year, month - 1, 1),
    end: Date.UTC(year, month, 1),
  };
}

function startTimestamp(season: TheaterSeason): number {
  const parsed = Date.parse(season.startDate);
  if (!Number.isNaN(parsed)) return parsed;
  return monthBounds(season.id)?.start ?? Number.NaN;
}

/**
 * The season that has started and whose month has not yet elapsed.
 * Seasons are not assumed to be contiguous, so a gap month has no current
 * season rather than falling back to the previous entry.
 */
export function getCurrentSeason(now: Date): TheaterSeason | undefined {
  const time = now.getTime();
  let current: TheaterSeason | undefined;
  let currentStart = Number.NEGATIVE_INFINITY;

  for (const season of THEATER_SEASONS) {
    const bounds = monthBounds(season.id);
    if (!bounds) continue;

    const start = startTimestamp(season);
    if (Number.isNaN(start)) continue;
    if (time < start || time >= bounds.end) continue;

    if (start >= currentStart) {
      current = season;
      currentStart = start;
    }
  }

  return current;
}

/**
 * Merges hand-seeded seasons with parsed (usually beta) seasons.
 * De-duplicates by month id preferring 'official' data, then the hand-seeded
 * entry when both sources agree on status.
 */
export function getAllSeasons(parsedSeasons: TheaterSeason[] = []): TheaterSeason[] {
  const byId = new Map<string, TheaterSeason>();
  const rank = (season: TheaterSeason) => (season.source === 'official' ? 1 : 0);

  for (const season of parsedSeasons) {
    const existing = byId.get(season.id);
    if (!existing || rank(season) > rank(existing)) {
      byId.set(season.id, season);
    }
  }

  // Hand-seeded entries win ties, so they stay the authority for their months.
  for (const season of THEATER_SEASONS) {
    const existing = byId.get(season.id);
    if (!existing || rank(season) >= rank(existing)) {
      byId.set(season.id, season);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
}
