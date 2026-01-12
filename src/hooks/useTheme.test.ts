import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import { useUIStore } from '@/stores/uiStore';

// Reset store between tests
const resetStore = () => {
  useUIStore.setState({
    settings: {
      dateFormat: 'MM/dd/yyyy',
      theme: 'dark',
      backupReminderCadenceDays: 14,
      showManualWishEntry: false,
      showManualPrimogemEntry: false,
    },
  });
};

describe('useTheme', () => {
  beforeEach(() => {
    resetStore();
    // Clear class list
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('returns the current theme from settings', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('returns effective theme when using system mode', () => {
      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'system',
        },
      });

      // matchMedia mock returns matches: false (light mode)
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
      expect(result.current.effectiveTheme).toBe('light');
    });

    it('returns dark as effective theme when theme is dark', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.effectiveTheme).toBe('dark');
    });

    it('returns light as effective theme when theme is light', () => {
      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'light',
        },
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.effectiveTheme).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('updates theme to light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('updates theme to dark', () => {
      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'light',
        },
      });

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('updates theme to system', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
    });
  });

  describe('DOM updates', () => {
    it('applies dark class to document when theme is dark', () => {
      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('applies light class to document when theme is light', () => {
      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'light',
        },
      });

      renderHook(() => useTheme());

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('updates DOM when theme changes', () => {
      const { result } = renderHook(() => useTheme());

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('system theme listener', () => {
    it('sets up media query listener when in system mode', () => {
      const addEventListener = vi.fn();
      vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'system',
        },
      });

      renderHook(() => useTheme());

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('removes listener on cleanup when in system mode', () => {
      const removeEventListener = vi.fn();
      vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      }));

      useUIStore.setState({
        settings: {
          ...useUIStore.getState().settings,
          theme: 'system',
        },
      });

      const { unmount } = renderHook(() => useTheme());
      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
