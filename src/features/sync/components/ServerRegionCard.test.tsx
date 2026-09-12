import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ServerRegionCard from './ServerRegionCard';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

describe('ServerRegionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Thursday 2026-01-15 12:00Z
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    useUIStore.setState({ settings: { ...DEFAULT_SETTINGS, serverRegion: 'na' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a labelled select with all four regions', () => {
    render(<ServerRegionCard />);
    const select = screen.getByLabelText('Server') as HTMLSelectElement;
    expect(select.value).toBe('na');
    const values = Array.from(select.options).map((option) => option.value);
    expect(values).toEqual(['na', 'eu', 'asia', 'tw']);
  });

  it('shows the next daily and weekly reset for the selected region', () => {
    render(<ServerRegionCard />);
    expect(screen.getByTestId('next-daily-reset')).toHaveAttribute(
      'dateTime',
      '2026-01-16T09:00:00.000Z'
    );
    expect(screen.getByTestId('next-weekly-reset')).toHaveAttribute(
      'dateTime',
      '2026-01-19T09:00:00.000Z'
    );
    expect(screen.getByText(/in 21h 0m/)).toBeInTheDocument();
  });

  it('updates the store and the reset preview when the region changes', () => {
    render(<ServerRegionCard />);
    fireEvent.change(screen.getByLabelText('Server'), { target: { value: 'asia' } });

    expect(useUIStore.getState().settings.serverRegion).toBe('asia');
    expect(screen.getByTestId('next-daily-reset')).toHaveAttribute(
      'dateTime',
      '2026-01-15T20:00:00.000Z'
    );
    expect(screen.getByTestId('next-weekly-reset')).toHaveAttribute(
      'dateTime',
      '2026-01-18T20:00:00.000Z'
    );
  });

  it('reflects an externally changed region', () => {
    render(<ServerRegionCard />);
    act(() => {
      useUIStore.getState().updateSettings({ serverRegion: 'eu' });
    });
    expect((screen.getByLabelText('Server') as HTMLSelectElement).value).toBe('eu');
    expect(screen.getByTestId('next-daily-reset')).toHaveAttribute(
      'dateTime',
      '2026-01-16T03:00:00.000Z'
    );
  });
});
