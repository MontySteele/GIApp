import { useState } from 'react';
import type { ParsedEvent } from '../domain/eventTypes';

/**
 * Hook to manage calendar events
 *
 * Note: There's no reliable public JSON API for Genshin events.
 * - HuTao bot's events.json is outdated (stopped ~2023)
 * - Paimon.moe's timeline.js is JavaScript, not parseable JSON
 *
 * For now, we return empty events and direct users to paimon.moe
 * for the most up-to-date event information.
 */
export function useEvents() {
  const [isLoading] = useState(false);

  // No reliable external API available
  const events: ParsedEvent[] = [];
  const activeEvents: ParsedEvent[] = [];
  const upcomingEvents: ParsedEvent[] = [];
  const activeBanners: ParsedEvent[] = [];

  return {
    events,
    activeEvents,
    upcomingEvents,
    activeBanners,
    isLoading,
    error: null,
    lastUpdated: null,
    refresh: () => {},
    // Flag to indicate events aren't available
    eventsUnavailable: true,
  };
}
