import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('shows close button when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Title">
          Content
        </Modal>
      );
      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Title">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(document.getElementById(labelledBy!)).toHaveTextContent('Test Title');
    });

    it('uses aria-label when no title is provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} aria-label="Custom label">
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Custom label');
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test">
          Content
        </Modal>
      );

      // Click on the backdrop (the element with aria-hidden="true")
      const backdrop = document.querySelector('[aria-hidden="true"]');
      await user.click(backdrop!);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test">
          Content
        </Modal>
      );

      await user.click(screen.getByRole('button', { name: /close modal/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('body scroll lock', () => {
    it('prevents body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('size variants', () => {
    it('applies correct width for sm size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="sm">
          Content
        </Modal>
      );
      const modalContent = document.querySelector('.max-w-md');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies correct width for md size (default)', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      const modalContent = document.querySelector('.max-w-2xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies correct width for lg size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="lg">
          Content
        </Modal>
      );
      const modalContent = document.querySelector('.max-w-4xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('applies correct width for xl size', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="xl">
          Content
        </Modal>
      );
      const modalContent = document.querySelector('.max-w-6xl');
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('focus management', () => {
    it('focuses first focusable element when opened (close button in header)', async () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test">
          <button>Content Button</button>
        </Modal>
      );

      await waitFor(() => {
        // Close button is first focusable element in the modal
        expect(screen.getByRole('button', { name: /close modal/i })).toHaveFocus();
      });
    });

    it('focuses first content element when no title/close button', async () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /first button/i })).toHaveFocus();
      });
    });
  });
});
