import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('should add a toast to the store', () => {
      const { addToast } = useToastStore.getState();
      const id = addToast({ variant: 'success', title: 'Test' });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        id,
        variant: 'success',
        title: 'Test',
      });
    });

    it('should generate unique IDs for each toast', () => {
      const { addToast } = useToastStore.getState();
      const id1 = addToast({ variant: 'success', title: 'Toast 1' });
      const id2 = addToast({ variant: 'error', title: 'Toast 2' });

      expect(id1).not.toBe(id2);
    });

    it('should include message when provided', () => {
      const { addToast } = useToastStore.getState();
      addToast({ variant: 'info', title: 'Title', message: 'Message body' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].message).toBe('Message body');
    });

    it('should auto-dismiss toast after default duration', () => {
      const { addToast } = useToastStore.getState();
      addToast({ variant: 'success', title: 'Test' });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(5000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should auto-dismiss after custom duration', () => {
      const { addToast } = useToastStore.getState();
      addToast({ variant: 'success', title: 'Test', duration: 2000 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(2000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not auto-dismiss when duration is 0 (persistent)', () => {
      const { addToast } = useToastStore.getState();
      addToast({ variant: 'error', title: 'Persistent', duration: 0 });

      vi.advanceTimersByTime(10000);

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('should remove a toast by ID', () => {
      const { addToast, removeToast } = useToastStore.getState();
      const id = addToast({ variant: 'success', title: 'Test', duration: 0 });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      removeToast(id);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should only remove the specified toast', () => {
      const { addToast, removeToast } = useToastStore.getState();
      const id1 = addToast({ variant: 'success', title: 'Toast 1', duration: 0 });
      addToast({ variant: 'error', title: 'Toast 2', duration: 0 });

      removeToast(id1);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Toast 2');
    });
  });

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      const { addToast, clearAll } = useToastStore.getState();
      addToast({ variant: 'success', title: 'Toast 1', duration: 0 });
      addToast({ variant: 'error', title: 'Toast 2', duration: 0 });
      addToast({ variant: 'warning', title: 'Toast 3', duration: 0 });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      clearAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('toast convenience functions', () => {
    it('should add success toast', () => {
      toast.success('Success!', 'Operation completed');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        variant: 'success',
        title: 'Success!',
        message: 'Operation completed',
      });
    });

    it('should add error toast', () => {
      toast.error('Error', 'Something went wrong');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        variant: 'error',
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should add warning toast', () => {
      toast.warning('Warning', 'Be careful');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        variant: 'warning',
        title: 'Warning',
        message: 'Be careful',
      });
    });

    it('should add info toast', () => {
      toast.info('Info', 'Just letting you know');

      const { toasts } = useToastStore.getState();
      expect(toasts[0]).toMatchObject({
        variant: 'info',
        title: 'Info',
        message: 'Just letting you know',
      });
    });

    it('should dismiss toast by ID', () => {
      const id = toast.success('Test');
      expect(useToastStore.getState().toasts).toHaveLength(1);

      toast.dismiss(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should dismiss all toasts', () => {
      toast.success('Toast 1');
      toast.error('Toast 2');
      toast.info('Toast 3');

      toast.dismissAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
