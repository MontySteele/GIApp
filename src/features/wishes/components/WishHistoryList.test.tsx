import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WishHistoryList } from './WishHistoryList';
import type { WishHistoryItem } from '../domain/wishAnalyzer';

describe('WishHistoryList', () => {
  describe('Initial render', () => {
    it('should render empty state when no history', () => {
      render(<WishHistoryList history={[]} />);

      expect(screen.getByText(/no wish history/i)).toBeInTheDocument();
    });

    it('should render wish history items', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01T12:00:00Z', banner: 'character' },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01T11:00:00Z', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      expect(screen.getByText('Furina')).toBeInTheDocument();
      expect(screen.getByText('Fischl')).toBeInTheDocument();
    });
  });

  describe('Rarity indicators', () => {
    it('should show 5-star items with gold styling', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      const item = screen.getByText('Furina').closest('div');
      expect(item?.className).toMatch(/gold|yellow|amber/i);
    });

    it('should show 4-star items with purple styling', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      const item = screen.getByText('Fischl').closest('div');
      expect(item?.className).toMatch(/purple|violet/i);
    });

    it('should show 3-star items with blue styling', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Cool Steel', rarity: 3, itemType: 'weapon', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      const item = screen.getByText('Cool Steel').closest('div');
      expect(item?.className).toMatch(/blue/i);
    });
  });

  describe('Item details', () => {
    it('should show item type', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      // Query within the list item
      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveTextContent(/character/i);
    });

    it('should show pull time', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01T12:00:00Z', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
    });

    it('should show banner type', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      // Query within the list item
      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveTextContent(/character.*event/i);
    });
  });

  describe('Featured indicator', () => {
    it('should highlight featured items', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: true },
      ];
      render(<WishHistoryList history={history} />);

      expect(screen.getByText(/featured/i)).toBeInTheDocument();
    });

    it('should show lost 50/50 indicator', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Diluc', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character', isFeatured: false },
      ];
      render(<WishHistoryList history={history} />);

      expect(screen.getByText(/lost.*50\/50/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should show filter by banner type', () => {
      render(<WishHistoryList history={[]} />);

      expect(screen.getByLabelText(/filter.*banner/i)).toBeInTheDocument();
    });

    it('should filter by character banner', async () => {
      const user = userEvent.setup();
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Aqua Simulacra', rarity: 5, itemType: 'weapon', time: '2024-01-01', banner: 'weapon' },
      ];
      render(<WishHistoryList history={history} />);

      const filter = screen.getByLabelText(/filter.*banner/i);
      await user.selectOptions(filter, 'character');

      expect(screen.getByText('Furina')).toBeInTheDocument();
      expect(screen.queryByText('Aqua Simulacra')).not.toBeInTheDocument();
    });

    it('should show all banners by default', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Aqua Simulacra', rarity: 5, itemType: 'weapon', time: '2024-01-01', banner: 'weapon' },
      ];
      render(<WishHistoryList history={history} />);

      expect(screen.getByText('Furina')).toBeInTheDocument();
      expect(screen.getByText('Aqua Simulacra')).toBeInTheDocument();
    });
  });

  describe('Filtering by rarity', () => {
    it('should show filter by rarity', () => {
      render(<WishHistoryList history={[]} />);

      expect(screen.getByLabelText(/filter.*rarity/i)).toBeInTheDocument();
    });

    it('should filter to show only 5-stars', async () => {
      const user = userEvent.setup();
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-01', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      const filter = screen.getByLabelText(/filter.*rarity/i);
      await user.selectOptions(filter, '5');

      expect(screen.getByText('Furina')).toBeInTheDocument();
      expect(screen.queryByText('Fischl')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by newest first by default', () => {
      const history: WishHistoryItem[] = [
        { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2024-01-01', banner: 'character' },
        { id: '2', name: 'Fischl', rarity: 4, itemType: 'character', time: '2024-01-02', banner: 'character' },
      ];
      render(<WishHistoryList history={history} />);

      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Fischl'); // Newer pull first
      expect(items[1]).toHaveTextContent('Furina');
    });
  });

  describe('Pagination', () => {
    it('should show pagination for long lists', () => {
      const history: WishHistoryItem[] = Array(100).fill(null).map((_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        rarity: 3,
        itemType: 'weapon' as const,
        time: '2024-01-01',
        banner: 'character' as const,
      }));
      render(<WishHistoryList history={history} />);

      const pageTexts = screen.getAllByText(/page/i);
      expect(pageTexts.length).toBeGreaterThan(0);
    });

    it('should limit items per page to 20', () => {
      const history: WishHistoryItem[] = Array(100).fill(null).map((_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        rarity: 3,
        itemType: 'weapon' as const,
        time: '2024-01-01',
        banner: 'character' as const,
      }));
      render(<WishHistoryList history={history} />);

      const items = screen.getAllByRole('listitem');
      expect(items.length).toBeLessThanOrEqual(20);
    });
  });
});
