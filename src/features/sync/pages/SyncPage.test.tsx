import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SyncPage from './SyncPage';

// Mock OnboardingContext
vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboardingContext: () => ({
    isComplete: true,
    showWizard: false,
    checklist: {
      hasImportedCharacters: false,
      hasCreatedTeam: false,
      hasVisitedPlanner: false,
      hasSetResin: false,
    },
    checklistProgress: 0,
    checklistTotal: 4,
    isChecklistComplete: false,
    completeOnboarding: vi.fn(),
    resetOnboarding: vi.fn(),
    openWizard: vi.fn(),
    closeWizard: vi.fn(),
    updateChecklist: vi.fn(),
  }),
}));

// Mock app meta status hook
vi.mock('../hooks/useAppMetaStatus', () => ({
  useAppMetaStatus: () => ({
    status: {
      lastBackupAt: '2024-01-10T12:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      needsBackup: false,
    },
    isLoading: false,
  }),
}));

// Mock app meta service
vi.mock('../services/appMetaService', () => ({
  appMetaService: {
    markBackupComplete: vi.fn().mockResolvedValue(undefined),
    exportBackup: vi.fn().mockResolvedValue({ version: 1, data: {} }),
  },
  parseDateString: (str?: string) => (str ? new Date(str) : null),
  resolveBackupCadenceDays: (days: number) => days || 7,
}));

// Mock UI store
const mockSettings = {
  backupReminderCadenceDays: 7,
  showManualWishEntry: false,
  showManualPrimogemEntry: false,
  dateFormat: 'yyyy-MM-dd',
  defaultTheme: 'system' as const,
};

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    settings: mockSettings,
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
}));

// Mock useTheme hook
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock child components
vi.mock('../components/ImportBackup', () => ({
  default: () => <div data-testid="import-backup">Import Backup Component</div>,
}));

vi.mock('../components/DataTransfer', () => ({
  default: () => <div data-testid="data-transfer">Data Transfer Component</div>,
}));

// Mock URL.createObjectURL and related
global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('SyncPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the page title', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /settings & sync/i })).toBeInTheDocument();
      expect(screen.getByText(/manage backup reminders/i)).toBeInTheDocument();
    });

    it('renders theme section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /theme/i })).toBeInTheDocument();
    });

    it('renders display preferences section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /display preferences/i })).toBeInTheDocument();
    });

    it('renders backup status section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /backup status/i })).toBeInTheDocument();
    });

    it('renders backup preferences section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /backup preferences/i })).toBeInTheDocument();
    });

    it('renders cross-device sync section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /cross-device sync/i })).toBeInTheDocument();
      expect(screen.getByTestId('data-transfer')).toBeInTheDocument();
    });

    it('renders import backup section', () => {
      render(<SyncPage />);

      expect(screen.getByRole('heading', { name: /import backup/i })).toBeInTheDocument();
      expect(screen.getByTestId('import-backup')).toBeInTheDocument();
    });
  });

  describe('theme selection', () => {
    it('renders all theme options', () => {
      render(<SyncPage />);

      expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    });

    it('highlights the active theme', () => {
      render(<SyncPage />);

      // Dark theme should be active based on mock
      const darkButton = screen.getByRole('button', { name: /dark/i });
      expect(darkButton).toHaveClass('bg-primary-600');
    });
  });

  describe('display preferences', () => {
    it('renders manual wish entry toggle', () => {
      render(<SyncPage />);

      expect(screen.getByText(/show manual wish entry/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /show manual wish entry/i })).toBeInTheDocument();
    });

    it('renders manual primogem entry toggle', () => {
      render(<SyncPage />);

      expect(screen.getByText(/show manual primogem entry/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /show manual primogem entry/i })).toBeInTheDocument();
    });

    it('checkboxes reflect current settings', () => {
      render(<SyncPage />);

      const wishCheckbox = screen.getByRole('checkbox', { name: /show manual wish entry/i });
      const primoCheckbox = screen.getByRole('checkbox', { name: /show manual primogem entry/i });

      expect(wishCheckbox).not.toBeChecked();
      expect(primoCheckbox).not.toBeChecked();
    });
  });

  describe('backup status', () => {
    it('displays last backup date', () => {
      render(<SyncPage />);

      expect(screen.getByText(/last backup/i)).toBeInTheDocument();
      // Should show formatted date
      expect(screen.getByText(/1\/10\/2024/i)).toBeInTheDocument();
    });

    it('displays next suggested backup date', () => {
      render(<SyncPage />);

      expect(screen.getByText(/next suggested backup/i)).toBeInTheDocument();
    });

    it('renders export button', () => {
      render(<SyncPage />);

      expect(screen.getByRole('button', { name: /export data & mark done/i })).toBeInTheDocument();
    });

    it('renders mark backup done button', () => {
      render(<SyncPage />);

      expect(screen.getByRole('button', { name: /mark backup done/i })).toBeInTheDocument();
    });
  });

  describe('backup preferences', () => {
    it('renders cadence input', () => {
      render(<SyncPage />);

      expect(screen.getByLabelText(/reminder cadence/i)).toBeInTheDocument();
    });

    it('displays current cadence', () => {
      render(<SyncPage />);

      expect(screen.getByText(/current cadence/i)).toBeInTheDocument();
      expect(screen.getByText(/every 7 days/i)).toBeInTheDocument();
    });

    it('renders reset to defaults button', () => {
      render(<SyncPage />);

      expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument();
    });
  });

  describe('backup actions', () => {
    it('can click mark backup done button', async () => {
      const { appMetaService } = await import('../services/appMetaService');
      const user = userEvent.setup();
      render(<SyncPage />);

      await user.click(screen.getByRole('button', { name: /mark backup done/i }));

      await waitFor(() => {
        expect(appMetaService.markBackupComplete).toHaveBeenCalled();
      });
    });

    it('shows status message after marking backup', async () => {
      const user = userEvent.setup();
      render(<SyncPage />);

      await user.click(screen.getByRole('button', { name: /mark backup done/i }));

      await waitFor(() => {
        expect(screen.getByText(/backup timestamp updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('section descriptions', () => {
    it('shows theme description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/choose your preferred color scheme/i)).toBeInTheDocument();
    });

    it('shows display preferences description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/control which sections are expanded/i)).toBeInTheDocument();
    });

    it('shows backup status description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/track when you last exported/i)).toBeInTheDocument();
    });

    it('shows backup preferences description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/configure how frequently/i)).toBeInTheDocument();
    });

    it('shows cross-device sync description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/transfer your data between devices/i)).toBeInTheDocument();
    });

    it('shows import backup description', () => {
      render(<SyncPage />);

      expect(screen.getByText(/restore data from a backup file/i)).toBeInTheDocument();
    });
  });
});
