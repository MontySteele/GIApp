import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountDataFreshnessCallout from './AccountDataFreshnessCallout';
import type { AccountDataFreshness } from '../hooks/useAccountDataFreshness';

const fresh: AccountDataFreshness = {
  status: 'fresh',
  latestImport: null,
  daysSinceImport: 0,
  label: 'Account data current',
  detail: 'Last Irminsul import was today.',
};

function renderCallout(freshness: AccountDataFreshness, variant: 'card' | 'compact' = 'card') {
  return render(
    <MemoryRouter>
      <AccountDataFreshnessCallout
        freshness={freshness}
        context="campaign"
        variant={variant}
      />
    </MemoryRouter>
  );
}

describe('AccountDataFreshnessCallout', () => {
  it('hides when account data is fresh', () => {
    renderCallout(fresh);

    expect(screen.queryByText('Account data current')).not.toBeInTheDocument();
  });

  it('shows an import prompt when account data is missing', () => {
    renderCallout({
      status: 'missing',
      latestImport: null,
      daysSinceImport: null,
      label: 'Import account data',
      detail: 'No import found.',
    });

    expect(screen.getByText('Import needed')).toBeInTheDocument();
    expect(screen.getByText('Import account data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import account data/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );
  });

  it('uses compact layout for widget prompts', () => {
    renderCallout(
      {
        status: 'stale',
        latestImport: null,
        daysSinceImport: 12,
        label: 'Refresh account data',
        detail: 'Last Irminsul import was 12 days ago.',
      },
      'compact'
    );

    expect(screen.getByText('Refresh account data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /refresh import/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );
  });
});
