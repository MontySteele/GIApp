import { useCallback } from 'react';
import { useToastStore, type Toast } from '@/stores/toastStore';

/**
 * Hook for showing toast notifications
 *
 * @example
 * const { success, error, warning, info } = useToast();
 *
 * success('Saved!', 'Your changes have been saved.');
 * error('Error', 'Failed to save changes.');
 * warning('Warning', 'This action cannot be undone.');
 * info('Info', 'New update available.');
 */
export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'title' | 'message'>>) =>
      addToast({ variant: 'success', title, message, ...options }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'title' | 'message'>>) =>
      addToast({ variant: 'error', title, message, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'title' | 'message'>>) =>
      addToast({ variant: 'warning', title, message, ...options }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'variant' | 'title' | 'message'>>) =>
      addToast({ variant: 'info', title, message, ...options }),
    [addToast]
  );

  const custom = useCallback(
    (toast: Omit<Toast, 'id'>) => addToast(toast),
    [addToast]
  );

  return {
    success,
    error,
    warning,
    info,
    custom,
    dismiss: removeToast,
    dismissAll: clearAll,
  };
}
