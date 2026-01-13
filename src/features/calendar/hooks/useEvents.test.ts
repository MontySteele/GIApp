/**
 * Unit Tests: useEvents Hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEvents } from './useEvents';

describe('useEvents Hook', () => {
  describe('Return Structure', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current).toHaveProperty('events');
      expect(result.current).toHaveProperty('activeEvents');
      expect(result.current).toHaveProperty('upcomingEvents');
      expect(result.current).toHaveProperty('activeBanners');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('lastUpdated');
      expect(result.current).toHaveProperty('refresh');
      expect(result.current).toHaveProperty('eventsUnavailable');
    });
  });

  describe('Empty State', () => {
    it('returns empty events array', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.events).toEqual([]);
    });

    it('returns empty activeEvents array', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.activeEvents).toEqual([]);
    });

    it('returns empty upcomingEvents array', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.upcomingEvents).toEqual([]);
    });

    it('returns empty activeBanners array', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.activeBanners).toEqual([]);
    });
  });

  describe('Status Flags', () => {
    it('returns isLoading as false', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.isLoading).toBe(false);
    });

    it('returns eventsUnavailable as true', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.eventsUnavailable).toBe(true);
    });

    it('returns null for error', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.error).toBeNull();
    });

    it('returns null for lastUpdated', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('Refresh Function', () => {
    it('returns a no-op refresh function', () => {
      const { result } = renderHook(() => useEvents());

      // Should be callable without error
      expect(() => result.current.refresh()).not.toThrow();
    });

    it('refresh function is a function type', () => {
      const { result } = renderHook(() => useEvents());

      expect(typeof result.current.refresh).toBe('function');
    });
  });
});
