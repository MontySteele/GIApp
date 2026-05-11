import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TargetQuickStart from './TargetQuickStart';

function renderQuickStart() {
  return render(
    <MemoryRouter>
      <TargetQuickStart />
    </MemoryRouter>
  );
}

describe('TargetQuickStart', () => {
  it('creates a prefilled target draft from a character', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await user.type(screen.getByLabelText(/character/i), 'Furina');
    await user.type(screen.getByLabelText(/target c/i), '2');
    await user.type(screen.getByLabelText(/pull budget/i), '180');

    const href = screen.getByRole('link', { name: /start target/i }).getAttribute('href');
    expect(href?.split('?')[0]).toBe('/campaigns');
    expect(Object.fromEntries(new URLSearchParams(href?.split('?')[1]))).toMatchObject({
      type: 'character-acquisition',
      character: 'Furina',
      buildGoal: 'comfortable',
      budget: '180',
      constellation: '2',
      copies: '3',
      pullPlan: '1',
    });
  });

  it('builds an odds-check URL with manual saved pulls', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await user.type(screen.getByLabelText(/character/i), 'Furina');
    await user.type(screen.getByLabelText(/pulls saved/i), '100');

    const oddsHref = screen.getByRole('link', { name: /check odds/i }).getAttribute('href');
    expect(oddsHref).toContain('/pulls/calculator?mode=multi');
    expect(oddsHref).toContain('pulls=100');
    expect(new URLSearchParams(oddsHref?.split('?')[1]).get('target')).toBe(
      JSON.stringify({ name: 'Furina', banner: 'character', copies: 1 })
    );
  });

  it('switches to a build target draft', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await user.click(screen.getByRole('button', { name: /build/i }));
    await user.type(screen.getByLabelText(/character/i), 'Furina');

    expect(screen.getByRole('link', { name: /start target/i })).toHaveAttribute(
      'href',
      '/campaigns?type=character-polish&character=Furina&buildGoal=comfortable&pullPlan=0'
    );
    expect(screen.queryByRole('link', { name: /check odds/i })).not.toBeInTheDocument();
  });
});
