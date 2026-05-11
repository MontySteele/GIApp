import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MorePage from './MorePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <MorePage />
    </MemoryRouter>
  );
}

describe('MorePage', () => {
  it('collects secondary destinations behind the mobile More tab', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'More' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /teams/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /planner/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /build templates/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /notes/i })).toHaveAttribute('href', '/notes');
    expect(screen.getByRole('link', { name: /import hub/i })).toHaveAttribute('href', '/imports');
    expect(screen.getByRole('link', { name: /settings & sync/i })).toHaveAttribute('href', '/settings');
  });
});
