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

  it('renders an empty state', () => {
    render(
      <MemoryRouter>
        <TargetSummaryList targets={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/no targets yet/i)).toBeInTheDocument();
  });
});
