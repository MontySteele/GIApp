import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TargetSummaryList from './TargetSummaryList';
import type { TargetSummary } from '../domain/targetSummary';

const target: TargetSummary = {
  id: 'campaign:1',
  source: 'campaign',
  kind: 'pull',
  status: 'active',
  title: 'Recruit Furina',
  subtitle: 'Furina',
  priority: 1,
  href: '/campaigns/1',
  actionHref: '/campaigns/1',
  actionLabel: 'Open Target',
  characterKeys: ['Furina'],
  readinessPercent: 72,
  nextAction: {
    id: 'materials:Mora',
    category: 'materials',
    label: 'Farm Mora',
    detail: '800 Mora still needed.',
    priority: 1,
    materialKey: 'Mora',
  },
};

describe('TargetSummaryList', () => {
  it('renders target summaries with action links', () => {
    render(
      <MemoryRouter>
        <TargetSummaryList targets={[target]} />
      </MemoryRouter>
    );

    expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
    expect(screen.getByText('72% ready')).toBeInTheDocument();
    expect(screen.getByText('Next: Farm Mora')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open target/i })).toHaveAttribute('href', '/campaigns/1');
  });

  it('limits visible targets when maxItems is provided', () => {
    render(
      <MemoryRouter>
        <TargetSummaryList
          targets={[
            target,
            { ...target, id: 'campaign:2', title: 'Build Neuvillette' },
          ]}
          maxItems={1}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Recruit Furina')).toBeInTheDocument();
    expect(screen.queryByText('Build Neuvillette')).not.toBeInTheDocument();
  });

  it('renders status and readiness badge variants', () => {
    render(
      <MemoryRouter>
        <TargetSummaryList
          targets={[
            { ...target, id: 'active', status: 'active', title: 'Active Target', readinessPercent: 90 },
            { ...target, id: 'paused', status: 'paused', title: 'Paused Target', readinessPercent: 50 },
            { ...target, id: 'completed', status: 'completed', title: 'Completed Target' },
            { ...target, id: 'wishlist', source: 'wishlist', status: 'wishlist', title: 'Wishlist Target' },
          ]}
          maxItems={4}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('active')).toHaveClass('bg-primary-600');
    expect(screen.getByText('paused')).toHaveClass('bg-yellow-600');
    expect(screen.getByText('completed')).toHaveClass('bg-green-600');
    expect(screen.getByText('wishlist')).toHaveClass('bg-transparent');
    expect(screen.getByText('90% ready')).toHaveClass('bg-green-600');
    expect(screen.getByText('50% ready')).toHaveClass('bg-yellow-600');
  });

  it('renders an empty state', () => {
    render(
      <MemoryRouter>
        <TargetSummaryList targets={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/no targets yet/i)).toBeInTheDocument();
  });
});
