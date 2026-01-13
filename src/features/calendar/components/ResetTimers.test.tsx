/**
 * Unit Tests: ResetTimers Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResetTimers from './ResetTimers';

// Mock the domain functions
vi.mock('../domain/resetTimers', () => ({
  getAllResetTimers: vi.fn(() => [
    {
      name: 'Daily Reset',
      description: 'Resin, commissions, and shops reset',
      nextReset: new Date('2026-01-14T09:00:00Z'),
      timeUntil: '12h 30m 15s',
    },
    {
      name: 'Weekly Reset',
      description: 'Weekly bosses and reputation',
      nextReset: new Date('2026-01-20T09:00:00Z'),
      timeUntil: '6d 12h 30m',
    },
    {
      name: 'Spiral Abyss',
      description: 'Abyss resets on 1st and 16th',
      nextReset: new Date('2026-01-16T09:00:00Z'),
      timeUntil: '2d 12h 30m',
    },
    {
      name: 'Imaginarium Theatre',
      description: 'Monthly theatre reset',
      nextReset: new Date('2026-02-01T09:00:00Z'),
      timeUntil: '18d 12h 30m',
    },
    {
      name: 'Next Patch',
      description: 'Version 5.4 estimated release',
      nextReset: new Date('2026-02-12T09:00:00Z'),
      timeUntil: '29d 12h 30m',
    },
    {
      name: 'Monthly Shop',
      description: 'Paimon shop and monthly items',
      nextReset: new Date('2026-02-01T09:00:00Z'),
      timeUntil: '18d 12h 30m',
    },
  ]),
  formatTimeUntil: vi.fn((date: Date) => '12h 30m 15s'),
  formatResetDate: vi.fn((date: Date) => 'January 14, 2026 at 4:00 AM'),
}));

describe('ResetTimers Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T20:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with header', () => {
      render(<ResetTimers />);

      expect(screen.getByText('Reset Timers')).toBeInTheDocument();
      expect(screen.getByText('US Server (UTC-5)')).toBeInTheDocument();
    });

    it('renders all 6 timer cards', () => {
      render(<ResetTimers />);

      expect(screen.getByText('Daily Reset')).toBeInTheDocument();
      expect(screen.getByText('Weekly Reset')).toBeInTheDocument();
      expect(screen.getByText('Spiral Abyss')).toBeInTheDocument();
      expect(screen.getByText('Imaginarium Theatre')).toBeInTheDocument();
      expect(screen.getByText('Next Patch')).toBeInTheDocument();
      expect(screen.getByText('Monthly Shop')).toBeInTheDocument();
    });

    it('displays timer descriptions', () => {
      render(<ResetTimers />);

      expect(screen.getByText('Resin, commissions, and shops reset')).toBeInTheDocument();
      expect(screen.getByText('Weekly bosses and reputation')).toBeInTheDocument();
      expect(screen.getByText('Abyss resets on 1st and 16th')).toBeInTheDocument();
    });

    it('displays time until reset', () => {
      render(<ResetTimers />);

      // At least one timer should show a time format
      const timeElements = screen.getAllByText(/\d+[dhms]/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('displays formatted reset dates', () => {
      render(<ResetTimers />);

      // formatResetDate should be called for each timer
      const dates = screen.getAllByText(/January \d+, 2026/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('Timer Icons', () => {
    it('renders icons for each timer type', () => {
      render(<ResetTimers />);

      // Each timer card should have an SVG icon
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Timer Card Structure', () => {
    it('renders timer cards with correct structure', () => {
      render(<ResetTimers />);

      // Each timer should be in a card with the expected structure
      const timerCards = document.querySelectorAll('.bg-slate-800\\/50');
      expect(timerCards.length).toBe(6);
    });

    it('displays time in prominent styling', () => {
      render(<ResetTimers />);

      // Time should be in a bold, colored text
      const times = document.querySelectorAll('.text-primary-400.font-bold');
      expect(times.length).toBeGreaterThan(0);
    });
  });
});
