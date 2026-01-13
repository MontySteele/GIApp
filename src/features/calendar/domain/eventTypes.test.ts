/**
 * Unit Tests: Event Types Domain
 */

import { describe, it, expect } from 'vitest';
import { EVENT_TYPE_COLORS, type EventType } from './eventTypes';

describe('Event Types Domain', () => {
  describe('EVENT_TYPE_COLORS', () => {
    const allEventTypes: EventType[] = [
      'Banner',
      'In-game',
      'Web',
      'Stream',
      'Maintenance',
      'Quiz',
      'Unlock',
    ];

    it('has entries for all EventTypes', () => {
      allEventTypes.forEach((type) => {
        expect(EVENT_TYPE_COLORS[type]).toBeDefined();
      });
    });

    it('has correct number of event types', () => {
      expect(Object.keys(EVENT_TYPE_COLORS)).toHaveLength(allEventTypes.length);
    });

    it('each color value contains Tailwind class patterns', () => {
      Object.values(EVENT_TYPE_COLORS).forEach((colorClass) => {
        // Each color should have bg, text, and border classes
        expect(colorClass).toMatch(/bg-/);
        expect(colorClass).toMatch(/text-/);
        expect(colorClass).toMatch(/border-/);
      });
    });

    it('Banner type has amber color classes', () => {
      expect(EVENT_TYPE_COLORS.Banner).toContain('amber');
    });

    it('In-game type has emerald color classes', () => {
      expect(EVENT_TYPE_COLORS['In-game']).toContain('emerald');
    });

    it('Maintenance type has red color classes', () => {
      expect(EVENT_TYPE_COLORS.Maintenance).toContain('red');
    });

    it('Web type has blue color classes', () => {
      expect(EVENT_TYPE_COLORS.Web).toContain('blue');
    });

    it('Stream type has purple color classes', () => {
      expect(EVENT_TYPE_COLORS.Stream).toContain('purple');
    });

    it('Quiz type has cyan color classes', () => {
      expect(EVENT_TYPE_COLORS.Quiz).toContain('cyan');
    });

    it('Unlock type has pink color classes', () => {
      expect(EVENT_TYPE_COLORS.Unlock).toContain('pink');
    });
  });
});
