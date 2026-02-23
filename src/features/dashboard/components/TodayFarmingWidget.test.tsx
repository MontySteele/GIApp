import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TodayFarmingWidget from './TodayFarmingWidget';

// Mock the useTodayFarming hook
vi.mock('../hooks/useTodayFarming', () => ({
  useTodayFarming: vi.fn(() => ({
    today: 'Monday',
    isLoading: false,
    charactersByBook: new Map(),
    availableTodayWithCharacters: [],
    notAvailableToday: [],
    totalCharactersProcessed: 0,
  })),
}));

import { useTodayFarming } from '../hooks/useTodayFarming';

// Helper to render with router
function renderWidget() {
  return render(
    <MemoryRouter>
      <TodayFarmingWidget />
    </MemoryRouter>
  );
}

describe('TodayFarmingWidget', () => {
  beforeEach(() => {
    vi.mocked(useTodayFarming).mockReturnValue({
      today: 'Monday',
      isLoading: false,
      charactersByBook: new Map(),
      availableTodayWithCharacters: [],
      notAvailableToday: [],
      totalCharactersProcessed: 0,
    });
  });

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

      // The planner link is an icon-only link (ArrowRight svg, no text)
      const links = screen.getAllByRole('link');
      const plannerLink = links.find(link => link.getAttribute('href') === '/teams/planner');
      expect(plannerLink).toBeDefined();
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
      // Mock Sunday
      const mockDate = new Date('2024-01-07T12:00:00'); // A Sunday
      vi.setSystemTime(mockDate);

      renderWidget();

      expect(screen.getByText(/all domains are available/i)).toBeInTheDocument();
    });

    it('shows Monday/Thursday domains on Monday', () => {
      // Mock Monday
      const mockDate = new Date('2024-01-08T12:00:00'); // A Monday
      vi.setSystemTime(mockDate);

      renderWidget();

      // Monday has Freedom, Prosperity, Transience, Admonition, Equity, Contention
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Prosperity')).toBeInTheDocument();
    });

    it('shows Tuesday/Friday domains on Tuesday', () => {
      // Mock Tuesday
      const mockDate = new Date('2024-01-09T12:00:00'); // A Tuesday
      vi.setSystemTime(mockDate);

      renderWidget();

      // Tuesday has Resistance, Diligence, Elegance, Ingenuity, Justice, Kindling
      expect(screen.getByText('Resistance')).toBeInTheDocument();
      expect(screen.getByText('Diligence')).toBeInTheDocument();
    });

    it('shows Wednesday/Saturday domains on Wednesday', () => {
      // Mock Wednesday
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

    it('shows info message on non-Sunday days when no characters', () => {
      renderWidget();

      expect(screen.getByText(/add characters to see personalized recommendations/i)).toBeInTheDocument();
    });

    it('shows rotation info when characters are processed', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 5,
      });

      renderWidget();

      expect(screen.getByText(/5 team members analyzed/i)).toBeInTheDocument();
      expect(screen.getByText(/talent book domains rotate daily/i)).toBeInTheDocument();
    });

    it('does not show info text on Sunday', () => {
      vi.setSystemTime(new Date('2024-01-07T12:00:00')); // Sunday

      renderWidget();

      expect(screen.queryByText(/talent book domains rotate daily/i)).not.toBeInTheDocument();
    });
  });

  describe('character-specific recommendations', () => {
    beforeEach(() => {
      const mockDate = new Date('2024-01-08T12:00:00'); // Monday
      vi.setSystemTime(mockDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows loading state while fetching character data', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: true,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

      renderWidget();

      // Should show loading skeleton
      expect(screen.getByText("Today's Farming")).toBeInTheDocument();
      // The skeleton has animate-pulse class
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('shows personalized recommendations when characters have book needs', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map([
          ['Freedom', [{ characterKey: 'Venti', characterLevel: 90, bookSeries: 'Freedom', region: 'Mondstadt', availableToday: true }]],
        ]),
        availableTodayWithCharacters: [
          {
            series: 'Freedom',
            region: 'Mondstadt',
            characters: [
              { characterKey: 'Venti', characterLevel: 90, bookSeries: 'Freedom', region: 'Mondstadt', availableToday: true },
              { characterKey: 'Amber', characterLevel: 80, bookSeries: 'Freedom', region: 'Mondstadt', availableToday: true },
            ],
          },
        ],
        notAvailableToday: [],
        totalCharactersProcessed: 2,
      });

      renderWidget();

      // Should show personalized header
      expect(screen.getByText(/your characters need/i)).toBeInTheDocument();
      // Should show the book series
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      // Should show character names
      expect(screen.getByText(/Venti, Amber/i)).toBeInTheDocument();
    });

    it('shows message when no characters need today\'s books', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map([
          ['Ballad', [{ characterKey: 'Barbara', characterLevel: 80, bookSeries: 'Ballad', region: 'Mondstadt', availableToday: false }]],
        ]),
        availableTodayWithCharacters: [],
        notAvailableToday: [
          {
            series: 'Ballad',
            region: 'Mondstadt',
            characters: [{ characterKey: 'Barbara', characterLevel: 80, bookSeries: 'Ballad', region: 'Mondstadt', availableToday: false }],
            nextAvailableDay: 'Wednesday',
          },
        ],
        totalCharactersProcessed: 1,
      });

      renderWidget();

      // Should show message about no books needed today
      expect(screen.getByText(/none of your team members need today's books/i)).toBeInTheDocument();
      // Should show next farming day
      expect(screen.getByText(/wednesday/i)).toBeInTheDocument();
    });

    it('shows wait for section when some books not available today', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map([
          ['Freedom', [{ characterKey: 'Venti', characterLevel: 90, bookSeries: 'Freedom', region: 'Mondstadt', availableToday: true }]],
          ['Ballad', [{ characterKey: 'Barbara', characterLevel: 80, bookSeries: 'Ballad', region: 'Mondstadt', availableToday: false }]],
        ]),
        availableTodayWithCharacters: [
          {
            series: 'Freedom',
            region: 'Mondstadt',
            characters: [{ characterKey: 'Venti', characterLevel: 90, bookSeries: 'Freedom', region: 'Mondstadt', availableToday: true }],
          },
        ],
        notAvailableToday: [
          {
            series: 'Ballad',
            region: 'Mondstadt',
            characters: [{ characterKey: 'Barbara', characterLevel: 80, bookSeries: 'Ballad', region: 'Mondstadt', availableToday: false }],
            nextAvailableDay: 'Wednesday',
          },
        ],
        totalCharactersProcessed: 2,
      });

      renderWidget();

      // Should show recommendations for today
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      // Should show "wait for" section
      expect(screen.getByText(/wait for/i)).toBeInTheDocument();
      expect(screen.getByText(/Ballad/i)).toBeInTheDocument();
    });
  });
});
