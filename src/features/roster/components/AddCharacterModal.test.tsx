import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddCharacterModal from './AddCharacterModal';

describe('AddCharacterModal', () => {
  it('presents full planning imports before quick showcase and manual entry options', () => {
    render(
      <AddCharacterModal
        isOpen
        onClose={vi.fn()}
        onCreateCharacter={vi.fn()}
      />
    );

    expect(screen.getByText('Import from Irminsul')).toBeInTheDocument();
    expect(screen.getByText('Recommended for campaigns')).toBeInTheDocument();
    expect(screen.getByText(/roster, weapons, artifacts, and materials/i)).toBeInTheDocument();

    expect(screen.getByText('Import GOOD Format')).toBeInTheDocument();
    expect(screen.getByText(/compatible community tools/i)).toBeInTheDocument();

    expect(screen.getByText('Import from Enka.network')).toBeInTheDocument();
    expect(screen.getByText(/public showcase characters only/i)).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
  });
});
