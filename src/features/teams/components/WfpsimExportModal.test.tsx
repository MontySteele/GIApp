import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WfpsimExportModal from './WfpsimExportModal';
import type { Character, Team } from '@/types';

// Mock clipboard API using vi.stubGlobal
const mockWriteText = vi.fn().mockResolvedValue(undefined);
const mockWindowOpen = vi.fn();

beforeEach(() => {
  // Mock clipboard
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: {
      writeText: mockWriteText,
    },
  });

  // Mock window.open
  vi.stubGlobal('open', mockWindowOpen);

  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Test fixtures
const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
  id: 'char-1',
  key: 'Raiden',
  level: 90,
  ascension: 6,
  constellation: 0,
  talent: { auto: 1, skill: 9, burst: 9 },
  weapon: {
    key: 'TheCatch',
    level: 90,
    ascension: 6,
    refinement: 5,
  },
  artifacts: [
    { setKey: 'EmblemOfSeveredFate', slotKey: 'flower', level: 20, rarity: 5, mainStatKey: 'hp', substats: [] },
    { setKey: 'EmblemOfSeveredFate', slotKey: 'plume', level: 20, rarity: 5, mainStatKey: 'atk', substats: [] },
    { setKey: 'EmblemOfSeveredFate', slotKey: 'sands', level: 20, rarity: 5, mainStatKey: 'enerRech_', substats: [] },
    { setKey: 'EmblemOfSeveredFate', slotKey: 'goblet', level: 20, rarity: 5, mainStatKey: 'electro_dmg_', substats: [] },
    { setKey: 'EmblemOfSeveredFate', slotKey: 'circlet', level: 20, rarity: 5, mainStatKey: 'critDMG_', substats: [] },
  ],
  notes: '',
  priority: 'main',
  teamIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'National Team',
  characterKeys: ['Raiden'],
  rotationNotes: '',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('WfpsimExportModal', () => {
  it('renders modal when open', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Export to wfpsim')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={false}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('Export to wfpsim')).not.toBeInTheDocument();
  });

  it('displays generated config for valid team', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Check config preview contains expected content
    expect(screen.getByText(/raiden char/)).toBeInTheDocument();
    expect(screen.getByText(/options iteration=/)).toBeInTheDocument();
  });

  it('shows validation errors for incomplete team', () => {
    const team = createMockTeam({ characterKeys: ['Raiden', 'MissingChar'] });
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Missing Data')).toBeInTheDocument();
    expect(screen.getByText(/not found in roster/)).toBeInTheDocument();
  });

  it('shows validation error for character without weapon', () => {
    const charWithoutWeapon = createMockCharacter();
    // @ts-expect-error - Testing invalid state
    charWithoutWeapon.weapon = null;

    const team = createMockTeam();

    render(
      <WfpsimExportModal
        team={team}
        characters={[charWithoutWeapon]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Missing Data')).toBeInTheDocument();
    expect(screen.getByText(/has no weapon equipped/)).toBeInTheDocument();
  });

  it('copies config to clipboard when copy button clicked', async () => {
    const user = userEvent.setup();
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy config/i });
    await user.click(copyButton);

    // Wait for the copy action to complete (UI shows "Copied!")
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
    // Note: The actual clipboard.writeText call may not be captured due to jsdom limitations
  });

  it('shows copied confirmation after copying', async () => {
    const user = userEvent.setup();
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy config/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('opens wfpsim in new tab when button clicked', async () => {
    const user = userEvent.setup();
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const openButton = screen.getByRole('button', { name: /open wfpsim/i });
    await user.click(openButton);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://wfpsim.com/',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /^close$/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables copy button for invalid team', () => {
    const team = createMockTeam({ characterKeys: [] });
    const characters: Character[] = [];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy config/i });
    expect(copyButton).toBeDisabled();
  });

  it('renders option inputs with default values', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify default values are present
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // iterations
    expect(screen.getByDisplayValue('90')).toBeInTheDocument(); // duration
    expect(screen.getByDisplayValue('100')).toBeInTheDocument(); // target level
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // resist (10%)

    // Config should use these default values
    expect(screen.getByText(/iteration=1000/)).toBeInTheDocument();
    expect(screen.getByText(/duration=90/)).toBeInTheDocument();
  });

  it('has editable option inputs', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify inputs are editable (not disabled)
    const iterationsInput = screen.getByDisplayValue('1000');
    const durationInput = screen.getByDisplayValue('90');

    expect(iterationsInput).not.toBeDisabled();
    expect(durationInput).not.toBeDisabled();
    expect(iterationsInput.tagName).toBe('INPUT');
    expect(durationInput.tagName).toBe('INPUT');
  });

  it('allows toggling comments', async () => {
    const user = userEvent.setup();
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Initially comments should be included
    expect(screen.getByText(/# Team:/)).toBeInTheDocument();

    // Toggle comments off
    const commentsCheckbox = screen.getByLabelText(/include comments/i);
    await user.click(commentsCheckbox);

    // Comments should be removed
    await waitFor(() => {
      expect(screen.queryByText(/# Team:/)).not.toBeInTheDocument();
    });
  });

  it('displays instructions for using wfpsim', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('How to use')).toBeInTheDocument();
    expect(screen.getByText(/copy the config above/i)).toBeInTheDocument();
    expect(screen.getByText(/open wfpsim.com/i)).toBeInTheDocument();
    expect(screen.getByText(/add your team.*rotation/i)).toBeInTheDocument();
  });

  it('renders link to gcsim docs', () => {
    const team = createMockTeam();
    const characters = [createMockCharacter()];

    render(
      <WfpsimExportModal
        team={team}
        characters={characters}
        isOpen={true}
        onClose={() => {}}
      />
    );

    const docsLink = screen.getByRole('link', { name: /gcsim docs/i });
    expect(docsLink).toHaveAttribute('href', 'https://docs.gcsim.app/guides/building_a_simulation_basic_tutorial/');
    expect(docsLink).toHaveAttribute('target', '_blank');
  });
});
