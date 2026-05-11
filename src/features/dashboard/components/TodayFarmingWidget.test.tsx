import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TodayFarmingWidget from './TodayFarmingWidget';

const mocks = vi.hoisted(() => ({
  dataFreshness: {
    status: 'fresh',
    latestImport: null,
    daysSinceImport: 0,
    label: 'Account data current',
    detail: 'Last Irminsul import was today.',
  },
}));

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

vi.mock('@/features/sync', () => ({
  useAccountDataFreshness: () => mocks.dataFreshness,
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
    mocks.dataFreshness = {
      status: 'fresh',
      latestImport: null,
      daysSinceImport: 0,
      label: 'Account data current',
      detail: 'Last Irminsul import was today.',
    };
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

    it('shows campaign link', () => {
      renderWidget();

      // The campaign link is an icon-only link (ArrowRight svg, no text)
      const links = screen.getAllByRole('link');
      const campaignLink = links.find(link => link.getAttribute('href') === '/campaigns');
      expect(campaignLink).toBeDefined();
    });

    it('shows a compact freshness prompt when account data is stale', () => {
      mocks.dataFreshness = {
        status: 'stale',
        latestImport: null,
        daysSinceImport: 12,
        label: 'Refresh account data',
        detail: 'Last Irminsul import was 12 days ago.',
      };

      renderWidget();

      expect(screen.getByText('Refresh account data')).toBeInTheDocument();
      expect(screen.getByText(/today's farming recommendations/i)).toBeInTheDocument();
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
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Sunday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

      renderWidget();

      expect(screen.getByText(/all domains are available/i)).toBeInTheDocument();
    });

    it('shows Monday/Thursday domains on Monday', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

      renderWidget();

      // Monday has Freedom, Prosperity, Transience, Admonition, Equity, Contention
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Prosperity')).toBeInTheDocument();
    });

    it('shows Tuesday/Friday domains on Tuesday', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Tuesday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

      renderWidget();

      // Tuesday has Resistance, Diligence, Elegance, Ingenuity, Justice, Kindling
      expect(screen.getByText('Resistance')).toBeInTheDocument();
      expect(screen.getByText('Diligence')).toBeInTheDocument();
    });

    it('shows Wednesday/Saturday domains on Wednesday', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Wednesday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

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

      expect(screen.getByText(/create or activate a target to see focused recommendations/i)).toBeInTheDocument();
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

      expect(screen.getByText(/5 target characters analyzed/i)).toBeInTheDocument();
      expect(screen.getByText(/talent book domains rotate daily/i)).toBeInTheDocument();
    });

    it('does not show info text on Sunday', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Sunday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [],
        notAvailableToday: [],
        totalCharactersProcessed: 0,
      });

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
      expect(screen.getByText(/target characters need/i)).toBeInTheDocument();
      // Should show the book series
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      // Should show character names
      expect(screen.getByText(/Venti, Amber/i)).toBeInTheDocument();
    });

    it('truncates long campaign target labels for narrow layouts', () => {
      vi.mocked(useTodayFarming).mockReturnValue({
        today: 'Monday',
        isLoading: false,
        charactersByBook: new Map(),
        availableTodayWithCharacters: [
          {
            series: 'Freedom',
            region: 'Mondstadt',
            characters: [
              {
                characterKey: 'Venti',
                characterLevel: 90,
                bookSeries: 'Freedom',
                region: 'Mondstadt',
                availableToday: true,
                campaignName: 'A Very Long Campaign Name For Mobile',
              },
            ],
          },
        ],
        notAvailableToday: [],
        totalCharactersProcessed: 1,
      });

      renderWidget();

      expect(screen.getByText(/Venti \(A Very Long Campaign Name For Mobile\)/i)).toHaveClass('truncate');
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
      expect(screen.getByText(/none of your target characters need today's books/i)).toBeInTheDocument();
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
