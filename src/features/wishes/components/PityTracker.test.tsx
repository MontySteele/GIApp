import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PityTracker } from './PityTracker';
import type { PityState } from '../domain/wishAnalyzer';

describe('PityTracker', () => {
  const mockPityState: PityState = {
    fiveStarPity: 65,
    fourStarPity: 8,
    guaranteed: false,
  };

  describe('Initial render', () => {
    it('should render pity state', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      expect(screen.getByText(/5.*star.*pity/i)).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('should render 4-star pity', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      expect(screen.getByText(/4.*star.*pity/i)).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('Guaranteed status', () => {
    it('should show guaranteed indicator when true', () => {
      const guaranteedState: PityState = {
        ...mockPityState,
        guaranteed: true,
      };
      render(<PityTracker pityState={guaranteedState} bannerType="character" />);

      expect(screen.getByText(/guaranteed/i)).toBeInTheDocument();
    });

    it('should not show guaranteed for weapon banner', () => {
      const guaranteedState: PityState = {
        ...mockPityState,
        guaranteed: true,
      };
      render(<PityTracker pityState={guaranteedState} bannerType="weapon" />);

      expect(screen.queryByText(/guaranteed/i)).not.toBeInTheDocument();
    });

    it('should show 50/50 indicator when not guaranteed', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      expect(screen.getByText(/50\/50/i)).toBeInTheDocument();
    });
  });

  describe('Visual indicators', () => {
    it('should show progress bar for 5-star pity', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar).toBeInTheDocument();
    });

    it('should calculate correct progress percentage', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      // 65/90 = 72.2%
      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(progressBar).toHaveAttribute('aria-valuemax', '90');
    });

    it('should show soft pity warning', () => {
      const softPityState: PityState = {
        fiveStarPity: 75, // Above soft pity threshold
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={softPityState} bannerType="character" />);

      expect(screen.getByText(/soft pity/i)).toBeInTheDocument();
    });

    it('should show hard pity warning', () => {
      const hardPityState: PityState = {
        fiveStarPity: 89, // At hard pity
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={hardPityState} bannerType="character" />);

      expect(screen.getByText(/hard pity|guaranteed next/i)).toBeInTheDocument();
    });
  });

  describe('Banner type differences', () => {
    it('should use 90 pity for character banner', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar).toHaveAttribute('aria-valuemax', '90');
    });

    it('should use 77 pity for weapon banner', () => {
      render(<PityTracker pityState={mockPityState} bannerType="weapon" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar).toHaveAttribute('aria-valuemax', '77');
    });

    it('should use 90 pity for standard banner', () => {
      render(<PityTracker pityState={mockPityState} bannerType="standard" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar).toHaveAttribute('aria-valuemax', '90');
    });
  });

  describe('Pity countdown', () => {
    it('should show pulls until soft pity', () => {
      const earlyPity: PityState = {
        fiveStarPity: 50,
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={earlyPity} bannerType="character" />);

      // Soft pity at 74, current 50, so 24 pulls away
      expect(screen.getByText(/24.*pulls.*until.*soft pity/i)).toBeInTheDocument();
    });

    it('should show pulls until hard pity', () => {
      const midPity: PityState = {
        fiveStarPity: 65,
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={midPity} bannerType="character" />);

      // Hard pity at 90, current 65, so 25 pulls away
      expect(screen.getByText(/25.*pulls.*until.*hard pity/i)).toBeInTheDocument();
    });
  });

  describe('Color coding', () => {
    it('should use green for low pity', () => {
      const lowPity: PityState = {
        fiveStarPity: 20,
        fourStarPity: 3,
        guaranteed: false,
      };
      render(<PityTracker pityState={lowPity} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar.className).toMatch(/green/i);
    });

    it('should use yellow for soft pity range', () => {
      const softPity: PityState = {
        fiveStarPity: 75,
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={softPity} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar.className).toMatch(/yellow|amber|orange/i);
    });

    it('should use red for near hard pity', () => {
      const nearHardPity: PityState = {
        fiveStarPity: 88,
        fourStarPity: 5,
        guaranteed: false,
      };
      render(<PityTracker pityState={nearHardPity} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /5.*star/i });
      expect(progressBar.className).toMatch(/red/i);
    });
  });

  describe('4-star pity indicator', () => {
    it('should show progress bar for 4-star pity', () => {
      render(<PityTracker pityState={mockPityState} bannerType="character" />);

      const progressBar = screen.getByRole('progressbar', { name: /4.*star/i });
      expect(progressBar).toBeInTheDocument();
    });

    it('should warn when approaching 4-star hard pity', () => {
      const nearFourStarPity: PityState = {
        fiveStarPity: 65,
        fourStarPity: 9, // Near 4-star pity at 10
        guaranteed: false,
      };
      render(<PityTracker pityState={nearFourStarPity} bannerType="character" />);

      expect(screen.getByText(/4.*star.*guaranteed.*next/i)).toBeInTheDocument();
    });
  });
});
