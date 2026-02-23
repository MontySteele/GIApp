import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CharacterProgression from './CharacterProgression';
import type { Character } from '@/types';

vi.mock('@/features/planner/domain/ascensionCalculator', () => ({
  calculateAscensionSummary: vi.fn().mockResolvedValue({
    characterKey: 'Furina',
    materials: [
      { key: 'guide-to-justice', name: 'Guide to Justice', category: 'talent', tier: 2, required: 20, owned: 5, deficit: 15, availability: ['Tuesday', 'Friday', 'Sunday'] },
      { key: 'varunada-lazurite-chunk', name: 'Varunada Lazurite Chunk', category: 'gem', tier: 3, required: 9, owned: 0, deficit: 9 },
      { key: 'mora', name: 'Mora', category: 'mora', required: 2500000, owned: 1000000, deficit: 1500000 },
    ],
    totalMora: 2500000,
    totalExp: 800000,
    estimatedResin: 1200,
    resinBreakdown: { talentBoss: 800, expMora: 400, total: 1200 },
    estimatedDays: 8,
    canAscend: false,
    nextAscensionReady: false,
    isStale: false,
  }),
  createGoalFromCharacter: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 70, targetLevel: 90,
    currentAscension: 4, targetAscension: 6,
    currentTalents: { auto: 1, skill: 6, burst: 6 },
    targetTalents: { auto: 10, skill: 10, burst: 10 },
  }),
  createComfortableBuildGoal: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 70, targetLevel: 80,
    currentAscension: 4, targetAscension: 6,
    currentTalents: { auto: 1, skill: 6, burst: 6 },
    targetTalents: { auto: 8, skill: 8, burst: 8 },
  }),
  createFunctionalBuildGoal: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 70, targetLevel: 80,
    currentAscension: 4, targetAscension: 5,
    currentTalents: { auto: 1, skill: 6, burst: 6 },
    targetTalents: { auto: 1, skill: 6, burst: 6 },
  }),
  createNextAscensionGoal: vi.fn().mockReturnValue({
    characterKey: 'Furina',
    currentLevel: 70, targetLevel: 80,
    currentAscension: 4, targetAscension: 5,
    currentTalents: { auto: 1, skill: 6, burst: 6 },
    targetTalents: { auto: 1, skill: 6, burst: 6 },
  }),
}));

vi.mock('@/features/planner/hooks/useMaterials', () => ({
  useMaterials: () => ({
    materials: { Mora: 1000000 },
    isLoading: false,
  }),
}));

vi.mock('@/features/planner/domain/materialConstants', () => ({
  RESIN_REGEN: { minutesPerResin: 8, maxResin: 200, fragileResin: 60, resinPerDay: 180 },
}));

const mockCharacter: Character = {
  id: '1',
  key: 'Furina',
  level: 70,
  ascension: 4,
  constellation: 0,
  talent: { auto: 1, skill: 6, burst: 6 },
  weapon: { key: 'Fleuve Cendre Ferryman', level: 70, ascension: 4, refinement: 5 },
  artifacts: [],
  notes: '',
  priority: 'main',
  teamIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const renderProgression = (character = mockCharacter) =>
  render(
    <MemoryRouter>
      <CharacterProgression character={character} />
    </MemoryRouter>
  );

describe('CharacterProgression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the progression card header', () => {
    renderProgression();
    expect(screen.getByText('Progression')).toBeInTheDocument();
  });

  it('renders goal preset buttons', () => {
    renderProgression();
    expect(screen.getByText('Next Ascension')).toBeInTheDocument();
    expect(screen.getByText('Functional')).toBeInTheDocument();
    expect(screen.getByText('Comfortable')).toBeInTheDocument();
    expect(screen.getByText('Full Build')).toBeInTheDocument();
  });

  it('defaults to comfortable preset', () => {
    renderProgression();
    const comfortableBtn = screen.getByText('Comfortable');
    expect(comfortableBtn.className).toContain('bg-primary-600');
  });

  it('switches goal presets on click', () => {
    renderProgression();
    const fullBtn = screen.getByText('Full Build');
    fireEvent.click(fullBtn);
    expect(fullBtn.className).toContain('bg-primary-600');
  });

  it('shows target state summary', () => {
    renderProgression();
    expect(screen.getByText(/Lv\.70/)).toBeInTheDocument();
  });

  it('displays materials after calculation', async () => {
    renderProgression();

    await waitFor(() => {
      expect(screen.getByText('Guide to Justice')).toBeInTheDocument();
    });
  });

  it('displays summary stats', async () => {
    renderProgression();

    await waitFor(() => {
      expect(screen.getByText('1,200')).toBeInTheDocument(); // resin
      expect(screen.getByText('8')).toBeInTheDocument(); // days
    });
  });

  it('shows farming availability for talent books', async () => {
    renderProgression();

    await waitFor(() => {
      expect(screen.getByText(/Tuesday, Friday, Sunday/)).toBeInTheDocument();
    });
  });

  it('shows "Open in Planner" link', () => {
    renderProgression();
    const link = screen.getByText('Open in Planner');
    expect(link.closest('a')).toHaveAttribute('href', '/planner?character=Furina');
  });

  it('shows complete state when character meets goal', async () => {
    const maxedChar: Character = {
      ...mockCharacter,
      level: 90,
      ascension: 6,
      talent: { auto: 10, skill: 10, burst: 10 },
    };

    // Override the goal factory to return a goal the character already meets
    const { createComfortableBuildGoal } = await import('@/features/planner/domain/ascensionCalculator');
    vi.mocked(createComfortableBuildGoal).mockReturnValue({
      characterKey: 'Furina',
      currentLevel: 90, targetLevel: 80,
      currentAscension: 6, targetAscension: 6,
      currentTalents: { auto: 10, skill: 10, burst: 10 },
      targetTalents: { auto: 8, skill: 8, burst: 8 },
    });

    renderProgression(maxedChar);

    await waitFor(() => {
      expect(screen.getByText(/already meets this goal/)).toBeInTheDocument();
    });
  });
});
