import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishStatistics } from './WishStatistics';
import type { BannerStats } from '../domain/wishAnalyzer';

describe('WishStatistics', () => {
  const mockStats: BannerStats = {
    totalPulls: 100,
    fiveStars: 2,
    fourStars: 15,
    threeStars: 83,
    fiveStarRate: 2,
    fourStarRate: 15,
    averageFiveStarPity: 65,
    averageFourStarPity: 8,
    fiftyFiftyWon: 1,
    fiftyFiftyLost: 1,
    fiftyFiftyWinRate: 50,
  };

  describe('Initial render', () => {
    it('should render statistics cards', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/total pulls/i)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should show empty state with no pulls', () => {
      const emptyStats: BannerStats = {
        totalPulls: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        fiveStarRate: 0,
        fourStarRate: 0,
        averageFiveStarPity: 0,
        averageFourStarPity: 0,
        fiftyFiftyWon: 0,
        fiftyFiftyLost: 0,
        fiftyFiftyWinRate: 0,
      };
      render(<WishStatistics stats={emptyStats} bannerType="character" />);

      expect(screen.getByText(/no wish data/i)).toBeInTheDocument();
    });
  });

  describe('Pull counts', () => {
    it('should display 5-star count', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/5.*star.*pulls/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display 4-star count', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/4.*star.*pulls/i)).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display 3-star count', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/3.*star/i)).toBeInTheDocument();
      expect(screen.getByText('83')).toBeInTheDocument();
    });
  });

  describe('Rates', () => {
    it('should display 5-star rate as percentage', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/5.*star.*rate/i)).toBeInTheDocument();
      expect(screen.getByText(/2%/)).toBeInTheDocument();
    });

    it('should display 4-star rate as percentage', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/4.*star.*rate/i)).toBeInTheDocument();
      expect(screen.getByText(/15%/)).toBeInTheDocument();
    });

    it('should highlight above-average 5-star rate', () => {
      const luckyStats: BannerStats = {
        ...mockStats,
        fiveStarRate: 2.5, // Above expected 1.6%
      };
      render(<WishStatistics stats={luckyStats} bannerType="character" />);

      const rateElement = screen.getByText(/2\.5%/);
      expect(rateElement.className).toMatch(/green|success/i);
    });

    it('should highlight below-average 5-star rate', () => {
      const unluckyStats: BannerStats = {
        ...mockStats,
        fiveStarRate: 1.0, // Below expected 1.6%
      };
      render(<WishStatistics stats={unluckyStats} bannerType="character" />);

      const rateElement = screen.getByText(/1%/);
      expect(rateElement.className).toMatch(/red|danger/i);
    });

    it('should round long decimal rates for display', () => {
      const longDecimalStats: BannerStats = {
        ...mockStats,
        fiveStarRate: 1.23456,
        fourStarRate: 13.94,
        fiftyFiftyWinRate: 47.777,
      };
      render(<WishStatistics stats={longDecimalStats} bannerType="character" />);

      expect(screen.getByText('1.2%')).toBeInTheDocument();
      expect(screen.getByText('13.9%')).toBeInTheDocument();
      expect(screen.getByText('47.8%')).toBeInTheDocument();
      expect(screen.queryByText(/1\.234/)).not.toBeInTheDocument();
    });
  });

  describe('Average pity', () => {
    it('should display average 5-star pity', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/average.*5.*star.*pity/i)).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('should display average 4-star pity', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/average.*4.*star.*pity/i)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should show N/A when no 5-stars pulled', () => {
      const noFiveStarStats: BannerStats = {
        ...mockStats,
        fiveStars: 0,
        averageFiveStarPity: 0,
      };
      render(<WishStatistics stats={noFiveStarStats} bannerType="character" />);

      expect(screen.getByText(/n\/a/i)).toBeInTheDocument();
    });
  });

  describe('50/50 statistics', () => {
    it('should display 50/50 win rate', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/50\/50.*win.*rate/i)).toBeInTheDocument();
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('should display won and lost counts', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/won.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/lost.*1/i)).toBeInTheDocument();
    });

    it('should not show 50/50 stats for weapon banner', () => {
      render(<WishStatistics stats={mockStats} bannerType="weapon" />);

      expect(screen.queryByText(/50\/50/i)).not.toBeInTheDocument();
    });

    it('should not show 50/50 stats for standard banner', () => {
      render(<WishStatistics stats={mockStats} bannerType="standard" />);

      expect(screen.queryByText(/50\/50/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual presentation', () => {
    it('should use cards for statistics', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display stats in a grid layout', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      const container = screen.getByRole('region', { name: /statistics/i });
      expect(container.className).toMatch(/grid/i);
    });
  });

  describe('Banner type specific stats', () => {
    it('should show character-specific labels for character banner', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/character.*event/i)).toBeInTheDocument();
    });

    it('should show weapon-specific labels for weapon banner', () => {
      render(<WishStatistics stats={mockStats} bannerType="weapon" />);

      expect(screen.getByText(/weapon.*event/i)).toBeInTheDocument();
    });
  });

  describe('Comparison to expected rates', () => {
    it('should show comparison to expected 5-star rate', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/expected.*1\.6%/i)).toBeInTheDocument();
    });

    it('should show comparison to expected 4-star rate', () => {
      render(<WishStatistics stats={mockStats} bannerType="character" />);

      expect(screen.getByText(/expected.*13%/i)).toBeInTheDocument();
    });
  });
});
