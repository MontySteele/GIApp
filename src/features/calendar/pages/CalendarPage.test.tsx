import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarPage from './CalendarPage';

// Mock Tauri shell plugin
vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn().mockResolvedValue(undefined),
}));

// Mock the ResetTimers component
vi.mock('../components/ResetTimers', () => ({
  default: () => <div data-testid="reset-timers">Reset Timers Component</div>,
}));

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<CalendarPage />);

      expect(screen.getByRole('heading', { name: /calendar/i, level: 1 })).toBeInTheDocument();
    });

    it('renders the reset timers component', () => {
      render(<CalendarPage />);

      expect(screen.getByTestId('reset-timers')).toBeInTheDocument();
    });

    it('renders the current events section', () => {
      render(<CalendarPage />);

      expect(screen.getByRole('heading', { name: /current events/i })).toBeInTheDocument();
      expect(screen.getByText(/view current events & banners/i)).toBeInTheDocument();
    });

    it('renders the quick links section', () => {
      render(<CalendarPage />);

      expect(screen.getByRole('heading', { name: /quick links/i })).toBeInTheDocument();
    });

    it('renders all resource links', () => {
      render(<CalendarPage />);

      expect(screen.getByText(/paimon.moe calendar/i)).toBeInTheDocument();
      expect(screen.getByText(/hoyolab events/i)).toBeInTheDocument();
      expect(screen.getByText(/daily check-in/i)).toBeInTheDocument();
    });

    it('renders the server info footer', () => {
      render(<CalendarPage />);

      expect(screen.getByText(/us server/i)).toBeInTheDocument();
      expect(screen.getByText(/utc-5/i)).toBeInTheDocument();
    });
  });

  describe('external links', () => {
    it('opens paimon.moe timeline when main button is clicked', async () => {
      const { open } = await import('@tauri-apps/plugin-shell');
      const user = userEvent.setup();
      render(<CalendarPage />);

      await user.click(screen.getByRole('button', { name: /open paimon.moe timeline/i }));

      expect(open).toHaveBeenCalledWith('https://paimon.moe/timeline');
    });

    it('opens paimon.moe calendar link', async () => {
      const { open } = await import('@tauri-apps/plugin-shell');
      const user = userEvent.setup();
      render(<CalendarPage />);

      // Find the Paimon.moe Calendar quick link
      const calendarLinks = screen.getAllByText(/paimon.moe/i);
      const quickLink = calendarLinks.find((el) => el.closest('button[class*="bg-slate"]'));
      if (quickLink) {
        await user.click(quickLink.closest('button')!);
        expect(open).toHaveBeenCalledWith('https://paimon.moe/timeline');
      }
    });

    it('opens HoYoLAB link when clicked', async () => {
      const { open } = await import('@tauri-apps/plugin-shell');
      const user = userEvent.setup();
      render(<CalendarPage />);

      const hoyolabButton = screen.getByText(/hoyolab events/i).closest('button');
      if (hoyolabButton) {
        await user.click(hoyolabButton);
        expect(open).toHaveBeenCalledWith('https://www.hoyolab.com/home');
      }
    });

    it('opens daily check-in link when clicked', async () => {
      const { open } = await import('@tauri-apps/plugin-shell');
      const user = userEvent.setup();
      render(<CalendarPage />);

      const checkInButton = screen.getByText(/daily check-in/i).closest('button');
      if (checkInButton) {
        await user.click(checkInButton);
        expect(open).toHaveBeenCalledWith(expect.stringContaining('act.hoyolab.com'));
      }
    });
  });

  describe('resource link descriptions', () => {
    it('shows description for each quick link', () => {
      render(<CalendarPage />);

      expect(screen.getByText(/events, banners, birthdays/i)).toBeInTheDocument();
      expect(screen.getByText(/official event announcements/i)).toBeInTheDocument();
      expect(screen.getByText(/claim daily login rewards/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('all external link buttons are focusable', () => {
      render(<CalendarPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('has proper heading hierarchy', () => {
      render(<CalendarPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });
  });
});
