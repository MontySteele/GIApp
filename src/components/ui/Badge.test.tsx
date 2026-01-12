import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>5★</Badge>);
      expect(screen.getByText('5★')).toBeInTheDocument();
    });

    it('renders as a span element', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge').tagName).toBe('SPAN');
    });

    it('applies base classes', () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('inline-flex');
      expect(badge).toHaveClass('items-center');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-medium');
    });
  });

  describe('variants', () => {
    it('applies default variant by default', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toHaveClass('bg-slate-700');
    });

    it('applies primary variant', () => {
      render(<Badge variant="primary">Primary</Badge>);
      expect(screen.getByText('Primary')).toHaveClass('bg-primary-600');
    });

    it('applies success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      expect(screen.getByText('Success')).toHaveClass('bg-green-600');
    });

    it('applies warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      expect(screen.getByText('Warning')).toHaveClass('bg-yellow-600');
    });

    it('applies danger variant', () => {
      render(<Badge variant="danger">Danger</Badge>);
      expect(screen.getByText('Danger')).toHaveClass('bg-red-600');
    });

    it('applies outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('bg-transparent');
      expect(badge).toHaveClass('border');
      expect(badge).toHaveClass('border-slate-600');
    });
  });

  describe('element variants', () => {
    it('applies pyro variant', () => {
      render(<Badge variant="pyro">Pyro</Badge>);
      expect(screen.getByText('Pyro')).toHaveClass('bg-pyro');
    });

    it('applies hydro variant', () => {
      render(<Badge variant="hydro">Hydro</Badge>);
      expect(screen.getByText('Hydro')).toHaveClass('bg-hydro');
    });

    it('applies anemo variant', () => {
      render(<Badge variant="anemo">Anemo</Badge>);
      expect(screen.getByText('Anemo')).toHaveClass('bg-anemo');
    });

    it('applies electro variant', () => {
      render(<Badge variant="electro">Electro</Badge>);
      expect(screen.getByText('Electro')).toHaveClass('bg-electro');
    });

    it('applies dendro variant', () => {
      render(<Badge variant="dendro">Dendro</Badge>);
      expect(screen.getByText('Dendro')).toHaveClass('bg-dendro');
    });

    it('applies cryo variant with dark text', () => {
      render(<Badge variant="cryo">Cryo</Badge>);
      const badge = screen.getByText('Cryo');
      expect(badge).toHaveClass('bg-cryo');
      expect(badge).toHaveClass('text-slate-900');
    });

    it('applies geo variant with dark text', () => {
      render(<Badge variant="geo">Geo</Badge>);
      const badge = screen.getByText('Geo');
      expect(badge).toHaveClass('bg-geo');
      expect(badge).toHaveClass('text-slate-900');
    });
  });

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex'); // base class preserved
    });
  });

  describe('additional props', () => {
    it('passes through HTML attributes', () => {
      render(
        <Badge data-testid="badge" title="Test Badge">
          Attributes
        </Badge>
      );
      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('title', 'Test Badge');
    });

    it('passes through aria attributes', () => {
      render(<Badge aria-label="Status indicator">Status</Badge>);
      expect(screen.getByLabelText('Status indicator')).toBeInTheDocument();
    });
  });
});
