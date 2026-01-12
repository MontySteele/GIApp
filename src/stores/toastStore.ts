import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const DEFAULT_DURATION = 5000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? DEFAULT_DURATION;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

    // Auto-dismiss after duration (unless duration is 0 for persistent)
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for direct access without hooks
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ variant: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ variant: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ variant: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ variant: 'info', title, message }),
  custom: (toast: Omit<Toast, 'id'>) => useToastStore.getState().addToast(toast),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  dismissAll: () => useToastStore.getState().clearAll(),
};
