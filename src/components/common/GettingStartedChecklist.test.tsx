import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GettingStartedChecklist from './GettingStartedChecklist';
import type { OnboardingChecklist } from '@/hooks/useOnboarding';

const emptyChecklist: OnboardingChecklist = {
  hasImportedCharacters: false,
  hasCreatedTeam: false,
  hasVisitedPlanner: false,
  hasImportedWishHistory: false,
};

function renderChecklist(checklist = emptyChecklist) {
  return render(
    <MemoryRouter>
      <GettingStartedChecklist
        checklist={checklist}
        progress={0}
        total={4}
        onDismiss={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe('GettingStartedChecklist', () => {
  it('sends users to full account import and wish import from setup tasks', () => {
    renderChecklist();

    expect(screen.getByText(/use irminsul or good/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import data/i })).toHaveAttribute(
      'href',
      '/roster?import=irminsul'
    );

    expect(screen.getByText(/refresh pity, guarantees, and pull odds/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import wishes/i })).toHaveAttribute(
      'href',
      '/pulls/history'
    );
  });
});
