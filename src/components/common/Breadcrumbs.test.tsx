/**
 * Unit Tests: Breadcrumbs Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Breadcrumbs', () => {
  describe('Basic Rendering', () => {
    it('renders breadcrumb items', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[
            { label: 'Roster', path: '/roster' },
            { label: 'Character', path: '/roster/1' },
          ]}
        />
      );

      expect(screen.getByText('Roster')).toBeInTheDocument();
      expect(screen.getByText('Character')).toBeInTheDocument();
    });

    it('renders home link by default', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Roster', path: '/roster' }]} />
      );

      expect(screen.getByLabelText('Home')).toBeInTheDocument();
    });

    it('hides home link when showHome is false', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[{ label: 'Roster', path: '/roster' }]}
          showHome={false}
        />
      );

      expect(screen.queryByLabelText('Home')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders links for non-last items', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[
            { label: 'Roster', path: '/roster' },
            { label: 'Character', path: '/roster/1' },
          ]}
        />
      );

      const rosterLink = screen.getByRole('link', { name: 'Roster' });
      expect(rosterLink).toHaveAttribute('href', '/roster');
    });

    it('renders current page indicator for last item', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[
            { label: 'Roster', path: '/roster' },
            { label: 'Character', path: '/roster/1' },
          ]}
        />
      );

      const currentPage = screen.getByText('Character');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('does not render link for last item', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[
            { label: 'Roster', path: '/roster' },
            { label: 'Character', path: '/roster/1' },
          ]}
        />
      );

      // Character should not be a link
      expect(screen.queryByRole('link', { name: 'Character' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper nav aria-label', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Roster', path: '/roster' }]} />
      );

      expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('marks icons as aria-hidden', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Roster', path: '/roster' }]} />
      );

      // All SVG icons should have aria-hidden
      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Single Item', () => {
    it('renders single item without link', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Roster', path: '/roster' }]} />
      );

      // Single item should be the current page
      const currentPage = screen.getByText('Roster');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Multiple Items', () => {
    it('renders three items correctly', () => {
      renderWithRouter(
        <Breadcrumbs
          items={[
            { label: 'Teams', path: '/teams' },
            { label: 'My Team', path: '/teams/1' },
            { label: 'Materials', path: '/teams/1/materials' },
          ]}
        />
      );

      // First two should be links
      expect(screen.getByRole('link', { name: 'Teams' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My Team' })).toBeInTheDocument();
      // Last should be current page
      expect(screen.getByText('Materials')).toHaveAttribute('aria-current', 'page');
    });
  });
});
