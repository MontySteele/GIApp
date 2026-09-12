/**
 * Genshin Impact server time utilities.
 *
 * Every Genshin server runs on a FIXED UTC offset (no daylight saving):
 *   America (os_usa)  UTC-5
 *   Europe  (os_euro) UTC+1
 *   Asia    (os_asia) UTC+8
 *   TW/HK/MO (os_cht) UTC+8
 *
 * The in-game "day" rolls over at 04:00 server time (daily reset) and the
 * week rolls over on Monday 04:00 server time (weekly reset).
 *
 * All functions here are pure: they take the region and an optional `now`
 * instant and never read global state. Callers that want the user's
 * configured region should read it from the UI store (`useServerRegion` /
 * `getCurrentServerRegion`) and pass it in.
 */

export type ServerRegion = 'na' | 'eu' | 'asia' | 'tw';

export const SERVER_REGIONS: readonly ServerRegion[] = ['na', 'eu', 'asia', 'tw'];

export const SERVER_REGION_LABELS: Record<ServerRegion, string> = {
  na: 'America',
  eu: 'Europe',
  asia: 'Asia',
  tw: 'TW / HK / MO',
};

/** Fixed offset of each server from UTC, in hours. Genshin servers do not observe DST. */
export const SERVER_UTC_OFFSET_HOURS: Record<ServerRegion, number> = {
  na: -5,
  eu: 1,
  asia: 8,
  tw: 8,
};

/** Fallback region when nothing better is known (matches historical app behaviour). */
export const DEFAULT_SERVER_REGION: ServerRegion = 'na';

/** Hour (server wall clock) at which the game day rolls over. */
export const DAILY_RESET_HOUR = 4;

/** Weekday (0 = Sunday) on which the weekly reset happens. */
export const WEEKLY_RESET_WEEKDAY = 1;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface ServerNow {
  /** Full year of the server wall clock. */
  year: number;
  /** Month 1-12 of the server wall clock. */
  month: number;
  /** Day of month 1-31 of the server wall clock. */
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** Calendar weekday of the server wall clock, 0 = Sunday. */
  weekday: number;
  /** `YYYY-MM-DD` of the server wall clock. */
  isoDate: string;
}

export interface ServerDay {
  /** Weekday of the current *game day* (rolls over at 04:00 server time), 0 = Sunday. */
  weekday: number;
  /** Name of the game-day weekday. */
  weekdayName: WeekdayName;
  /** `YYYY-MM-DD` of the current game day. */
  isoDate: string;
}

function offsetMs(region: ServerRegion): number {
  return SERVER_UTC_OFFSET_HOURS[region] * HOUR_MS;
}

/**
 * Shift a real instant into "server wall-clock space": a Date whose UTC
 * getters read as the server's local wall clock.
 */
function toServerWall(region: ServerRegion, now: Date): Date {
  return new Date(now.getTime() + offsetMs(region));
}

