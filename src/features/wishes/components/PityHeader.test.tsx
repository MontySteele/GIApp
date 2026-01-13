import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PityHeader from './PityHeader';
import * as useCurrentPityModule from '../hooks/useCurrentPity';
import type { BannerPitySnapshot } from '../selectors/pitySelectors';

vi.mock('../hooks/useCurrentPity');

const mockPityState: Record<string, BannerPitySnapshot> = {
  character: {
    banner: 'character',
    pity: 45,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
  },
  weapon: {
    banner: 'weapon',
    pity: 30,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
    fatePoints: 1,
  },
  standard: {
    banner: 'standard',
    pity: 20,
    guaranteed: false,
    radiantStreak: 0,
    radianceActive: false,
  },
  chronicled: {
    banner: 'chronicled',
    pity: 10,
    guaranteed: true,
    radiantStreak: 0,
    radianceActive: false,
  },
};

describe('PityHeader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render loading state when pity data is not available', () => {
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(null);

    render(<PityHeader />);

    expect(screen.getByText(/loading pity state/i)).toBeInTheDocument();
  });

  it('should render all four banner pity states', () => {
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(mockPityState as any);

    render(<PityHeader />);

    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('Weapon')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Chronicled')).toBeInTheDocument();
  });

  it('should display pity counts for each banner', () => {
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(mockPityState as any);

    render(<PityHeader />);

    expect(screen.getByText('45/90')).toBeInTheDocument(); // Character
    expect(screen.getByText('30/80')).toBeInTheDocument(); // Weapon
    expect(screen.getByText('20/90')).toBeInTheDocument(); // Standard
    expect(screen.getByText('10/90')).toBeInTheDocument(); // Chronicled
  });

  it('should show guaranteed badge when applicable', () => {
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(mockPityState as any);

    render(<PityHeader />);

    // Chronicled has guaranteed: true
    expect(screen.getByText('Guaranteed')).toBeInTheDocument();
  });

  it('should show fate points for weapon banner', () => {
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(mockPityState as any);

    render(<PityHeader />);

    expect(screen.getByText('1/2 EP')).toBeInTheDocument();
  });

  it('should show radiance badge when radiance is active', () => {
    const stateWithRadiance = {
      ...mockPityState,
      character: {
        ...mockPityState.character,
        radianceActive: true,
      },
    };
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(stateWithRadiance as any);

    render(<PityHeader />);

    expect(screen.getByText('Radiance')).toBeInTheDocument();
  });

  it('should highlight near-pity banners', () => {
    const stateNearPity = {
      ...mockPityState,
      character: {
        ...mockPityState.character,
        pity: 75, // Near pity (within 20 of 90)
      },
    };
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(stateNearPity as any);

    render(<PityHeader />);

    expect(screen.getByText('75/90')).toBeInTheDocument();
  });

  it('should not show fate points badge when fate points are 0', () => {
    const stateNoFP = {
      ...mockPityState,
      weapon: {
        ...mockPityState.weapon,
        fatePoints: 0,
      },
    };
    vi.spyOn(useCurrentPityModule, 'useAllCurrentPity').mockReturnValue(stateNoFP as any);

    render(<PityHeader />);

    expect(screen.queryByText(/\/2 EP/)).not.toBeInTheDocument();
  });
});
