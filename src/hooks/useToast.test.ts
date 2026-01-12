import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';
import { useToastStore } from '@/stores/toastStore';

// Reset store between tests
const resetStore = () => {
  useToastStore.setState({ toasts: [] });
};

describe('useToast', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('toast methods', () => {
    it('creates success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success!', 'Operation completed');
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
    });

    it('creates error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error!', 'Something went wrong');
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'error',
        title: 'Error!',
        message: 'Something went wrong',
      });
    });

    it('creates warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Warning!', 'Be careful');
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'warning',
        title: 'Warning!',
        message: 'Be careful',
      });
    });

    it('creates info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Info', 'Just so you know');
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'info',
        title: 'Info',
        message: 'Just so you know',
      });
    });

    it('creates custom toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.custom({
          variant: 'success',
          title: 'Custom',
          message: 'Custom message',
          duration: 10000,
        });
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        variant: 'success',
        title: 'Custom',
        duration: 10000,
      });
    });

    it('creates toast without message', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Simple');
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Simple');
      expect(toasts[0].message).toBeUndefined();
    });
  });

  describe('dismiss methods', () => {
    it('dismisses a specific toast', () => {
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.success('Toast 1');
        result.current.success('Toast 2');
      });

      expect(useToastStore.getState().toasts).toHaveLength(2);

      act(() => {
        result.current.dismiss(toastId!);
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Toast 2');
    });

    it('dismisses all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Toast 1');
        result.current.error('Toast 2');
        result.current.warning('Toast 3');
      });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      act(() => {
        result.current.dismissAll();
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses toast after default duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Auto dismiss');
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // Fast-forward past default duration (5000ms)
      act(() => {
        vi.advanceTimersByTime(5001);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('respects custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.custom({
          variant: 'info',
          title: 'Long toast',
          duration: 10000,
        });
      });

      // Not dismissed after 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(useToastStore.getState().toasts).toHaveLength(1);

      // Dismissed after 10 seconds
      act(() => {
        vi.advanceTimersByTime(5001);
      });
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('does not auto-dismiss when duration is 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.custom({
          variant: 'info',
          title: 'Persistent',
          duration: 0,
        });
      });

      // Should still be there after a long time
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('toast ID', () => {
    it('returns unique toast IDs', () => {
      const { result } = renderHook(() => useToast());
      const ids: string[] = [];

      act(() => {
        ids.push(result.current.success('Toast 1'));
        ids.push(result.current.success('Toast 2'));
        ids.push(result.current.success('Toast 3'));
      });

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('can use returned ID to dismiss specific toast', () => {
      const { result } = renderHook(() => useToast());
      let id2: string;

      act(() => {
        result.current.success('Toast 1');
        id2 = result.current.success('Toast 2');
        result.current.success('Toast 3');
      });

      act(() => {
        result.current.dismiss(id2!);
      });

      const titles = useToastStore.getState().toasts.map((t) => t.title);
      expect(titles).toEqual(['Toast 1', 'Toast 3']);
    });
  });

  describe('multiple toasts', () => {
    it('maintains order of toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('First');
        result.current.error('Second');
        result.current.warning('Third');
      });

      const titles = useToastStore.getState().toasts.map((t) => t.title);
      expect(titles).toEqual(['First', 'Second', 'Third']);
    });

    it('handles rapid creation and dismissal', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const id1 = result.current.success('1');
        const id2 = result.current.success('2');
        result.current.dismiss(id1);
        result.current.success('3');
        result.current.dismiss(id2);
      });

      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('3');
    });
  });
});
