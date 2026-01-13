import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';

function renderNav(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MobileBottomNav />
    </MemoryRouter>
  );
}

describe('MobileBottomNav', () => {
  describe('rendering', () => {
    it('renders navigation element with aria label', () => {
      renderNav();

      const nav = screen.getByRole('navigation', { name: /mobile navigation/i });
      expect(nav).toBeInTheDocument();
    });

    it('renders all navigation items', () => {
      renderNav();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Roster')).toBeInTheDocument();
      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Wishes')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders links with correct hrefs', () => {
      renderNav();

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /roster/i })).toHaveAttribute('href', '/roster');
      expect(screen.getByRole('link', { name: /teams/i })).toHaveAttribute('href', '/teams');
      expect(screen.getByRole('link', { name: /wishes/i })).toHaveAttribute('href', '/wishes');
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings');
    });
  });

  describe('active state', () => {
    it('highlights dashboard when on home route', () => {
      renderNav('/');

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveClass('text-primary-400');
    });

    it('highlights roster when on roster route', () => {
      renderNav('/roster');

      const rosterLink = screen.getByRole('link', { name: /roster/i });
      expect(rosterLink).toHaveClass('text-primary-400');
    });

    it('highlights teams when on teams route', () => {
      renderNav('/teams');

      const teamsLink = screen.getByRole('link', { name: /teams/i });
      expect(teamsLink).toHaveClass('text-primary-400');
    });

    it('highlights wishes when on wishes route', () => {
      renderNav('/wishes');

      const wishesLink = screen.getByRole('link', { name: /wishes/i });
      expect(wishesLink).toHaveClass('text-primary-400');
    });

    it('highlights settings when on settings route', () => {
      renderNav('/settings');

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveClass('text-primary-400');
    });

    it('does not highlight non-active links', () => {
      renderNav('/roster');

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const teamsLink = screen.getByRole('link', { name: /teams/i });

      expect(dashboardLink).not.toHaveClass('text-primary-400');
      expect(teamsLink).not.toHaveClass('text-primary-400');
    });
  });

  describe('accessibility', () => {
    it('has proper landmark navigation', () => {
      renderNav();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('renders icons (visual indicators)', () => {
      const { container } = renderNav();

      // Each nav item should have an SVG icon
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(5);
    });
  });

  describe('styling', () => {
    it('has fixed positioning classes', () => {
      renderNav();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('has mobile-only visibility class', () => {
      renderNav();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('md:hidden');
    });

    it('has proper z-index for overlay', () => {
      renderNav();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-50');
    });
  });
});
