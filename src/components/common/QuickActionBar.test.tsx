import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QuickActionBar from './QuickActionBar';

describe('QuickActionBar', () => {
  it('reveals common capture actions', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <QuickActionBar />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /quick actions/i }));

    expect(screen.getByRole('link', { name: /start target/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /log primos/i })).toHaveAttribute('href', '/pulls');
    expect(screen.getByRole('link', { name: /update pity/i })).toHaveAttribute('href', '/pulls/history');
    expect(screen.getByRole('link', { name: /import data/i })).toHaveAttribute('href', '/imports');
    expect(screen.getByRole('link', { name: /add note/i })).toHaveAttribute('href', '/notes');
  });
});
