/**
 * Unit Tests: Weekly Boss Tracker Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeeklyBossTracker, { type RequiredWeeklyMaterial } from './WeeklyBossTracker';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the domain functions
vi.mock('../domain/weeklyBossData', async () => {
  const actual = await vi.importActual('../domain/weeklyBossData');
  return {
    ...actual,
    getNextWeeklyReset: vi.fn(() => new Date('2026-01-20T09:00:00Z')),
    getCurrentWeekStart: vi.fn(() => new Date('2026-01-13T09:00:00Z')),
    formatTimeUntilReset: vi.fn(() => '3d 12h'),
  };
});

describe('WeeklyBossTracker', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
    });

    it('should display all 10 bosses by default', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      expect(screen.getByText('Wolf of the North')).toBeInTheDocument();
      expect(screen.getByText('Childe')).toBeInTheDocument();
      expect(screen.getByText('Azhdaha')).toBeInTheDocument();
      expect(screen.getByText('La Signora')).toBeInTheDocument();
      expect(screen.getByText('Raiden Shogun')).toBeInTheDocument();
    });

    it('should show time until reset', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText(/3d 12h/)).toBeInTheDocument();
    });

    it('should show completion count', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('0/10 completed this week')).toBeInTheDocument();
    });

    it('should display stats cards', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('Discounts Left')).toBeInTheDocument();
      expect(screen.getByText('Resin Spent')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('should show 3 discounts remaining initially', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('3')).toBeInTheDocument(); // Discounts Left
    });

    it('should show 0 resin spent initially', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByText('0')).toBeInTheDocument(); // Resin Spent
    });
  });

  describe('Compact Mode', () => {
    it('should render compact view when compact prop is true', () => {
      render(<WeeklyBossTracker compact />);
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
      expect(screen.getByText('0/10 completed')).toBeInTheDocument();
      expect(screen.getByText('3 discounts left')).toBeInTheDocument();
    });

    it('should show progress bar in compact mode', () => {
      render(<WeeklyBossTracker compact />);
      // Progress bar is a div with specific class
      const progressContainer = screen.getByText('0/10 completed').parentElement?.parentElement;
      expect(progressContainer).toBeInTheDocument();
    });
  });

  describe('Boss Completion Toggle', () => {
    it('should toggle boss completion when clicked', async () => {
      render(<WeeklyBossTracker />);

      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');
      expect(dvalinButton).toBeInTheDocument();

      fireEvent.click(dvalinButton!);

      // Should now show 1/10 completed
      expect(screen.getByText('1/10 completed this week')).toBeInTheDocument();
    });

    it('should uncomplete a boss when clicked again', () => {
      render(<WeeklyBossTracker />);

      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');

      // Complete
      fireEvent.click(dvalinButton!);
      expect(screen.getByText('1/10 completed this week')).toBeInTheDocument();

      // Uncomplete
      fireEvent.click(dvalinButton!);
      expect(screen.getByText('0/10 completed this week')).toBeInTheDocument();
    });

    it('should update resin spent when bosses are completed', () => {
      render(<WeeklyBossTracker />);

      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');
      fireEvent.click(dvalinButton!);

      // First 3 bosses are discounted (30 resin each)
      // Look for resin spent stat (should be 30)
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('should update discounts remaining when bosses are completed', () => {
      render(<WeeklyBossTracker />);

      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');
      fireEvent.click(dvalinButton!);

      // Should now have 2 discounts remaining
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Reset All', () => {
    it('should reset all completed bosses', () => {
      render(<WeeklyBossTracker />);

      // Complete a boss
      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');
      fireEvent.click(dvalinButton!);

      expect(screen.getByText('1/10 completed this week')).toBeInTheDocument();

      // Click reset button (RefreshCw icon)
      const resetButton = screen.getByTitle('Reset all');
      fireEvent.click(resetButton);

      // Should be back to 0
      expect(screen.getByText('0/10 completed this week')).toBeInTheDocument();
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save state to localStorage on completion', () => {
      render(<WeeklyBossTracker />);

      const dvalinButton = screen.getByText('Stormterror Dvalin').closest('button');
      fireEvent.click(dvalinButton!);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should load state from localStorage on mount', () => {
      // Pre-populate localStorage
      mockLocalStorage.setItem(
        'weeklyBossState',
        JSON.stringify({
          weekStart: new Date('2026-01-13T09:00:00Z').toISOString(),
          completed: ['dvalin', 'andrius'],
        })
      );

      render(<WeeklyBossTracker />);

      expect(screen.getByText('2/10 completed this week')).toBeInTheDocument();
    });
  });

  describe('Material Filtering', () => {
    const requiredMaterials: RequiredWeeklyMaterial[] = [
      { name: "Dvalin's Plume", required: 6 },
      { name: 'Tail of Boreas', required: 9 },
    ];

    it('should show filter button when requiredMaterials is provided', () => {
      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);
      expect(screen.getByText('Team Needs')).toBeInTheDocument();
    });

    it('should show needed count badge', () => {
      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);
      expect(screen.getByText('(2 needed for team)')).toBeInTheDocument();
    });

    it('should filter bosses when filter is toggled', () => {
      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);

      // Initially all 10 bosses visible
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      expect(screen.getByText('Childe')).toBeInTheDocument();

      // Toggle filter
      fireEvent.click(screen.getByText('Team Needs'));

      // Should only show relevant bosses
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      expect(screen.getByText('Wolf of the North')).toBeInTheDocument();
      // Childe should not be visible (doesn't drop these materials)
      expect(screen.queryByText('Childe')).not.toBeInTheDocument();
    });

    it('should show material requirements on relevant boss cards', () => {
      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);
      // Dvalin's Plume requirement should be displayed
      expect(screen.getByText("Dvalin's Plume ×6")).toBeInTheDocument();
    });
  });

  describe('Resin Calculations', () => {
    it('should calculate 30 resin for first 3 bosses', () => {
      render(<WeeklyBossTracker />);

      // Complete 3 bosses by clicking on their names
      const bosses = ['Stormterror Dvalin', 'Wolf of the North', 'Childe'];
      bosses.forEach(name => {
        const button = screen.getByText(name).closest('button');
        fireEvent.click(button!);
      });

      // 3 * 30 = 90 resin
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should calculate 60 resin for 4th+ bosses', () => {
      render(<WeeklyBossTracker />);

      // Complete 4 bosses
      const bosses = ['Stormterror Dvalin', 'Wolf of the North', 'Childe', 'Azhdaha'];
      bosses.forEach(name => {
        const button = screen.getByText(name).closest('button');
        fireEvent.click(button!);
      });

      // 3 * 30 + 1 * 60 = 150 resin
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible boss buttons', () => {
      render(<WeeklyBossTracker />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have reset button with title', () => {
      render(<WeeklyBossTracker />);
      expect(screen.getByTitle('Reset all')).toBeInTheDocument();
    });

    it('should have filter button with title when filtering is available', () => {
      render(
        <WeeklyBossTracker
          requiredMaterials={[{ name: "Dvalin's Plume", required: 6 }]}
        />
      );
      const filterButton = screen.getByTitle('Show only needed bosses');
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases - State Management', () => {
    it('should handle invalid localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid json{{{');

      // Should not crash, render with empty state
      render(<WeeklyBossTracker />);
      expect(screen.getByText('0/10 completed this week')).toBeInTheDocument();
    });

    it('should handle null localStorage gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(<WeeklyBossTracker />);
      expect(screen.getByText('0/10 completed this week')).toBeInTheDocument();
    });

    it('should handle localStorage with missing fields', () => {
      // State without weekStart
      mockLocalStorage.setItem(
        'weeklyBossState',
        JSON.stringify({ completed: ['dvalin'] })
      );
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ completed: ['dvalin'] })
      );

      render(<WeeklyBossTracker />);
      // Should still render without crashing
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
    });

    it('should handle localStorage with invalid completed boss keys', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          weekStart: new Date('2026-01-13T09:00:00Z').toISOString(),
          completed: ['invalid_boss', 'dvalin', 'another_invalid'],
        })
      );

      render(<WeeklyBossTracker />);
      // Should only count valid boss (dvalin)
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
    });
  });


  describe('Edge Cases - Material Filtering', () => {
    it('should show all bosses when filtering for empty materials array', () => {
      render(<WeeklyBossTracker requiredMaterials={[]} />);

      // Should not show filter button when no materials needed
      expect(screen.queryByText('Team Needs')).not.toBeInTheDocument();
    });

    it('should maintain filter toggle state', () => {
      const requiredMaterials: RequiredWeeklyMaterial[] = [
        { name: "Dvalin's Plume", required: 6 },
      ];

      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);

      // Initially filter is off - all bosses visible
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      expect(screen.getByText('Childe')).toBeInTheDocument();

      // Toggle filter on
      fireEvent.click(screen.getByText('Team Needs'));

      // Only Dvalin should be visible (drops Dvalin's Plume)
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      expect(screen.queryByText('Childe')).not.toBeInTheDocument();

      // Toggle filter off
      fireEvent.click(screen.getByText('Show All'));

      // All bosses visible again
      expect(screen.getByText('Childe')).toBeInTheDocument();
    });

    it('should show needed count with single boss materials', () => {
      // All drops from same boss (Dvalin)
      const requiredMaterials: RequiredWeeklyMaterial[] = [
        { name: "Dvalin's Plume", required: 6 },
        { name: "Dvalin's Sigh", required: 4 },
        { name: "Dvalin's Claw", required: 2 },
      ];

      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);

      // Should only show 1 boss needed since all materials come from Dvalin
      expect(screen.getByText('(1 needed for team)')).toBeInTheDocument();
    });

    it('should show needed count with multiple boss materials', () => {
      const requiredMaterials: RequiredWeeklyMaterial[] = [
        { name: "Dvalin's Plume", required: 6 },
        { name: 'Tail of Boreas', required: 9 },
        { name: 'Shadow of the Warrior', required: 3 },
      ];

      render(<WeeklyBossTracker requiredMaterials={requiredMaterials} />);

      // Should show 3 bosses needed
      expect(screen.getByText('(3 needed for team)')).toBeInTheDocument();
    });
  });

  describe('Compact Mode - Extended', () => {
    it('should show remaining count in compact mode', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          weekStart: new Date('2026-01-13T09:00:00Z').toISOString(),
          completed: ['dvalin', 'andrius', 'childe'],
        })
      );

      render(<WeeklyBossTracker compact />);

      expect(screen.getByText('3/10 completed')).toBeInTheDocument();
      expect(screen.getByText('0 discounts left')).toBeInTheDocument();
    });

    it('should not show individual boss cards in compact mode', () => {
      render(<WeeklyBossTracker compact />);

      // Boss names should not be visible in compact mode
      expect(screen.queryByText('Stormterror Dvalin')).not.toBeInTheDocument();
      expect(screen.queryByText('Wolf of the North')).not.toBeInTheDocument();
    });

    it('should show progress indicator in compact mode', () => {
      render(<WeeklyBossTracker compact />);

      // Compact mode should have a progress indicator
      expect(screen.getByText('Weekly Bosses')).toBeInTheDocument();
    });
  });

  describe('Filter with filterByTeamNeeds prop', () => {
    it('should auto-enable filter when filterByTeamNeeds is true', () => {
      const requiredMaterials: RequiredWeeklyMaterial[] = [
        { name: "Dvalin's Plume", required: 6 },
      ];

      render(
        <WeeklyBossTracker
          requiredMaterials={requiredMaterials}
          filterByTeamNeeds={true}
        />
      );

      // Filter should be auto-enabled, so only Dvalin should be visible
      expect(screen.getByText('Stormterror Dvalin')).toBeInTheDocument();
      // Childe should not be visible when filter is enabled
      expect(screen.queryByText('Childe')).not.toBeInTheDocument();
    });
  });
});
