import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingWizard from './OnboardingWizard';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

describe('OnboardingWizard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('defaults new users to the campaign-ready Irminsul import path', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <OnboardingWizard isOpen onClose={vi.fn()} onComplete={onComplete} />
    );

    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Irminsul Scanner')).toBeInTheDocument();
    expect(screen.getByText('Recommended for campaigns')).toBeInTheDocument();
    expect(screen.getByText(/showcased characters only/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /finish/i }));
    await user.click(screen.getByRole('button', { name: /start import/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/roster?import=irminsul');
  });

  it('keeps the selected import method when the user chooses a lighter import', async () => {
    const user = userEvent.setup();

    render(
      <OnboardingWizard isOpen onClose={vi.fn()} onComplete={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /enka.network/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /finish/i }));
    await user.click(screen.getByRole('button', { name: /start import/i }));

    expect(navigateMock).toHaveBeenCalledWith('/roster?import=enka');
  });
});
