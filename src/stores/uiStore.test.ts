import { DEFAULT_SETTINGS, useUIStore } from './uiStore';

describe('useUIStore settings surface', () => {
  beforeEach(() => {
    useUIStore.persist?.clearStorage();
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

  it('updates settings without overwriting untouched fields', () => {
    const { updateSettings } = useUIStore.getState();
    updateSettings({
      dateFormat: 'yyyy/MM/dd',
      calculatorDefaults: {
        targetProbability: 90,
      },
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      dateFormat: 'yyyy/MM/dd',
      calculatorDefaults: {
        ...DEFAULT_SETTINGS.calculatorDefaults,
        targetProbability: 90,
      },
    });
  });

  it('can update multiple settings at once', () => {
    const { updateSettings } = useUIStore.getState();
    updateSettings({
      defaultTheme: 'dark',
      backupReminderCadenceDays: 7,
      calculatorDefaults: {
        simulationCount: 20000,
        pityPreset: {
          ...DEFAULT_SETTINGS.calculatorDefaults.pityPreset,
          pity: 10,
        },
      },
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultTheme: 'dark',
      backupReminderCadenceDays: 7,
      calculatorDefaults: {
        ...DEFAULT_SETTINGS.calculatorDefaults,
        simulationCount: 20000,
        pityPreset: {
          ...DEFAULT_SETTINGS.calculatorDefaults.pityPreset,
          pity: 10,
        },
      },
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
