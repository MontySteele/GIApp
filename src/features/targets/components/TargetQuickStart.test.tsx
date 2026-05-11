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

async function chooseCharacter(user: ReturnType<typeof userEvent.setup>, name = 'Furina') {
  await user.type(screen.getByLabelText(/character/i), name);
  await user.click(await screen.findByRole('option', { name: new RegExp(name, 'i') }));
}

describe('TargetQuickStart', () => {
  it('creates a prefilled target draft from a character', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await chooseCharacter(user, 'Furina');
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

    await chooseCharacter(user, 'Furina');
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
    await chooseCharacter(user, 'Furina');

    expect(screen.getByRole('link', { name: /start target/i })).toHaveAttribute(
      'href',
      '/campaigns?type=character-polish&character=Furina&buildGoal=comfortable&pullPlan=0'
    );
    expect(screen.queryByRole('link', { name: /check odds/i })).not.toBeInTheDocument();
  });

  it('keeps pull planning fields in one field group', () => {
    renderQuickStart();

    expect(screen.getAllByLabelText(/banner deadline/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/pull budget/i)).toHaveLength(1);
  });

  it('does not start a target before a known character is selected', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    expect(screen.getByRole('button', { name: /start target/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/character/i), 'Totally Not A Character');
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start target/i })).toBeDisabled();
  });

  it('blocks invalid constellation targets', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await chooseCharacter(user, 'Furina');
    await user.type(screen.getByLabelText(/target c/i), '9');

    expect(screen.getByRole('alert')).toHaveTextContent('Use C0-C6');
    expect(screen.getByRole('button', { name: /start target/i })).toBeDisabled();
    expect(screen.queryByRole('link', { name: /start target/i })).not.toBeInTheDocument();
  });
});
