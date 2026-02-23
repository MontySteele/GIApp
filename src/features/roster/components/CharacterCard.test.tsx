import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterCard from './CharacterCard';
import type { Character } from '@/types';

// Mock gameData to control portrait URL resolution
vi.mock('@/lib/gameData', () => ({
  getCharacterPortraitUrl: vi.fn((avatarId: number | undefined) =>
    avatarId ? `https://enka.network/ui/UI_AvatarIcon_Side_Test.png` : undefined
  ),
  getCharacterPortraitUrlByKey: vi.fn((key: string) =>
    key === 'UnknownChar' ? undefined : `https://enka.network/ui/UI_AvatarIcon_Side_${key}.png`
  ),
  getDisplayName: vi.fn((key: string) =>
    key.includes(' ') ? key : key.replace(/([a-z])([A-Z])/g, '$1 $2')
  ),
}));

// Mock artifact scoring
vi.mock('@/features/artifacts/domain/artifactScoring', () => ({
  calculateCharacterArtifactScore: vi.fn(() => ({
    totalCritValue: 180.5,
    averageGrade: 'A',
  })),
  getGradeColor: vi.fn(() => 'text-green-400'),
  getGradeBgColor: vi.fn(() => 'bg-green-900/30'),
}));

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-id-1',
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 2,
    talent: { auto: 9, skill: 9, burst: 10 },
    weapon: {
      key: 'SplendorOfTranquilWaters',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    artifacts: [],
    notes: '',
    priority: 'main' as const,
    teamIds: ['team-1'],
    avatarId: 10000089,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('CharacterCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('portrait rendering', () => {
    it('renders character portrait when avatarId is present', () => {
      render(<CharacterCard character={makeCharacter()} />);

      const img = screen.getByRole('img', { name: 'Furina' });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://enka.network/ui/UI_AvatarIcon_Side_Test.png');
    });

    it('falls back to key-based portrait when avatarId is missing', () => {
      render(<CharacterCard character={makeCharacter({ avatarId: undefined })} />);

      const img = screen.getByRole('img', { name: 'Furina' });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://enka.network/ui/UI_AvatarIcon_Side_Furina.png');
    });

    it('renders fallback User icon when both lookups fail', () => {
      render(
        <CharacterCard
          character={makeCharacter({ key: 'UnknownChar', avatarId: undefined })}
        />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders fallback User icon when image fails to load', () => {
      render(<CharacterCard character={makeCharacter()} />);

      const img = screen.getByRole('img', { name: 'Furina' });
      fireEvent.error(img);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('uses character key as alt text', () => {
      render(<CharacterCard character={makeCharacter({ key: 'HuTao' })} />);

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'HuTao');
    });
  });

  describe('character info display', () => {
    it('displays human-readable name (not raw key)', () => {
      render(<CharacterCard character={makeCharacter({ key: 'KamisatoAyaka' })} />);

      expect(screen.getByText('Kamisato Ayaka')).toBeInTheDocument();
      expect(screen.queryByText('KamisatoAyaka')).not.toBeInTheDocument();
    });

    it('displays level and max level based on ascension', () => {
      render(<CharacterCard character={makeCharacter({ level: 80, ascension: 5 })} />);

      expect(screen.getByText('Lv. 80/80')).toBeInTheDocument();
    });

    it('displays correct constellation stars', () => {
      const { container } = render(
        <CharacterCard character={makeCharacter({ constellation: 3 })} />
      );

      // 6 star icons total, 3 filled
      const stars = container.querySelectorAll('svg.w-3.h-3');
      expect(stars).toHaveLength(6);

      const filled = container.querySelectorAll('svg.fill-rarity-5');
      expect(filled).toHaveLength(3);
    });

    it('displays talent levels', () => {
      render(
        <CharacterCard
          character={makeCharacter({ talent: { auto: 10, skill: 8, burst: 13 } })}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
    });

    it('displays weapon name and refinement', () => {
      render(<CharacterCard character={makeCharacter()} />);

      expect(screen.getByText('SplendorOfTranquilWaters R1')).toBeInTheDocument();
    });

    it('displays weapon level', () => {
      // Use a different weapon level to avoid ambiguity with character level
      render(
        <CharacterCard
          character={makeCharacter({
            weapon: { key: 'TestSword', level: 70, ascension: 4, refinement: 3 },
          })}
        />
      );

      expect(screen.getByText('Lv. 70/70')).toBeInTheDocument();
    });
  });

  describe('priority badge', () => {
    it.each([
      ['main', 'Main'],
      ['secondary', 'Secondary'],
      ['bench', 'Bench'],
      ['unbuilt', 'Unbuilt'],
    ] as const)('shows "%s" as "%s"', (priority, label) => {
      render(<CharacterCard character={makeCharacter({ priority })} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it.each([
      ['main', 'border-primary-500'],
      ['secondary', 'border-blue-500'],
      ['bench', 'border-slate-600'],
      ['unbuilt', 'border-slate-700'],
    ] as const)('applies correct border color for %s priority', (priority, borderClass) => {
      const { container } = render(
        <CharacterCard character={makeCharacter({ priority })} />
      );

      const card = container.firstElementChild;
      expect(card?.className).toContain(borderClass);
    });
  });

  describe('artifact score', () => {
    it('shows artifact score when artifacts exist', () => {
      const artifacts = [
        {
          setKey: 'GoldenTroupe',
          slotKey: 'flower',
          rarity: 5,
          level: 20,
          mainStatKey: 'hp',
          substats: [
            { key: 'critRate_', value: 10.5 },
            { key: 'critDMG_', value: 21.0 },
            { key: 'enerRech_', value: 5.8 },
            { key: 'atk_', value: 4.7 },
          ],
        },
      ];

      render(<CharacterCard character={makeCharacter({ artifacts: artifacts as any })} />);

      expect(screen.getByText('Artifacts')).toBeInTheDocument();
      expect(screen.getByText('CV: 180.5')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('hides artifact score section when no artifacts', () => {
      render(<CharacterCard character={makeCharacter({ artifacts: [] })} />);

      expect(screen.queryByText('Artifacts')).not.toBeInTheDocument();
    });
  });

  describe('team names', () => {
    it('shows team badges when teamNames provided', () => {
      render(
        <CharacterCard
          character={makeCharacter()}
          teamNames={['Hu Tao Vape', 'National']}
        />
      );

      expect(screen.getByText('Teams')).toBeInTheDocument();
      expect(screen.getByText('Hu Tao Vape')).toBeInTheDocument();
      expect(screen.getByText('National')).toBeInTheDocument();
    });

    it('hides team section when no teamNames', () => {
      render(<CharacterCard character={makeCharacter()} />);

      expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    });

    it('hides team section when teamNames is empty', () => {
      render(<CharacterCard character={makeCharacter()} teamNames={[]} />);

      expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onClick when card clicked', async () => {
      const onClick = vi.fn();
      const { container } = render(
        <CharacterCard character={makeCharacter()} onClick={onClick} />
      );

      container.firstElementChild!.click();
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('calls onEdit with character when edit button clicked', () => {
      const onEdit = vi.fn();
      const character = makeCharacter();
      render(<CharacterCard character={character} onEdit={onEdit} />);

      screen.getByLabelText('Edit character').click();
      expect(onEdit).toHaveBeenCalledWith(character);
    });

    it('calls onDelete with character when delete button clicked', () => {
      const onDelete = vi.fn();
      const character = makeCharacter();
      render(<CharacterCard character={character} onDelete={onDelete} />);

      screen.getByLabelText('Delete character').click();
      expect(onDelete).toHaveBeenCalledWith(character);
    });

    it('edit click does not bubble to card onClick', () => {
      const onClick = vi.fn();
      const onEdit = vi.fn();
      render(
        <CharacterCard character={makeCharacter()} onClick={onClick} onEdit={onEdit} />
      );

      screen.getByLabelText('Edit character').click();
      expect(onEdit).toHaveBeenCalledOnce();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('delete click does not bubble to card onClick', () => {
      const onClick = vi.fn();
      const onDelete = vi.fn();
      render(
        <CharacterCard character={makeCharacter()} onClick={onClick} onDelete={onDelete} />
      );

      screen.getByLabelText('Delete character').click();
      expect(onDelete).toHaveBeenCalledOnce();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<CharacterCard character={makeCharacter()} />);

      expect(screen.queryByLabelText('Edit character')).not.toBeInTheDocument();
    });

    it('does not render delete button when onDelete is not provided', () => {
      render(<CharacterCard character={makeCharacter()} />);

      expect(screen.queryByLabelText('Delete character')).not.toBeInTheDocument();
    });
  });
});
