import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterForm from './CharacterForm';

// Mock the character and weapon lists so the SearchableSelect has known options
vi.mock('@/lib/constants/characterList', () => ({
  ALL_CHARACTERS: [
    { key: 'Furina', name: 'Furina', rarity: 5, element: 'Hydro', weapon: 'Sword' },
    { key: 'HuTao', name: 'Hu Tao', rarity: 5, element: 'Pyro', weapon: 'Polearm' },
  ],
}));

vi.mock('@/lib/data/equipmentData', () => ({
  WEAPONS: [
    { key: 'SplendorOfTranquilWaters', name: 'Splendor of Tranquil Waters', type: 'Sword', rarity: 5 },
    { key: 'StaffOfHoma', name: 'Staff of Homa', type: 'Polearm', rarity: 5 },
  ],
}));

describe('CharacterForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form data correctly', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // The character name field is now a SearchableSelect (combobox)
    const charInput = screen.getByLabelText(/character name/i);
    await user.clear(charInput);
    await user.type(charInput, 'Furina');

    const weaponInput = screen.getByLabelText(/weapon name/i);
    await user.clear(weaponInput);
    await user.type(weaponInput, 'SplendorOfTranquilWaters');

    await user.click(screen.getByRole('button', { name: /add character/i }));

    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledOnce());

    const submittedData = mockOnSubmit.mock.calls[0][0];

    expect(submittedData).not.toHaveProperty('avatarId');
    expect(submittedData.key).toBe('Furina');
    expect(submittedData.weapon.key).toBe('SplendorOfTranquilWaters');
    expect(submittedData.artifacts).toEqual([]);
    expect(submittedData.teamIds).toEqual([]);
  });

  it('populates form with initialData for editing', () => {
    const initialData = {
      id: 'test-id',
      key: 'HuTao',
      level: 90,
      ascension: 6,
      constellation: 1,
      talent: { auto: 10, skill: 10, burst: 10 },
      weapon: { key: 'StaffOfHoma', level: 90, ascension: 6, refinement: 1 },
      artifacts: [],
      notes: 'Best girl',
      priority: 'main' as const,
      teamIds: ['team-1'],
      avatarId: 10000046,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(
      <CharacterForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        initialData={initialData}
      />
    );

    // SearchableSelect shows the display name from ALL_CHARACTERS
    const charInput = screen.getByLabelText(/character name/i);
    expect(charInput).toHaveValue('Hu Tao');
    expect(charInput).toBeDisabled(); // Disabled in edit mode

    const weaponInput = screen.getByLabelText(/weapon name/i);
    expect(weaponInput).toHaveValue('Staff of Homa');

    expect(screen.getByRole('button', { name: /update character/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalledOnce();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when required fields are empty', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: /add character/i }));

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
