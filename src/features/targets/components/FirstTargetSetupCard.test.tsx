import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FirstTargetSetupCard from './FirstTargetSetupCard';
import { buildFirstTargetSetupState } from '../domain/firstTargetSetup';

function renderCard(setup = buildFirstTargetSetupState({
  characterCount: 0,
  wishHistoryCount: 0,
  resourceSnapshotCount: 0,
  targetCount: 0,
  accountFreshnessStatus: 'missing',
})) {
  return render(
    <MemoryRouter>
      <FirstTargetSetupCard setup={setup} />
    </MemoryRouter>
  );
}

describe('FirstTargetSetupCard', () => {
  it('renders the active setup step and primary action', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: /set up your first target/i })).toBeInTheDocument();
    expect(screen.getAllByText('Import roster').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /import roster/i })).toHaveAttribute('href', '/roster?import=irminsul');
  });

  it('shows progress steps for the setup sequence', () => {
    renderCard(buildFirstTargetSetupState({
      characterCount: 3,
      wishHistoryCount: 0,
      resourceSnapshotCount: 0,
      targetCount: 0,
      accountFreshnessStatus: 'fresh',
    }));

    const steps = screen.getByRole('list', { name: /first target setup steps/i });
    expect(within(steps).getByText('Import roster')).toBeInTheDocument();
    expect(within(steps).getByText('Set pulls')).toBeInTheDocument();
    expect(within(steps).getByText('Choose target')).toBeInTheDocument();
    expect(within(steps).getByText('Review plan')).toBeInTheDocument();
  });

  it('links secondary actions to existing setup routes', () => {
    renderCard(buildFirstTargetSetupState({
      characterCount: 3,
      wishHistoryCount: 0,
      resourceSnapshotCount: 0,
      targetCount: 0,
      accountFreshnessStatus: 'fresh',
    }));

    expect(screen.getByRole('link', { name: /enter pity manually/i })).toHaveAttribute('href', '/pulls/calculator');
    expect(screen.getByRole('link', { name: /import wish history/i })).toHaveAttribute('href', '/pulls/history');
  });
});
