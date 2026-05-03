import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodayFarming } from './useTodayFarming';

const mocks = vi.hoisted(() => ({
  useCharacters: vi.fn(),
  useTeams: vi.fn(),
  getCharacterMaterials: vi.fn(),
  getTodayName: vi.fn(),
}));

vi.mock('@/features/roster/hooks/useCharacters', () => ({
  useCharacters: mocks.useCharacters,
}));

vi.mock('@/features/roster/hooks/useTeams', () => ({
  useTeams: mocks.useTeams,
}));

vi.mock('@/lib/services/genshinDbService', () => ({
  getCharacterMaterials: mocks.getCharacterMaterials,
}));

vi.mock('@/features/planner/domain/farmingSchedule', () => ({
  getTodayName: mocks.getTodayName,
}));

const furina = {
  id: 'furina',
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: { auto: 8, skill: 10, burst: 10 },
  weapon: { key: 'SplendorOfTranquilWaters', level: 90, ascension: 6, refinement: 1 },
  artifacts: [],
  notes: '',
  priority: 'main' as const,
  teamIds: ['team-1'],
  createdAt: '',
  updatedAt: '',
};

describe('useTodayFarming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCharacters.mockReturnValue({
      characters: [furina],
      isLoading: false,
    });
    mocks.useTeams.mockReturnValue({
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
    });
    mocks.getCharacterMaterials.mockResolvedValue({
      data: {
        talentMaterials: {
          books: {
            series: 'Justice',
            region: 'Fontaine',
          },
        },
      },
    });
  });

  it('skips material lookups on Sunday because every domain is available', () => {
    mocks.getTodayName.mockReturnValue('Sunday');

    const { result } = renderHook(() => useTodayFarming({ scope: 'team' }));

    expect(result.current.today).toBe('Sunday');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalCharactersProcessed).toBe(0);
    expect(mocks.getCharacterMaterials).not.toHaveBeenCalled();
  });

  it('loads team character book needs on rotating domain days', async () => {
    mocks.getTodayName.mockReturnValue('Monday');

    const { result } = renderHook(() => useTodayFarming({ scope: 'team' }));

    await waitFor(() => {
      expect(result.current.totalCharactersProcessed).toBe(1);
    });

    expect(mocks.getCharacterMaterials).toHaveBeenCalledWith('Furina', {
      useStaleOnError: true,
    });
    expect(result.current.notAvailableToday).toEqual([
      expect.objectContaining({
        series: 'Justice',
        region: 'Fontaine',
        characters: [
          expect.objectContaining({
            characterKey: 'Furina',
            bookSeries: 'Justice',
          }),
        ],
      }),
    ]);
  });
});
