/**
 * Unit Tests: ErrorBoundary Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { withErrorBoundary } from './ErrorBoundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Rendered successfully</div>;
}

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('Normal Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test child content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('displays error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('displays feature name when provided', () => {
      render(
        <ErrorBoundary featureName="Character Tracker">
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/An error occurred in the Character Tracker feature/)).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('logs error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error message</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('shows Try Again button by default', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('hides Try Again button when allowRetry is false', () => {
      render(
        <ErrorBoundary allowRetry={false}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('resets error state when retry is clicked', () => {
      let shouldThrow = true;
      function ConditionalThrow() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success after retry</div>;
      }

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      expect(screen.getByText('Success after retry')).toBeInTheDocument();
    });
  });

  describe('Fallback UI Elements', () => {
    it('displays warning icon', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has appropriate styling for error state', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('.border-red-500\\/30');
      expect(errorContainer).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  function TestComponent({ message }: { message: string }) {
    return <div>{message}</div>;
  }

  function ThrowingTestComponent(): JSX.Element {
    throw new Error('HOC test error');
  }

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello from HOC" />);

    expect(screen.getByText('Hello from HOC')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowingTestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes feature name to error boundary', () => {
    const WrappedComponent = withErrorBoundary(ThrowingTestComponent, 'Test Feature');

    render(<WrappedComponent />);

    expect(screen.getByText(/An error occurred in the Test Feature feature/)).toBeInTheDocument();
  });

  it('sets display name on wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent, 'Test');

    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(TestComponent)');
  });
});
