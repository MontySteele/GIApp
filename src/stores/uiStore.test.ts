import { DEFAULT_SETTINGS, useUIStore } from './uiStore';

describe('useUIStore settings surface', () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({
      theme: 'system',
      rosterFilter: {
        element: null,
        weaponType: null,
        rarity: null,
        priority: null,
        search: '',
      },
      wishesFilter: {
        bannerType: null,
        rarity: null,
        dateRange: null,
      },
      settings: { ...DEFAULT_SETTINGS },
    });
  });

  it('initializes with default settings', () => {
    const state = useUIStore.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('persists theme changes to localStorage', () => {
    const { setTheme } = useUIStore.getState();
    setTheme('dark');

    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('updates settings without overwriting untouched fields', () => {
    const { updateSettings } = useUIStore.getState();
    updateSettings({
      dateFormat: 'yyyy/MM/dd',
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      dateFormat: 'yyyy/MM/dd',
    });
  });

  it('updates default theme and keeps theme state in sync', () => {
    const { updateSettings } = useUIStore.getState();

    updateSettings({
      defaultTheme: 'dark',
    });

    const state = useUIStore.getState();
    expect(state.settings.defaultTheme).toEqual('dark');
    expect(state.theme).toEqual('dark');
    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('can update multiple settings at once', () => {
    const { updateSettings } = useUIStore.getState();
    updateSettings({
      defaultTheme: 'dark',
      backupReminderCadenceDays: 7,
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultTheme: 'dark',
      backupReminderCadenceDays: 7,
    });
  });

  it('resets settings back to defaults', () => {
    const { updateSettings, resetSettings } = useUIStore.getState();

    updateSettings({
      dateFormat: 'dd/MM/yyyy',
      backupReminderCadenceDays: 3,
    });

    resetSettings();

    const state = useUIStore.getState();
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });
});
