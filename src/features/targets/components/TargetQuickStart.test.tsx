import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TargetQuickStart from './TargetQuickStart';

vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: () => ({
    teams: [
      {
        id: 'team-1',
        name: 'Hyperbloom',
        characterKeys: ['Furina', 'Nahida'],
        rotationNotes: '',
        tags: [],
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
  }),
}));

function renderQuickStart() {
  return render(
    <MemoryRouter>
      <TargetQuickStart />
    </MemoryRouter>
  );
}

async function goToDetails(user: ReturnType<typeof userEvent.setup>, mode = 'Get') {
  await user.click(screen.getByRole('button', { name: mode }));
}

async function chooseCharacter(user: ReturnType<typeof userEvent.setup>, name = 'Furina') {
  await user.type(screen.getByLabelText(/target character/i), name);
  await user.click(await screen.findByRole('option', { name: new RegExp(name, 'i') }));
}

async function goToPreview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /next/i }));
}

describe('TargetQuickStart', () => {
  it('walks a manual get-character target through preview and creation links', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await goToDetails(user, 'Get');
    await chooseCharacter(user, 'Furina');
    await user.clear(screen.getByLabelText(/pulls saved/i));
    await user.type(screen.getByLabelText(/pulls saved/i), '42');
    await user.clear(screen.getByLabelText(/current pity/i));
    await user.type(screen.getByLabelText(/current pity/i), '10');
    await user.type(screen.getByLabelText(/^target c$/i), '1');
    await user.type(screen.getByLabelText(/pull budget/i), '120');
    await goToPreview(user);

    expect(screen.getByText('Get Furina')).toBeInTheDocument();
    expect(screen.getByText(/hard-pity coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/more pulls before the banner target/i)).toBeInTheDocument();
    expect(screen.getByText(/manual mode is enough/i)).toBeInTheDocument();

    const href = screen.getByRole('link', { name: /create target/i }).getAttribute('href');
    expect(href?.split('?')[0]).toBe('/campaigns');
    expect(Object.fromEntries(new URLSearchParams(href?.split('?')[1]))).toMatchObject({
      type: 'character-acquisition',
      character: 'Furina',
      buildGoal: 'comfortable',
      budget: '120',
      constellation: '1',
      copies: '2',
      pullPlan: '1',
    });

    const oddsHref = screen.getByRole('link', { name: /check odds/i }).getAttribute('href');
    expect(oddsHref).toContain('/pulls/calculator?mode=multi');
    expect(oddsHref).toContain('pulls=42');
    expect(oddsHref).toContain('pity=10');
  });

  it('supports a build-character path without odds actions', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await goToDetails(user, 'Build');
    await chooseCharacter(user, 'Furina');
    await goToPreview(user);

    expect(screen.getByText('Build Furina')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create target/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/campaigns?type=character-polish&character=Furina')
    );
    expect(screen.queryByRole('link', { name: /check odds/i })).not.toBeInTheDocument();
  });

  it('supports a team-polish path', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await goToDetails(user, 'Team');
    await user.selectOptions(screen.getByLabelText(/target team/i), 'team-1');
    await goToPreview(user);

    expect(screen.getByText('Polish a team')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create target/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/campaigns?team=team-1')
    );
  });

  it('blocks preview for invalid constellation targets', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await goToDetails(user, 'Get');
    await chooseCharacter(user, 'Furina');
    await user.type(screen.getByLabelText(/^target c$/i), '9');

    expect(screen.getByRole('alert')).toHaveTextContent('Use C0-C6');
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('does not create before a known target is selected', async () => {
    const user = userEvent.setup();
    renderQuickStart();

    await goToDetails(user, 'Get');
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/target character/i), 'Totally Not A Character');
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });
});
