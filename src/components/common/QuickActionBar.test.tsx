import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QuickActionBar from './QuickActionBar';

function renderQuickActionBar(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QuickActionBar />
    </MemoryRouter>
  );
}

describe('QuickActionBar', () => {
  it('reveals common capture actions', async () => {
    const user = userEvent.setup();
    renderQuickActionBar('/roster');

    await user.click(screen.getByRole('button', { name: /quick actions/i }));

    expect(screen.getByRole('link', { name: /start target/i })).toHaveAttribute('href', '/campaigns');
    expect(screen.getByRole('link', { name: /log primos/i })).toHaveAttribute('href', '/#quick-resource-logger');
    expect(screen.getByRole('link', { name: /update pity/i })).toHaveAttribute('href', '/pulls/history');
    expect(screen.getByRole('link', { name: /import data/i })).toHaveAttribute('href', '/imports');
    expect(screen.getByRole('link', { name: /add note/i })).toHaveAttribute('href', '/notes');
  });

  it('keeps mobile quick actions hidden and desktop actions available off-dashboard', () => {
    renderQuickActionBar('/campaigns');

    const container = screen.getByRole('button', { name: /quick actions/i }).parentElement;

    expect(container).toHaveClass('hidden');
    expect(container).toHaveClass('md:block');
  });

  it('hides the floating action launcher on the dashboard', () => {
    renderQuickActionBar('/');

    const container = screen.getByRole('button', { name: /quick actions/i }).parentElement;

    expect(container).toHaveClass('hidden');
    expect(container).not.toHaveClass('md:block');
  });
});
