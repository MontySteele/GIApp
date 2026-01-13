import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TodayFarmingWidget from './TodayFarmingWidget';

// Helper to render with router
function renderWidget() {
  return render(
    <MemoryRouter>
      <TodayFarmingWidget />
    </MemoryRouter>
  );
}

describe('TodayFarmingWidget', () => {
  describe('renders correctly', () => {
    it('displays the widget title', () => {
      renderWidget();

      expect(screen.getByText("Today's Farming")).toBeInTheDocument();
    });

    it('shows the current day name', () => {
      renderWidget();

      // Should show one of the day names
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const foundDay = dayNames.some(day => screen.queryByText(day) !== null);
      expect(foundDay).toBe(true);
    });

    it('shows planner link', () => {
      renderWidget();

      const link = screen.getByRole('link', { name: /planner/i });
      expect(link).toHaveAttribute('href', '/teams/planner');
    });
  });

  describe('day-specific content', () => {
    let originalDate: DateConstructor;

    beforeEach(() => {
      originalDate = global.Date;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('shows all domains message on Sunday', () => {
      // Mock Sunday (0)
      const mockDate = new Date('2024-01-07T12:00:00'); // A Sunday
      vi.setSystemTime(mockDate);

      renderWidget();

      expect(screen.getByText(/all domains are available/i)).toBeInTheDocument();
    });

    it('shows Monday/Thursday domains on Monday', () => {
      // Mock Monday (1)
      const mockDate = new Date('2024-01-08T12:00:00'); // A Monday
      vi.setSystemTime(mockDate);

      renderWidget();

      // Monday has Freedom, Prosperity, Transience, Admonition, Equity, Contention
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Prosperity')).toBeInTheDocument();
    });

    it('shows Tuesday/Friday domains on Tuesday', () => {
      // Mock Tuesday (2)
      const mockDate = new Date('2024-01-09T12:00:00'); // A Tuesday
      vi.setSystemTime(mockDate);

      renderWidget();

      // Tuesday has Resistance, Diligence, Elegance, Ingenuity, Justice, Kindling
      expect(screen.getByText('Resistance')).toBeInTheDocument();
      expect(screen.getByText('Diligence')).toBeInTheDocument();
    });

    it('shows Wednesday/Saturday domains on Wednesday', () => {
      // Mock Wednesday (3)
      const mockDate = new Date('2024-01-10T12:00:00'); // A Wednesday
      vi.setSystemTime(mockDate);

      renderWidget();

      // Wednesday has Ballad, Gold, Light, Praxis, Order, Conflict
      expect(screen.getByText('Ballad')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
    });
  });

  describe('region grouping', () => {
    beforeEach(() => {
      // Mock Monday for consistent testing
      const mockDate = new Date('2024-01-08T12:00:00');
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('groups domains by region', () => {
      renderWidget();

      // Should show region names
      expect(screen.getByText('Mondstadt')).toBeInTheDocument();
      expect(screen.getByText('Liyue')).toBeInTheDocument();
      expect(screen.getByText('Inazuma')).toBeInTheDocument();
      expect(screen.getByText('Sumeru')).toBeInTheDocument();
      expect(screen.getByText('Fontaine')).toBeInTheDocument();
      expect(screen.getByText('Natlan')).toBeInTheDocument();
    });
  });

  describe('informational text', () => {
    beforeEach(() => {
      // Mock a non-Sunday day
      const mockDate = new Date('2024-01-08T12:00:00'); // Monday
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows rotation info on non-Sunday days', () => {
      renderWidget();

      expect(screen.getByText(/talent book domains rotate daily/i)).toBeInTheDocument();
    });

    it('does not show rotation info on Sunday', () => {
      vi.setSystemTime(new Date('2024-01-07T12:00:00')); // Sunday

      renderWidget();

      expect(screen.queryByText(/talent book domains rotate daily/i)).not.toBeInTheDocument();
    });
  });
});
