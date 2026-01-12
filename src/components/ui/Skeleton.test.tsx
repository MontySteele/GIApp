import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton, {
  CardSkeleton,
  CharacterCardSkeleton,
  StatCardSkeleton,
  TeamCardSkeleton,
  TableRowSkeleton,
  PageLoadingSkeleton,
} from './Skeleton';

describe('Skeleton', () => {
  describe('base Skeleton', () => {
    it('renders with aria-hidden', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies base styling', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('bg-slate-700');
    });

    it('applies pulse animation by default', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
    });

    it('applies wave animation when specified', () => {
      render(<Skeleton data-testid="skeleton" animation="wave" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('animate-shimmer');
    });

    it('applies no animation when none specified', () => {
      render(<Skeleton data-testid="skeleton" animation="none" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).not.toHaveClass('animate-pulse');
      expect(skeleton).not.toHaveClass('animate-shimmer');
    });
  });

  describe('variants', () => {
    it('applies text variant (rounded)', () => {
      render(<Skeleton data-testid="skeleton" variant="text" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded');
    });

    it('applies circular variant (rounded-full)', () => {
      render(<Skeleton data-testid="skeleton" variant="circular" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-full');
    });

    it('applies rectangular variant (rounded-lg)', () => {
      render(<Skeleton data-testid="skeleton" variant="rectangular" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded-lg');
    });

    it('uses text variant by default', () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId('skeleton')).toHaveClass('rounded');
    });
  });

  describe('dimensions', () => {
    it('applies width as number (pixels)', () => {
      render(<Skeleton data-testid="skeleton" width={100} />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ width: '100px' });
    });

    it('applies width as string', () => {
      render(<Skeleton data-testid="skeleton" width="50%" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ width: '50%' });
    });

    it('applies height as number (pixels)', () => {
      render(<Skeleton data-testid="skeleton" height={20} />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ height: '20px' });
    });

    it('applies height as string', () => {
      render(<Skeleton data-testid="skeleton" height="2rem" />);
      expect(screen.getByTestId('skeleton')).toHaveStyle({ height: '2rem' });
    });

    it('applies both width and height', () => {
      render(<Skeleton data-testid="skeleton" width={48} height={48} />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ width: '48px', height: '48px' });
    });
  });

  describe('custom styling', () => {
    it('merges custom className', () => {
      render(<Skeleton data-testid="skeleton" className="custom-class" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('bg-slate-700');
    });

    it('merges custom style', () => {
      render(
        <Skeleton data-testid="skeleton" style={{ marginTop: '10px' }} width={100} />
      );
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ marginTop: '10px', width: '100px' });
    });
  });
});

describe('CardSkeleton', () => {
  it('renders card structure', () => {
    render(<CardSkeleton />);
    const container = document.querySelector('.bg-slate-900');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('rounded-lg');
    expect(container).toHaveClass('border');
  });

  it('applies custom className', () => {
    render(<CardSkeleton className="custom-card" />);
    const container = document.querySelector('.custom-card');
    expect(container).toBeInTheDocument();
  });

  it('contains multiple skeleton elements', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('CharacterCardSkeleton', () => {
  it('renders character card structure', () => {
    render(<CharacterCardSkeleton />);
    const container = document.querySelector('.bg-slate-900');
    expect(container).toBeInTheDocument();
  });

  it('contains circular avatar skeleton', () => {
    const { container } = render(<CharacterCardSkeleton />);
    const circular = container.querySelector('.rounded-full');
    expect(circular).toBeInTheDocument();
  });

  it('contains grid of stat skeletons', () => {
    const { container } = render(<CharacterCardSkeleton />);
    const grid = container.querySelector('.grid-cols-3');
    expect(grid).toBeInTheDocument();
  });
});

describe('StatCardSkeleton', () => {
  it('renders stat card structure', () => {
    render(<StatCardSkeleton />);
    const container = document.querySelector('.bg-slate-900');
    expect(container).toBeInTheDocument();
  });

  it('contains skeleton elements for stat display', () => {
    const { container } = render(<StatCardSkeleton />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(3); // title, value, subtitle
  });
});

describe('TeamCardSkeleton', () => {
  it('renders team card structure', () => {
    render(<TeamCardSkeleton />);
    const container = document.querySelector('.bg-slate-900');
    expect(container).toBeInTheDocument();
  });

  it('contains 4 circular member skeletons', () => {
    const { container } = render(<TeamCardSkeleton />);
    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBe(4);
  });
});

describe('TableRowSkeleton', () => {
  it('renders with default 4 columns', () => {
    const { container } = render(<TableRowSkeleton />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(4);
  });

  it('renders with custom column count', () => {
    const { container } = render(<TableRowSkeleton columns={6} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(6);
  });

  it('applies flex styling', () => {
    const { container } = render(<TableRowSkeleton />);
    const row = container.querySelector('.flex');
    expect(row).toBeInTheDocument();
  });
});

describe('PageLoadingSkeleton', () => {
  it('renders with default 8 cards', () => {
    const { container } = render(<PageLoadingSkeleton />);
    const cards = container.querySelectorAll('.bg-slate-900');
    expect(cards.length).toBe(8);
  });

  it('renders with custom card count', () => {
    const { container } = render(<PageLoadingSkeleton cards={12} />);
    const cards = container.querySelectorAll('.bg-slate-900');
    expect(cards.length).toBe(12);
  });

  it('applies 4-column grid by default', () => {
    const { container } = render(<PageLoadingSkeleton />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('xl:grid-cols-4');
  });

  it('applies 3-column grid when specified', () => {
    const { container } = render(<PageLoadingSkeleton columns={3} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).not.toHaveClass('xl:grid-cols-4');
  });

  it('applies 2-column grid when specified', () => {
    const { container } = render(<PageLoadingSkeleton columns={2} />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).not.toHaveClass('lg:grid-cols-3');
  });
});
