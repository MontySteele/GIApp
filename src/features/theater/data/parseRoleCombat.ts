/**
 * Beta-season parser for Imaginarium Theatre ("role combat") data.
 *
 * The upstream community mirror serves one JSON object keyed by numeric season
 * id. This module is pure: it parses a string that somebody else fetched, and
 * never throws — bad input yields an empty result.
 */

import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import { getAvatarIdFromKey } from '@/lib/characterData';
import { getCharacterMetadata } from '@/features/roster/data/characterMetadata';
import type { TheaterElement, TheaterSeason } from './theaterSeasons';

const ELEMENT_CODES: Record<number, TheaterElement> = {
  2: 'Pyro',
  3: 'Hydro',
  4: 'Dendro',
  5: 'Electro',
  6: 'Cryo',
  7: 'Anemo',
  8: 'Geo',
};

/** Season 28 ran in 2026-08, so season N is 2024-04 plus N months. */
const SEASON_EPOCH_YEAR = 2024;
const SEASON_EPOCH_MONTH = 4;

export interface ParsedSeasonResult {
  /** Sorted by id ascending */
  seasons: TheaterSeason[];
  /** Avatar ids with no key mapping, deduped */
  unknownAvatarIds: number[];
}

export interface ParseRoleCombatOptions {
  /** Entries older than this season id are skipped. Defaults to 28. */
  minSeasonId?: number;
}

/**
 * Inverts the repo's key -> avatarId map by walking ALL_CHARACTERS, which both
 * resolves alias collisions (kazuha / kaedeharakazuha) and guarantees the
 * output uses canonical ALL_CHARACTERS casing.
 */
const AVATAR_ID_TO_KEY: Map<number, string> = (() => {
  const map = new Map<number, string>();

  for (const character of ALL_CHARACTERS) {
    const avatarId = getAvatarIdFromKey(character.key);
    if (avatarId === undefined) continue;
    if (!getCharacterMetadata(character.key)) continue;
    if (map.has(avatarId)) continue;
    map.set(avatarId, character.key);
  }

  return map;
})();

export function getKeyForAvatarId(avatarId: number): string | undefined {
  return AVATAR_ID_TO_KEY.get(avatarId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseElements(raw: unknown): [TheaterElement, TheaterElement, TheaterElement] | null {
  if (!Array.isArray(raw)) return null;

  const elements: TheaterElement[] = [];
  for (const code of raw) {
    if (code === 0) continue; // unused slot
    if (typeof code !== 'number') return null;

    const element = ELEMENT_CODES[code];
    if (!element) return null;
    elements.push(element);
  }

  if (elements.length !== 3) return null;
  return [elements[0]!, elements[1]!, elements[2]!];
}

function resolveAvatarIds(
  raw: unknown,
  unknownAvatarIds: Set<number>
): string[] | null {
  if (!Array.isArray(raw)) return null;

  const keys: string[] = [];
  for (const avatarId of raw) {
    if (typeof avatarId !== 'number') continue;

    const key = AVATAR_ID_TO_KEY.get(avatarId);
    if (key) {
      keys.push(key);
    } else {
      unknownAvatarIds.add(avatarId);
    }
  }

  return keys;
}

/** Month id ('YYYY-MM') for a season number, per the id-arithmetic rule. */
export function inferSeasonMonth(seasonId: number): string {
  const monthsFromYearStart = SEASON_EPOCH_MONTH - 1 + seasonId;
  const year = SEASON_EPOCH_YEAR + Math.floor(monthsFromYearStart / 12);
  const month = (monthsFromYearStart % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Extracts the 'YYYY-MM-DD' date portion of a 'YYYY-MM-DD HH:mm:ss' stamp. */
function parseLiveBeginDate(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseRoleCombat(
  json: string,
  options: ParseRoleCombatOptions = {}
): ParsedSeasonResult {
  const minSeasonId = options.minSeasonId ?? 28;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { seasons: [], unknownAvatarIds: [] };
  }

  if (!isRecord(parsed)) {
    return { seasons: [], unknownAvatarIds: [] };
  }

  const seasons: TheaterSeason[] = [];
  const unknownAvatarIds = new Set<number>();

  for (const [rawId, rawEntry] of Object.entries(parsed)) {
    const seasonId = Number(rawId);
    if (!Number.isInteger(seasonId) || seasonId < minSeasonId) continue;
    if (!isRecord(rawEntry)) continue;

    const elements = parseElements(rawEntry.element);
    if (!elements) continue;

    // Unknown ids are recorded per-entry so a skipped malformed entry does not
    // leak its ids into the result.
    const entryUnknowns = new Set<number>();
    const specialGuests = resolveAvatarIds(rawEntry.invite, entryUnknowns);
    const openingCharacters = resolveAvatarIds(rawEntry.buff, entryUnknowns);
    if (!specialGuests || !openingCharacters) continue;

    for (const id of entryUnknowns) unknownAvatarIds.add(id);

    const liveBeginDate = parseLiveBeginDate(rawEntry.live_begin);
    const monthId = liveBeginDate ? liveBeginDate.slice(0, 7) : inferSeasonMonth(seasonId);

    seasons.push({
      id: monthId,
      startDate: liveBeginDate ?? `${monthId}-01`,
      elements,
      openingCharacters,
      specialGuests,
      source: liveBeginDate ? 'official' : 'beta',
    });
  }

  seasons.sort((a, b) => a.id.localeCompare(b.id));

  return {
    seasons,
    unknownAvatarIds: Array.from(unknownAvatarIds).sort((a, b) => a - b),
  };
}
