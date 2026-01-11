/**
 * Types for calendar events from external sources
 */

export type EventType = 'Banner' | 'In-game' | 'Web' | 'Stream' | 'Maintenance' | 'Quiz' | 'Unlock';

export interface CalendarEvent {
  name: string;
  type: EventType;
  link?: string;
  img?: string;
  start: string; // "YYYY-MM-DD HH:MM:SS"
  end?: string;
  reminder?: 'daily' | 'end' | null;
  remindtime?: string;
  timezone?: string;
  start_server?: boolean;
  end_server?: boolean;
}

export interface ParsedEvent {
  id: string;
  name: string;
  type: EventType;
  link?: string;
  img?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  isUpcoming: boolean;
  timeUntilStart?: string;
  timeUntilEnd?: string;
}

// Event type colors for UI
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  Banner: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'In-game': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Web: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Stream: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
  Quiz: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Unlock: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};
