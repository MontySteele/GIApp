import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ToastContainer from './Toast';
import { useToastStore, type Toast } from '@/stores/toastStore';

// Reset store between tests
const resetStore = () => {
  useToastStore.setState({ toasts: [] });
};

const createToast = (overrides: Partial<Toast> = {}): Toast => ({
  id: 'toast-1',
  variant: 'success',
  title: 'Test Toast',
  message: 'This is a test message',
  duration: 5000,
  ...overrides,
});

describe('ToastContainer', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when no toasts', () => {
      const { container } = render(<ToastContainer />);
      expect(container.querySelector('[role="region"]')).not.toBeInTheDocument();
    });

    it('renders container when toasts exist', () => {
      useToastStore.setState({ toasts: [createToast()] });

      render(<ToastContainer />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders single toast', () => {
      useToastStore.setState({
        toasts: [createToast({ title: 'Single Toast' })],
      });

      render(<ToastContainer />);

      expect(screen.getByText('Single Toast')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
      useToastStore.setState({
        toasts: [
          createToast({ id: 'toast-1', title: 'Toast 1' }),
          createToast({ id: 'toast-2', title: 'Toast 2' }),
          createToast({ id: 'toast-3', title: 'Toast 3' }),
        ],
      });

      render(<ToastContainer />);

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();
    });
  });

  describe('toast variants', () => {
    it('renders success toast with correct styling', () => {
      useToastStore.setState({
        toasts: [createToast({ variant: 'success' })],
      });

      render(<ToastContainer />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-green-900/90');
      expect(toast).toHaveClass('border-green-700');
    });

    it('renders error toast with correct styling', () => {
      useToastStore.setState({
        toasts: [createToast({ variant: 'error' })],
      });

      render(<ToastContainer />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-red-900/90');
      expect(toast).toHaveClass('border-red-700');
    });

    it('renders warning toast with correct styling', () => {
      useToastStore.setState({
        toasts: [createToast({ variant: 'warning' })],
      });

      render(<ToastContainer />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-yellow-900/90');
      expect(toast).toHaveClass('border-yellow-700');
    });

    it('renders info toast with correct styling', () => {
      useToastStore.setState({
        toasts: [createToast({ variant: 'info' })],
      });

      render(<ToastContainer />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-blue-900/90');
      expect(toast).toHaveClass('border-blue-700');
    });
  });

  describe('toast content', () => {
    it('displays title', () => {
      useToastStore.setState({
        toasts: [createToast({ title: 'Important Title' })],
      });

      render(<ToastContainer />);

      expect(screen.getByText('Important Title')).toBeInTheDocument();
    });

    it('displays message when provided', () => {
      useToastStore.setState({
        toasts: [createToast({ message: 'Detailed message here' })],
      });

      render(<ToastContainer />);

      expect(screen.getByText('Detailed message here')).toBeInTheDocument();
    });

    it('does not display message when not provided', () => {
      useToastStore.setState({
        toasts: [createToast({ message: undefined })],
      });

      render(<ToastContainer />);

      // Only title should be present
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });
  });

  describe('toast actions', () => {
    it('renders action button when action provided', () => {
      useToastStore.setState({
        toasts: [
          createToast({
            action: { label: 'Undo', onClick: vi.fn() },
          }),
        ],
      });

      render(<ToastContainer />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('calls action onClick when clicked', () => {
      const handleAction = vi.fn();

      useToastStore.setState({
        toasts: [
          createToast({
            action: { label: 'Retry', onClick: handleAction },
          }),
        ],
      });

      render(<ToastContainer />);

      fireEvent.click(screen.getByText('Retry'));

      expect(handleAction).toHaveBeenCalled();
    });

    it('dismisses toast after action click', () => {
      useToastStore.setState({
        toasts: [
          createToast({
            action: { label: 'Action', onClick: vi.fn() },
          }),
        ],
      });

      render(<ToastContainer />);

      fireEvent.click(screen.getByText('Action'));

      // Wait for exit animation
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('dismiss button', () => {
    it('renders dismiss button', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('dismisses toast when dismiss button clicked', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

      // Wait for exit animation
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('accessibility', () => {
    it('toast has role="alert"', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('toast has aria-live="polite"', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('container has role="region"', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('container has aria-label', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Notifications');
    });

    it('dismiss button has aria-label', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      expect(
        screen.getByRole('button', { name: /dismiss notification/i })
      ).toBeInTheDocument();
    });

    it('icons are hidden from screen readers', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      const { container } = render(<ToastContainer />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('positioning', () => {
    it('positions container in bottom-right corner', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      const container = screen.getByRole('region');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('bottom-4');
      expect(container).toHaveClass('right-4');
    });

    it('has high z-index', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      const container = screen.getByRole('region');
      expect(container).toHaveClass('z-[100]');
    });
  });

  describe('animations', () => {
    it('applies entry animation classes', () => {
      useToastStore.setState({
        toasts: [createToast()],
      });

      render(<ToastContainer />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('opacity-100');
      expect(toast).toHaveClass('translate-x-0');
    });
  });
});
