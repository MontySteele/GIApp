import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResumeNextCard from './ResumeNextCard';

describe('ResumeNextCard', () => {
  it('renders the resume action and link', () => {
    render(
      <MemoryRouter>
        <ResumeNextCard
          action={{
            title: 'Resume Recruit Furina',
            detail: 'Save 38 more pulls',
            href: '/campaigns/1',
            actionLabel: 'Open Target',
            priority: 'target',
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByText('Resume Recruit Furina')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open target/i })).toHaveAttribute('href', '/campaigns/1');
  });

  it.each([
    ['import' as const, 'Open Import Hub', '/imports'],
    ['manual' as const, 'Set Up Pulls', '/imports'],
    ['start' as const, 'New Target', '/campaigns'],
  ])('renders the %s resume variant', (priority, actionLabel, href) => {
    render(
      <MemoryRouter>
        <ResumeNextCard
          action={{
            title: `${priority} action`,
            detail: 'Next step detail',
            href,
            actionLabel,
            priority,
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(`${priority} action`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(actionLabel, 'i') })).toHaveAttribute('href', href);
  });
});
