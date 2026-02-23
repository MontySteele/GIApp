import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterForm from './CharacterForm';

describe('CharacterForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form data without avatarId (repo handles resolution)', async () => {
    const user = userEvent.setup();
    render(<CharacterForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill required fields
    await user.type(screen.getByLabelText(/character name/i), 'Furina');
    await user.type(screen.getByLabelText(/weapon name/i), 'SplendorOfTranquilWaters');

    await user.click(screen.getByRole('button', { name: /add character/i }));

    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledOnce());

    const submittedData = mockOnSubmit.mock.calls[0][0];

    // avatarId should NOT be in form submission — the repo layer resolves it
    expect(submittedData).not.toHaveProperty('avatarId');

    // Verify core fields are passed through
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

    expect(screen.getByLabelText(/character name/i)).toHaveValue('HuTao');
    expect(screen.getByLabelText(/weapon name/i)).toHaveValue('StaffOfHoma');
    // Update button shows instead of Add
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

    // Submit without filling any fields — HTML5 required or Zod should block
    await user.click(screen.getByRole('button', { name: /add character/i }));

    // onSubmit should never be called with invalid data
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
