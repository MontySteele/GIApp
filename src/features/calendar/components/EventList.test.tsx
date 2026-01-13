/**
 * Unit Tests: EventList Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventList from './EventList';
import type { ParsedEvent } from '../domain/eventTypes';

// Helper to create mock events
function createMockEvent(overrides: Partial<ParsedEvent> = {}): ParsedEvent {
  return {
    id: 'event-1',
    name: 'Test Event',
    type: 'In-game',
    startDate: new Date('2026-01-10T00:00:00Z'),
    endDate: new Date('2026-01-20T00:00:00Z'),
    isActive: true,
    isUpcoming: false,
    timeUntilEnd: '7d 12h',
    ...overrides,
  };
}

describe('EventList Component', () => {
  describe('Rendering', () => {
    it('renders the title', () => {
      render(<EventList title="Test Events" events={[]} />);

      expect(screen.getByText('Test Events')).toBeInTheDocument();
    });

    it('displays event count', () => {
      const events = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText('2 events')).toBeInTheDocument();
    });

    it('displays event count as 0 events when empty', () => {
      render(<EventList title="Test Events" events={[]} />);

      expect(screen.getByText('0 events')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows default empty message when no events', () => {
      render(<EventList title="Test Events" events={[]} />);

      expect(screen.getByText('No events')).toBeInTheDocument();
    });

    it('shows custom empty message when provided', () => {
      render(
        <EventList
          title="Test Events"
          events={[]}
          emptyMessage="No active events found"
        />
      );

      expect(screen.getByText('No active events found')).toBeInTheDocument();
    });

    it('shows AlertCircle icon in empty state', () => {
      render(<EventList title="Test Events" events={[]} />);

      // AlertCircle icon should be present
      const alertIcon = document.querySelector('.lucide-circle-alert');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  describe('Event Cards', () => {
    it('renders event cards for all events', () => {
      const events = [
        createMockEvent({ id: '1', name: 'Event One' }),
        createMockEvent({ id: '2', name: 'Event Two' }),
        createMockEvent({ id: '3', name: 'Event Three' }),
      ];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText('Event One')).toBeInTheDocument();
      expect(screen.getByText('Event Two')).toBeInTheDocument();
      expect(screen.getByText('Event Three')).toBeInTheDocument();
    });

    it('displays event type badge', () => {
      const events = [createMockEvent({ type: 'Banner' })];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText('Banner')).toBeInTheDocument();
    });

    it('shows Active badge for active events', () => {
      const events = [createMockEvent({ isActive: true, isUpcoming: false })];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows time until end for active events', () => {
      const events = [
        createMockEvent({ isActive: true, timeUntilEnd: '3d 5h' }),
      ];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText(/Ends in/)).toBeInTheDocument();
      expect(screen.getByText('3d 5h')).toBeInTheDocument();
    });

    it('shows time until start for upcoming events', () => {
      const events = [
        createMockEvent({
          isActive: false,
          isUpcoming: true,
          timeUntilStart: '2d 8h',
        }),
      ];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText(/Starts in/)).toBeInTheDocument();
      expect(screen.getByText('2d 8h')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('limits displayed events to maxItems prop', () => {
      const events = [
        createMockEvent({ id: '1', name: 'Event One' }),
        createMockEvent({ id: '2', name: 'Event Two' }),
        createMockEvent({ id: '3', name: 'Event Three' }),
        createMockEvent({ id: '4', name: 'Event Four' }),
      ];
      render(<EventList title="Test Events" events={events} maxItems={2} />);

      expect(screen.getByText('Event One')).toBeInTheDocument();
      expect(screen.getByText('Event Two')).toBeInTheDocument();
      expect(screen.queryByText('Event Three')).not.toBeInTheDocument();
      expect(screen.queryByText('Event Four')).not.toBeInTheDocument();
    });

    it('shows "more events" indicator when truncated', () => {
      const events = [
        createMockEvent({ id: '1' }),
        createMockEvent({ id: '2' }),
        createMockEvent({ id: '3' }),
      ];
      render(<EventList title="Test Events" events={events} maxItems={2} />);

      expect(screen.getByText('+1 more events')).toBeInTheDocument();
    });

    it('does not show "more events" when all events displayed', () => {
      const events = [createMockEvent({ id: '1' }), createMockEvent({ id: '2' })];
      render(<EventList title="Test Events" events={events} maxItems={5} />);

      expect(screen.queryByText(/more events/)).not.toBeInTheDocument();
    });

    it('displays all events when maxItems not set', () => {
      const events = [
        createMockEvent({ id: '1', name: 'Event One' }),
        createMockEvent({ id: '2', name: 'Event Two' }),
        createMockEvent({ id: '3', name: 'Event Three' }),
      ];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.getByText('Event One')).toBeInTheDocument();
      expect(screen.getByText('Event Two')).toBeInTheDocument();
      expect(screen.getByText('Event Three')).toBeInTheDocument();
    });
  });

  describe('Event Links', () => {
    it('renders external link when event has link', () => {
      const events = [createMockEvent({ link: 'https://example.com' })];
      render(<EventList title="Test Events" events={events} />);

      const link = screen.getByTitle('View details');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not render link icon when event has no link', () => {
      const events = [createMockEvent({ link: undefined })];
      render(<EventList title="Test Events" events={events} />);

      expect(screen.queryByTitle('View details')).not.toBeInTheDocument();
    });
  });

  describe('Event Images', () => {
    it('renders event images when showImages is true', () => {
      const events = [
        createMockEvent({ img: 'https://example.com/image.png' }),
      ];
      render(<EventList title="Test Events" events={events} showImages />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/image.png');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('does not render images when showImages is false', () => {
      const events = [
        createMockEvent({ img: 'https://example.com/image.png' }),
      ];
      render(<EventList title="Test Events" events={events} showImages={false} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('does not render image placeholder when event has no image', () => {
      const events = [createMockEvent({ img: undefined })];
      render(<EventList title="Test Events" events={events} showImages />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Event Type Colors', () => {
    it('applies correct color class for Banner type', () => {
      const events = [createMockEvent({ type: 'Banner' })];
      render(<EventList title="Test Events" events={events} />);

      const badge = screen.getByText('Banner');
      expect(badge).toHaveClass('bg-amber-500/20');
    });

    it('applies correct color class for In-game type', () => {
      const events = [createMockEvent({ type: 'In-game' })];
      render(<EventList title="Test Events" events={events} />);

      const badge = screen.getByText('In-game');
      expect(badge).toHaveClass('bg-emerald-500/20');
    });

    it('applies correct color class for Maintenance type', () => {
      const events = [createMockEvent({ type: 'Maintenance' })];
      render(<EventList title="Test Events" events={events} />);

      const badge = screen.getByText('Maintenance');
      expect(badge).toHaveClass('bg-red-500/20');
    });
  });
});
