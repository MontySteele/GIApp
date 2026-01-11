import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent, ParsedEvent, EventType } from '../domain/eventTypes';
import { formatTimeUntil } from '../domain/resetTimers';

const EVENTS_URL = 'https://raw.githubusercontent.com/Tibowl/HuTao/master/src/data/events.json';
const CACHE_KEY = 'genshin-calendar-events';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedData {
  events: CalendarEvent[];
  fetchedAt: number;
}

/**
 * Parse event date string to Date object
 * Format: "YYYY-MM-DD HH:MM:SS"
 * Times are assumed to be UTC unless timezone specified
 */
function parseEventDate(dateStr: string, timezone?: string): Date {
  // Parse "YYYY-MM-DD HH:MM:SS" format
  const parts = dateStr.split(' ');
  const datePart = parts[0] || '';
  const timePart = parts[1] || '00:00:00';

  const dateParts = datePart.split('-').map(Number);
  const year = dateParts[0] || 2024;
  const month = dateParts[1] || 1;
  const day = dateParts[2] || 1;

  const timeParts = timePart.split(':').map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  // If timezone is specified (e.g., "-05:00"), parse it
  if (timezone) {
    const sign = timezone.startsWith('-') ? -1 : 1;
    const tzParts = timezone.replace(/[+-]/, '').split(':').map(Number);
    const tzHours = tzParts[0] || 0;
    const tzMinutes = tzParts[1] || 0;
    const offsetMs = sign * (tzHours * 60 + tzMinutes) * 60 * 1000;

    // Create date in UTC, then adjust for timezone
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    return new Date(utcDate.getTime() - offsetMs);
  }

  // Default to UTC
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

/**
 * Parse raw event into a more usable format
 */
function parseEvent(event: CalendarEvent, index: number): ParsedEvent {
  const now = new Date();
  const startDate = parseEventDate(event.start, event.timezone);
  const endDate = event.end ? parseEventDate(event.end, event.timezone) : undefined;

  const isActive = startDate <= now && (!endDate || endDate > now);
  const isUpcoming = startDate > now;

  return {
    id: `${event.name}-${index}`,
    name: event.name,
    type: event.type as EventType,
    link: event.link,
    img: event.img,
    startDate,
    endDate,
    isActive,
    isUpcoming,
    timeUntilStart: isUpcoming ? formatTimeUntil(startDate) : undefined,
    timeUntilEnd: isActive && endDate ? formatTimeUntil(endDate) : undefined,
  };
}

/**
 * Hook to fetch and manage calendar events
 */
export function useEvents() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { events: cachedEvents, fetchedAt }: CachedData = JSON.parse(cached);
          if (Date.now() - fetchedAt < CACHE_DURATION) {
            const parsed = cachedEvents.map(parseEvent);
            setEvents(parsed);
            setLastUpdated(new Date(fetchedAt));
            setIsLoading(false);
            return;
          }
        }
      }

      // Fetch from GitHub
      const response = await fetch(EVENTS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const rawEvents: CalendarEvent[] = await response.json();

      // Cache the raw events
      const cacheData: CachedData = {
        events: rawEvents,
        fetchedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      // Parse and set events
      const parsed = rawEvents.map(parseEvent);
      setEvents(parsed);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');

      // Try to use stale cache on error
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { events: cachedEvents, fetchedAt }: CachedData = JSON.parse(cached);
        const parsed = cachedEvents.map(parseEvent);
        setEvents(parsed);
        setLastUpdated(new Date(fetchedAt));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Get active events (currently running)
  const activeEvents = events.filter((e) => e.isActive);

  // Get upcoming events (not yet started)
  const upcomingEvents = events
    .filter((e) => e.isUpcoming)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Get banner events specifically
  const bannerEvents = events.filter((e) => e.type === 'Banner');
  const activeBanners = bannerEvents.filter((e) => e.isActive);

  return {
    events,
    activeEvents,
    upcomingEvents,
    activeBanners,
    isLoading,
    error,
    lastUpdated,
    refresh: () => fetchEvents(true),
  };
}
