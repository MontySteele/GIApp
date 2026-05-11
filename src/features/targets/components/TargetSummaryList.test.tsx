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
    expect(screen.getByRole('link', { name: /open target/i })).toHaveAttribute('href', '/campaigns/1');
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
