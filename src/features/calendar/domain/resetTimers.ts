/**
 * Reset timer calculations for Genshin Impact
 * All calculations based on US Server (UTC-5 / America server)
 *
 * Server reset time: 4:00 AM server time
 * US Server offset: UTC-5 (EST), which means 9:00 AM UTC
 */

// US Server offset in hours from UTC
const US_SERVER_OFFSET_HOURS = -5;

// Reset hour in server time (4:00 AM)
const RESET_HOUR_SERVER = 4;

/**
 * Convert server time hour to UTC hour
 * Server 4:00 AM at UTC-5 = 9:00 AM UTC
 */
const RESET_HOUR_UTC = RESET_HOUR_SERVER - US_SERVER_OFFSET_HOURS; // 9

export interface ResetInfo {
  name: string;
  nextReset: Date;
  timeUntil: string;
  description: string;
}

/**
 * Get the next daily reset time
 * Daily reset occurs at 4:00 AM server time (9:00 AM UTC for US server)
 */
export function getNextDailyReset(): Date {
  const now = new Date();
  const reset = new Date(now);

  reset.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);

  // If we've passed today's reset, move to tomorrow
  if (now >= reset) {
    reset.setUTCDate(reset.getUTCDate() + 1);
  }

  return reset;
}

/**
 * Get the next weekly reset time
 * Weekly reset occurs every Monday at 4:00 AM server time
 */
export function getNextWeeklyReset(): Date {
  const now = new Date();
  const reset = new Date(now);

  reset.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);

  // Get current day of week (0 = Sunday, 1 = Monday, ...)
  const currentDay = reset.getUTCDay();

  // Calculate days until next Monday
  // If today is Monday and we haven't passed reset, days = 0
  // If today is Monday and we have passed reset, days = 7
  // Otherwise, days until Monday
  let daysUntilMonday = (8 - currentDay) % 7; // Days until next Monday
  if (currentDay === 1) {
    // It's Monday
    if (now >= reset) {
      daysUntilMonday = 7; // Already passed today's reset, wait until next Monday
    } else {
      daysUntilMonday = 0; // Haven't passed reset yet
    }
  }

  reset.setUTCDate(reset.getUTCDate() + daysUntilMonday);

  return reset;
}

/**
 * Get the next Spiral Abyss reset time
 * Spiral Abyss resets on the 1st and 16th of each month at 4:00 AM server time
 */
export function getNextAbyssReset(): Date {
  const now = new Date();
  const reset = new Date(now);

  reset.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);

  const currentDay = reset.getUTCDate();

  if (currentDay < 1 || (currentDay === 1 && now < reset)) {
    // Before the 1st reset
    reset.setUTCDate(1);
  } else if (currentDay < 16 || (currentDay === 16 && now < reset)) {
    // Between 1st and 16th
    reset.setUTCDate(16);
  } else {
    // After the 16th, go to next month's 1st
    reset.setUTCMonth(reset.getUTCMonth() + 1);
    reset.setUTCDate(1);
  }

  return reset;
}

/**
 * Get the next monthly shop reset (Paimon's Bargains)
 * Resets on the 1st of each month at 4:00 AM server time
 */
export function getNextMonthlyReset(): Date {
  const now = new Date();
  const reset = new Date(now);

  reset.setUTCHours(RESET_HOUR_UTC, 0, 0, 0);
  reset.setUTCDate(1);

  // If we've passed this month's reset, move to next month
  if (now >= reset) {
    reset.setUTCMonth(reset.getUTCMonth() + 1);
  }

  return reset;
}

/**
 * Get the next Battle Pass reset (estimated)
 * Battle Pass typically resets with each version update (~6 weeks)
 * This returns an approximate based on the 6-week cycle
 */
export function getNextBattlePassReset(): Date {
  // Version 6.3 starts January 14, 2026
  // Each version is ~42 days (6 weeks)
  const knownVersionStart = new Date('2026-01-14T09:00:00Z'); // 4 AM server = 9 AM UTC
  const versionLength = 42 * 24 * 60 * 60 * 1000; // 42 days in ms

  const now = new Date();

  // Find the next version start after now
  let nextVersionStart = new Date(knownVersionStart);
  while (nextVersionStart <= now) {
    nextVersionStart = new Date(nextVersionStart.getTime() + versionLength);
  }

  return nextVersionStart;
}

/**
 * Format time until a date as a human-readable string
 */
export function formatTimeUntil(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return 'Now!';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (days === 0 && hours === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Get all reset timers
 */
export function getAllResetTimers(): ResetInfo[] {
  return [
    {
      name: 'Daily Reset',
      nextReset: getNextDailyReset(),
      timeUntil: formatTimeUntil(getNextDailyReset()),
      description: 'Commissions, Resin, Domains, Expeditions',
    },
    {
      name: 'Weekly Reset',
      nextReset: getNextWeeklyReset(),
      timeUntil: formatTimeUntil(getNextWeeklyReset()),
      description: 'Weekly Bosses, Reputation, Battle Pass Weeklies',
    },
    {
      name: 'Spiral Abyss',
      nextReset: getNextAbyssReset(),
      timeUntil: formatTimeUntil(getNextAbyssReset()),
      description: 'Floors 9-12 reset (1st & 16th)',
    },
    {
      name: 'Monthly Shop',
      nextReset: getNextMonthlyReset(),
      timeUntil: formatTimeUntil(getNextMonthlyReset()),
      description: "Paimon's Bargains, Stardust/Starglitter Exchange",
    },
  ];
}

/**
 * Format a date for display in local time
 */
export function formatResetDate(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
