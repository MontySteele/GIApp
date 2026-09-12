/**
 * Reset timer calculations for Genshin Impact
 *
 * All resets happen at 04:00 server time. The server region defaults to the
 * user's configured region (see `useServerRegion`); pass one explicitly for
 * pure computation. Region offsets live in `@/lib/time/serverTime`.
 */

import {
  getNextDailyReset as getNextDailyResetForRegion,
  getNextWeeklyReset as getNextWeeklyResetForRegion,
  getServerNow,
  serverWallToDate,
  type ServerRegion,
} from '@/lib/time/serverTime';
import { getCurrentServerRegion } from '@/stores/uiStore';

export interface ResetInfo {
  name: string;
  nextReset: Date;
  timeUntil: string;
  description: string;
}

/**
 * Get the next daily reset time (4:00 AM server time).
 */
export function getNextDailyReset(
  region: ServerRegion = getCurrentServerRegion(),
  now: Date = new Date()
): Date {
  return getNextDailyResetForRegion(region, now);
}

/**
 * Get the next weekly reset time (Monday 4:00 AM server time).
 */
export function getNextWeeklyReset(
  region: ServerRegion = getCurrentServerRegion(),
  now: Date = new Date()
): Date {
  return getNextWeeklyResetForRegion(region, now);
}

/**
 * Get the next Spiral Abyss reset time
 * Spiral Abyss resets on the 1st and 16th of each month at 4:00 AM server time
 */
export function getNextAbyssReset(
  region: ServerRegion = getCurrentServerRegion(),
  now: Date = new Date()
): Date {
  const server = getServerNow(region, now);
  const candidates = [
    serverWallToDate(region, server.year, server.month, 1),
    serverWallToDate(region, server.year, server.month, 16),
    serverWallToDate(region, server.year, server.month + 1, 1),
  ];
  // The last candidate is always in the future, so this never falls through.
  return candidates.find((candidate) => candidate.getTime() > now.getTime()) ?? candidates[2]!;
}

/**
 * Get the next monthly shop reset (Paimon's Bargains)
 * Resets on the 1st of each month at 4:00 AM server time
 */
export function getNextMonthlyReset(
  region: ServerRegion = getCurrentServerRegion(),
  now: Date = new Date()
): Date {
  const server = getServerNow(region, now);
  const thisMonth = serverWallToDate(region, server.year, server.month, 1);
  if (thisMonth.getTime() > now.getTime()) return thisMonth;
  return serverWallToDate(region, server.year, server.month + 1, 1);
}

/**
 * Get the next Imaginarium Theatre reset
 * Resets on the 1st of each month at 4:00 AM server time
 */
export function getNextImaginariumReset(
  region: ServerRegion = getCurrentServerRegion(),
  now: Date = new Date()
): Date {
  // Same as monthly reset - 1st of each month
  return getNextMonthlyReset(region, now);
}

/**
 * Get the next patch/version update
 * Patches occur approximately every 42 days (6 weeks)
 * Maintenance typically starts around 6 PM Eastern (11 PM UTC) on Tuesday
 * but varies - using 4 PM Eastern as banner end time anchor
 */
export function getNextPatchReset(): Date {
  // Version 6.3 maintenance starts Tuesday Jan 13, 2026
  // Banners end around 4 PM Eastern = 9 PM UTC
  const knownVersionStart = new Date('2026-01-13T21:00:00Z'); // 4 PM Eastern
  const versionLength = 42 * 24 * 60 * 60 * 1000; // 42 days in ms

  const now = new Date();

  // Find the next version start after now
  let nextVersionStart = new Date(knownVersionStart);

  // Go backwards if needed to find the anchor point
  while (nextVersionStart > now) {
    const prev = new Date(nextVersionStart.getTime() - versionLength);
    if (prev <= now) break;
    nextVersionStart = prev;
  }

  // Now go forwards to find the next patch after now
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
export function getAllResetTimers(region: ServerRegion = getCurrentServerRegion()): ResetInfo[] {
  return [
    {
      name: 'Daily Reset',
      nextReset: getNextDailyReset(region),
      timeUntil: formatTimeUntil(getNextDailyReset(region)),
      description: 'Commissions, Resin, Domains, Expeditions',
    },
    {
      name: 'Weekly Reset',
      nextReset: getNextWeeklyReset(region),
      timeUntil: formatTimeUntil(getNextWeeklyReset(region)),
      description: 'Weekly Bosses, Reputation, Battle Pass Weeklies',
    },
    {
      name: 'Spiral Abyss',
      nextReset: getNextAbyssReset(region),
      timeUntil: formatTimeUntil(getNextAbyssReset(region)),
      description: 'Floors 9-12 reset (1st & 16th)',
    },
    {
      name: 'Imaginarium Theatre',
      nextReset: getNextImaginariumReset(region),
      timeUntil: formatTimeUntil(getNextImaginariumReset(region)),
      description: 'Monthly season reset (1st of month)',
    },
    {
      name: 'Next Patch',
      nextReset: getNextPatchReset(),
      timeUntil: formatTimeUntil(getNextPatchReset()),
      description: 'Version update (~42 day cycle)',
    },
    {
      name: 'Monthly Shop',
      nextReset: getNextMonthlyReset(region),
      timeUntil: formatTimeUntil(getNextMonthlyReset(region)),
      description: "Paimon's Bargains, Stardust/Starglitter",
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
