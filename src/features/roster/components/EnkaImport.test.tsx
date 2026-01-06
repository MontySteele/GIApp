import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import EnkaImport from './EnkaImport';
import { fetchEnkaData, fromEnka } from '@/mappers/enka';
import { characterRepo } from '../repo/characterRepo';

vi.mock('@/mappers/enka', () => ({
  fetchEnkaData: vi.fn(),
  fromEnka: vi.fn(),
}));

vi.mock('../repo/characterRepo', () => ({
  characterRepo: {
    bulkCreate: vi.fn(),
  },
}));

const mockCharacter = {
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: { auto: 1, skill: 1, burst: 1 },
  weapon: { key: 'Sword', level: 1, ascension: 0, refinement: 1 },
  artifacts: [],
  notes: '',
  priority: 'unbuilt',
  teamIds: [],
};

describe('EnkaImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skipped warning when some characters cannot be imported', async () => {
    vi.mocked(fetchEnkaData).mockResolvedValue({
      avatarInfoList: [{ avatarId: 1 } as any, { avatarId: 2 } as any],
      playerInfo: {
        nickname: 'Tester',
        level: 60,
        signature: '',
        nameCardId: 1,
        finishAchievementNum: 1,
        towerFloorIndex: 1,
        towerLevelIndex: 1,
        showAvatarInfoList: [],
      },
      ttl: 60,
      uid: '123456789',
    });
    vi.mocked(fromEnka).mockReturnValue([mockCharacter as any]);
    vi.mocked(characterRepo.bulkCreate).mockResolvedValue(undefined);

    render(<EnkaImport onCancel={() => {}} onSuccess={() => {}} />);

    await userEvent.type(screen.getByLabelText(/enter your uid/i), '123456789');
    await userEvent.click(screen.getByRole('button', { name: /import from enka/i }));

    await waitFor(() => expect(characterRepo.bulkCreate).toHaveBeenCalled());

    expect(screen.getByText(/Successfully imported 1 character/i)).toBeInTheDocument();
    expect(screen.getByText(/Some characters were skipped/i)).toBeInTheDocument();
  });

  it('shows error when no characters are found in the showcase', async () => {
    vi.mocked(fetchEnkaData).mockResolvedValue({
      avatarInfoList: [],
      playerInfo: {
        nickname: 'Tester',
        level: 60,
        signature: '',
        nameCardId: 1,
        finishAchievementNum: 1,
        towerFloorIndex: 1,
        towerLevelIndex: 1,
        showAvatarInfoList: [],
      },
      ttl: 60,
      uid: '123456789',
    });
    vi.mocked(fromEnka).mockReturnValue([]);

    render(<EnkaImport onCancel={() => {}} onSuccess={() => {}} />);

    await userEvent.type(screen.getByLabelText(/enter your uid/i), '123456789');
    await userEvent.click(screen.getByRole('button', { name: /import from enka/i }));

    await waitFor(() => {
      expect(screen.getByText(/No characters found in showcase/i)).toBeInTheDocument();
    });
    expect(characterRepo.bulkCreate).not.toHaveBeenCalled();
  });

  it('shows API errors returned from fetchEnkaData', async () => {
    vi.mocked(fetchEnkaData).mockRejectedValue(new Error('Rate limit exceeded'));

    render(<EnkaImport onCancel={() => {}} onSuccess={() => {}} />);

    await userEvent.type(screen.getByLabelText(/enter your uid/i), '123456789');
    await userEvent.click(screen.getByRole('button', { name: /import from enka/i }));

    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument();
    });
    expect(fromEnka).not.toHaveBeenCalled();
    expect(characterRepo.bulkCreate).not.toHaveBeenCalled();
  });
});
