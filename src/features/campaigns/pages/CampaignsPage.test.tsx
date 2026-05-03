import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignsPage from './CampaignsPage';

const mocks = vi.hoisted(() => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
}));

vi.mock('../hooks/useCampaigns', () => ({
  useCampaigns: () => ({
    campaigns: [],
    activeCampaigns: [],
    createCampaign: mocks.createCampaign,
    updateCampaign: mocks.updateCampaign,
    deleteCampaign: mocks.deleteCampaign,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useCampaignPlans', () => ({
  useCampaignPlans: () => ({
    plans: {},
    isLoading: false,
    isCalculating: false,
    error: null,
  }),
}));

vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: () => ({
    characters: [
      {
        id: 'furina',
        key: 'Furina',
        level: 80,
        ascension: 6,
        constellation: 0,
        talent: { auto: 8, skill: 8, burst: 8 },
        weapon: { key: 'FleuveCendreFerryman', level: 90, ascension: 6, refinement: 5 },
        artifacts: [],
        notes: '',
        priority: 'main',
        teamIds: [],
        createdAt: '',
        updatedAt: '',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: () => ({
    teams: [
      {
        id: 'team-1',
        name: 'Salon Core',
        characterKeys: ['Furina'],
        rotationNotes: '',
        tags: [],
        createdAt: '',
        updatedAt: '',
      },
    ],
    isLoading: false,
  }),
}));

function renderPage(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/campaigns" element={<CampaignsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCampaign.mockResolvedValue('campaign-1');
  });

  it('applies character campaign prefill from the URL', () => {
    renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0&copies=2&budget=150&priority=1');

    expect(screen.getByLabelText('Campaign type')).toHaveValue('character-acquisition');
    expect(screen.getByLabelText('Target character')).toHaveValue('Furina');
    expect(screen.getByLabelText('Build goal')).toHaveValue('full');
    expect(screen.getByLabelText('Priority')).toHaveValue('1');
    expect(screen.getByLabelText('Copies')).toHaveValue(2);
    expect(screen.getByLabelText('Pull budget')).toHaveValue(150);
    expect(screen.getByLabelText('Include pull plan')).not.toBeChecked();
  });

  it('omits pull targets when the prefill disables pull planning', async () => {
    const user = userEvent.setup();
    renderPage('/campaigns?character=Furina&buildGoal=full&pullPlan=0');

    await user.click(screen.getByRole('button', { name: /create campaign/i }));

    expect(mocks.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'character-acquisition',
        characterTargets: [
          expect.objectContaining({
            characterKey: 'Furina',
            buildGoal: 'full',
            ownership: 'owned',
          }),
        ],
        pullTargets: [],
      })
    );
  });

  it('applies team campaign prefill from the URL', () => {
    renderPage('/campaigns?team=team-1&buildGoal=functional');

    expect(screen.getByLabelText('Campaign type')).toHaveValue('team-polish');
    expect(screen.getByLabelText('Target team')).toHaveValue('team-1');
    expect(screen.getByLabelText('Build goal')).toHaveValue('functional');
  });
});
