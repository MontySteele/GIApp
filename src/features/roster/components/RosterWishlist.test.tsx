import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RosterWishlist from './RosterWishlist';
import { useWishlistStore } from '@/stores/wishlistStore';

// Mock the wishlist store
vi.mock('@/stores/wishlistStore', () => {
  const mockCharacters = [
    { key: 'Furina', targetGoal: 'comfortable' as const, addedAt: '2026-01-01', notes: '' },
    { key: 'Alhaitham', targetGoal: 'full' as const, addedAt: '2026-01-02', notes: '' },
  ];
  const addCharacter = vi.fn();
  const removeCharacter = vi.fn();
  const updateCharacter = vi.fn();

  return {
    useWishlistStore: vi.fn((selector: (state: unknown) => unknown) => {
      const state = {
        characters: mockCharacters,
        addCharacter,
        removeCharacter,
        updateCharacter,
      };
      return selector(state);
    }),
  };
});

vi.mock('@/lib/constants/characterList', () => ({
  ALL_CHARACTERS: [
    { key: 'Furina', name: 'Furina', rarity: 5, element: 'Hydro', weapon: 'Sword' },
    { key: 'Alhaitham', name: 'Alhaitham', rarity: 5, element: 'Dendro', weapon: 'Sword' },
    { key: 'Nahida', name: 'Nahida', rarity: 5, element: 'Dendro', weapon: 'Catalyst' },
    { key: 'Bennett', name: 'Bennett', rarity: 4, element: 'Pyro', weapon: 'Sword' },
  ],
}));

describe('RosterWishlist', () => {
  const ownedKeys = ['Bennett'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wishlist header with count', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // badge count
  });

  it('renders wishlisted characters', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);
    expect(screen.getByText('Furina')).toBeInTheDocument();
    expect(screen.getByText('Alhaitham')).toBeInTheDocument();
  });

  it('shows goal labels for each character', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);
    expect(screen.getByText('Comfortable')).toBeInTheDocument();
    expect(screen.getByText('Full Build')).toBeInTheDocument();
  });

  it('has remove buttons for each character', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);
    const removeButtons = screen.getAllByLabelText(/Remove .* from wishlist/);
    expect(removeButtons).toHaveLength(2);
  });

  it('renders search input for adding characters', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);
    expect(screen.getByPlaceholderText('Add character to wishlist...')).toBeInTheDocument();
  });

  it('collapses and expands', () => {
    render(<RosterWishlist ownedKeys={ownedKeys} />);

    // Should start expanded (has characters)
    expect(screen.getByText('Furina')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('Wishlist'));
    expect(screen.queryByText('Furina')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Wishlist'));
    expect(screen.getByText('Furina')).toBeInTheDocument();
  });
});