/** Inverse of `toServerWall`. */
function fromServerWall(region: ServerRegion, wall: number): Date {
  return new Date(wall - offsetMs(region));
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isoDateOf(wall: Date): string {
  return `${wall.getUTCFullYear()}-${pad2(wall.getUTCMonth() + 1)}-${pad2(wall.getUTCDate())}`;
}

/**
 * Wall-clock-space instant (ms) at which the current game day started
 * (the most recent 04:00 server time at or before `now`).
 */
function currentGameDayStartWall(region: ServerRegion, now: Date): number {
  // Subtracting the reset hour turns "04:00 → 03:59 next day" into a plain calendar day.
  const gameDay = new Date(now.getTime() + offsetMs(region) - DAILY_RESET_HOUR * HOUR_MS);
  return Date.UTC(
    gameDay.getUTCFullYear(),
    gameDay.getUTCMonth(),
    gameDay.getUTCDate(),
    DAILY_RESET_HOUR
  );
}

/**
 * Heuristically map an IANA timezone to the Genshin server most players in
 * that zone use. Unknown / UTC / Etc zones fall back to `DEFAULT_SERVER_REGION`.
 */
export function getServerRegionFromTimezone(
  tz: string | undefined = safeResolvedTimeZone()
): ServerRegion {
  if (!tz) return DEFAULT_SERVER_REGION;

  if (/^Asia\/(Taipei|Hong_Kong|Macau|Macao)$/.test(tz)) return 'tw';

  if (/^(America|US|Canada|Mexico|Brazil|Chile|Cuba|Jamaica|Navajo)(\/|$)/.test(tz)) return 'na';
  if (/^(Pacific\/Honolulu|Pacific\/Tahiti|Pacific\/Marquesas|Pacific\/Gambier|Pacific\/Easter|Pacific\/Galapagos|Atlantic\/Bermuda|Atlantic\/Stanley|Antarctica\/Palmer|Antarctica\/Rothera)$/.test(tz)) {
    return 'na';
  }

  if (/^(Europe|Africa|Atlantic|Arctic|Iceland|Poland|Portugal|Turkey|Eire|Egypt|Libya|CET|EET|MET|WET|GB|GB-Eire)(\/|$)/.test(tz)) {
    return 'eu';
  }
  // Russia west of the Urals, Middle East and the Caucasus are closest to EU.
  if (/^Asia\/(Istanbul|Nicosia|Famagusta|Beirut|Damascus|Amman|Jerusalem|Tel_Aviv|Baghdad|Riyadh|Kuwait|Qatar|Bahrain|Aden|Tehran|Yerevan|Baku|Tbilisi)$/.test(tz)) {
    return 'eu';
  }

  if (/^(Asia|Australia|Pacific|Indian|Antarctica|Japan|Singapore|Hongkong|ROC|ROK|PRC|NZ|NZ-CHAT|Israel|Iran)(\/|$)/.test(tz)) {
    return 'asia';
  }

  return DEFAULT_SERVER_REGION;
}

function safeResolvedTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** Server wall-clock components for `now` in the given region. */
export function getServerNow(region: ServerRegion, now: Date = new Date()): ServerNow {
  const wall = toServerWall(region, now);
  return {
    year: wall.getUTCFullYear(),
    month: wall.getUTCMonth() + 1,
    day: wall.getUTCDate(),
    hour: wall.getUTCHours(),
    minute: wall.getUTCMinutes(),
    second: wall.getUTCSeconds(),
    weekday: wall.getUTCDay(),
    isoDate: isoDateOf(wall),
  };
}

/**
 * The current *game day* for the region: the calendar day that started at
 * the most recent 04:00 server time. Between 00:00 and 03:59 server time this
 * is still "yesterday" (domain rotation has not changed yet).
 */
export function getServerDay(region: ServerRegion, now: Date = new Date()): ServerDay {
  const start = new Date(currentGameDayStartWall(region, now));
  const weekday = start.getUTCDay();
  return {
    weekday,
    weekdayName: WEEKDAY_NAMES[weekday] ?? 'Sunday',
    isoDate: isoDateOf(start),
  };
}

/** Real instant of the next 04:00 server time strictly after `now`. */
export function getNextDailyReset(region: ServerRegion, now: Date = new Date()): Date {
  return fromServerWall(region, currentGameDayStartWall(region, now) + DAY_MS);
}

/** Real instant of the most recent 04:00 server time at or before `now`. */
export function getLastDailyReset(region: ServerRegion, now: Date = new Date()): Date {
  return fromServerWall(region, currentGameDayStartWall(region, now));
}

/** Real instant of the next Monday 04:00 server time strictly after `now`. */
export function getNextWeeklyReset(region: ServerRegion, now: Date = new Date()): Date {
  const startWall = currentGameDayStartWall(region, now);
  const weekday = new Date(startWall).getUTCDay();
  // If the current game day is already Monday we are past this week's reset.
  const daysUntil = (WEEKLY_RESET_WEEKDAY - weekday + 7) % 7 || 7;
  return fromServerWall(region, startWall + daysUntil * DAY_MS);
}

/** Real instant of the most recent Monday 04:00 server time at or before `now`. */
export function getLastWeeklyReset(region: ServerRegion, now: Date = new Date()): Date {
  return new Date(getNextWeeklyReset(region, now).getTime() - 7 * DAY_MS);
}

/**
 * Convert a server wall-clock date/time to the real instant it denotes.
 * `month` is 1-12. Out-of-range values overflow like `Date.UTC`.
 */
export function serverWallToDate(
  region: ServerRegion,
  year: number,
  month: number,
  day: number,
  hour: number = DAILY_RESET_HOUR,
  minute: number = 0
): Date {
  return fromServerWall(region, Date.UTC(year, month - 1, day, hour, minute));
}

/** Map the `region` query parameter of a HoYoverse gacha URL to a `ServerRegion`. */
export function parseHoyoRegion(param: string | null | undefined): ServerRegion | null {
  switch ((param ?? '').trim().toLowerCase()) {
    case 'os_usa':
      return 'na';
    case 'os_euro':
      return 'eu';
    case 'os_asia':
      return 'asia';
    case 'os_cht':
      return 'tw';
    default:
      return null;
  }
}

/** ISO-8601 offset suffix for the region, e.g. `-05:00` or `+08:00`. */
export function serverOffsetString(region: ServerRegion): string {
  const hours = SERVER_UTC_OFFSET_HOURS[region];
  const sign = hours < 0 ? '-' : '+';
  return `${sign}${pad2(Math.abs(hours))}:00`;
}

export function isServerRegion(value: unknown): value is ServerRegion {
  return typeof value === 'string' && (SERVER_REGIONS as readonly string[]).includes(value);
}

/** Human label for footers and badges, e.g. "America server (UTC-5)". */
export function formatServerRegion(region: ServerRegion): string {
  const offset = SERVER_UTC_OFFSET_HOURS[region];
  const sign = offset >= 0 ? '+' : '-';
  return `${SERVER_REGION_LABELS[region]} server (UTC${sign}${Math.abs(offset)})`;
}
