import { DEFAULT_SETTINGS, getCurrentServerRegion, useServerRegion, useUIStore } from './uiStore';
import { renderHook, act } from '@testing-library/react';
import { SERVER_REGIONS } from '@/lib/time/serverTime';

describe('useUIStore settings surface', () => {
  beforeEach(() => {
    useUIStore.setState({
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
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      dateFormat: 'yyyy/MM/dd',
    });
  });

  it('can update multiple settings at once', () => {
    const { updateSettings } = useUIStore.getState();
    updateSettings({
      theme: 'light',
      backupReminderCadenceDays: 7,
    });

    const state = useUIStore.getState();
    expect(state.settings).toEqual({
      ...DEFAULT_SETTINGS,
      theme: 'light',
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

describe('serverRegion setting', () => {
  beforeEach(() => {
    useUIStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  });

  it('defaults to a valid region derived from the timezone', () => {
    expect(SERVER_REGIONS).toContain(DEFAULT_SETTINGS.serverRegion);
    expect(getCurrentServerRegion()).toBe(DEFAULT_SETTINGS.serverRegion);
  });

  it('updates via updateSettings and is exposed by useServerRegion', () => {
    const { result } = renderHook(() => useServerRegion());
    expect(result.current).toBe(DEFAULT_SETTINGS.serverRegion);
    act(() => {
      useUIStore.getState().updateSettings({ serverRegion: 'asia' });
    });
    expect(result.current).toBe('asia');
    expect(getCurrentServerRegion()).toBe('asia');
  });

  it('falls back to the default when persisted settings predate serverRegion', () => {
    const { serverRegion: _omit, ...legacy } = DEFAULT_SETTINGS;
    useUIStore.setState({ settings: legacy as typeof DEFAULT_SETTINGS });
    expect(getCurrentServerRegion()).toBe(DEFAULT_SETTINGS.serverRegion);
    const { result } = renderHook(() => useServerRegion());
    expect(result.current).toBe(DEFAULT_SETTINGS.serverRegion);
  });
});
