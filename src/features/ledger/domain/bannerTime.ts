/**
 * Banner period timing utilities.
 *
 * Genshin Impact patches land around 5:00 PM US Eastern Time on the patch day
 * (maintenance runs ~5 PM - 10 PM ET). Banner cycles rotate on those patch
 * transitions, so the authoritative cutoff is "5 PM America/New_York" (DST-aware),
 * NOT midnight local time. All internal timestamps are stored in UTC; this module
 * converts the Eastern-time wall clock to UTC with DST applied automatically.
 */

const BANNER_CUTOFF_HOUR_ET = 17; // 5 PM Eastern
const REFERENCE_BANNER = { year: 2026, month: 1, day: 13 }; // 5.3 phase 1 start
export const BANNER_DURATION_DAYS = 21;

/**
 * Return the current offset of America/New_York vs UTC, in hours, at the given
 * UTC instant. Typically -5 (EST) or -4 (EDT).
 */
function getETOffsetHours(utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  });
  const parts = dtf.formatToParts(utcDate);
  const tzName = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  const match = tzName.match(/GMT([+-]?\d+)/);
  if (!match || !match[1]) return -5;
  return parseInt(match[1], 10);
}

/**
 * Convert a US Eastern wall-clock moment to the corresponding UTC Date.
 * DST-aware: uses Intl to look up the current offset.
 */
export function etWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
): Date {
  // First guess: assume EST (-5). This gets us in the right ballpark so Intl
  // returns the offset that applies at (or very near) the target instant.
  const guess = new Date(Date.UTC(year, month - 1, day, hour + 5, minute));
  const offsetHours = getETOffsetHours(guess);
  // UTC = wall_hour - offsetHours (offset is negative in North America, so this
  // adds hours as expected).
  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));
}

/**
 * Return the 5 PM ET cutoff of banner period #n (0 = REFERENCE_BANNER).
 * Adds `n * BANNER_DURATION_DAYS` calendar days to the reference day, then
 * snaps to 5 PM ET (DST-adjusted) on that day.
 */
export function bannerPeriodBoundary(n: number): Date {
  // Use Date.UTC for calendar-day math: this normalizes overflow (e.g., day=62
  // becomes the correct Feb/Mar day). We only care about the year/month/day
  // that falls out; the hour we impose ourselves.
  const anchor = new Date(
    Date.UTC(
      REFERENCE_BANNER.year,
      REFERENCE_BANNER.month - 1,
      REFERENCE_BANNER.day + n * BANNER_DURATION_DAYS,
    ),
  );
  return etWallToUtc(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + 1,
    anchor.getUTCDate(),
    BANNER_CUTOFF_HOUR_ET,
  );
}

/**
 * Find the start of the banner period containing `date` (inclusive of start,
 * exclusive of the next period's start). Works in millisecond-precise UTC
 * rather than day-based arithmetic so DST transitions don't shift periods.
 */
export function getBannerPeriodStart(date: Date): Date {
  const ref = bannerPeriodBoundary(0);
  // Estimate via ms delta then refine for DST precision (±1 period at most).
  let n = Math.floor((date.getTime() - ref.getTime()) / (BANNER_DURATION_DAYS * 86400000));
  while (bannerPeriodBoundary(n + 1).getTime() <= date.getTime()) n++;
  while (bannerPeriodBoundary(n).getTime() > date.getTime()) n--;
  return bannerPeriodBoundary(n);
}

/**
 * Return the boundary `periods` banner periods after `start`, preserving the
 * 5 PM ET wall-clock time (DST-corrected per period).
 */
export function addBannerPeriods(start: Date, periods: number): Date {
  // Determine which banner `start` is, then add `periods`.
  const ref = bannerPeriodBoundary(0);
  const n = Math.round((start.getTime() - ref.getTime()) / (BANNER_DURATION_DAYS * 86400000));
  return bannerPeriodBoundary(n + periods);
}
