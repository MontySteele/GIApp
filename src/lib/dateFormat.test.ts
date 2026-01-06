import { afterEach, describe, expect, it } from 'vitest';
import { formatDate, formatDateValue } from './dateFormat';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

afterEach(() => {
  useUIStore.getState().resetSettings();
});

describe('dateFormat helpers', () => {
  const sampleDate = '2024-03-15T12:00:00Z';

  it('formats using the current UI setting', () => {
    expect(formatDate(sampleDate)).toBe('03/15/2024');

    useUIStore.getState().updateSettings({ dateFormat: 'dd.MM.yyyy' });
    expect(formatDate(sampleDate)).toBe('15.03.2024');
  });

  it('falls back to the default format when an invalid pattern is provided', () => {
    useUIStore.getState().updateSettings({ dateFormat: 'invalid pattern [' });

    expect(formatDate(sampleDate)).toBe(
      formatDateValue(sampleDate, DEFAULT_SETTINGS.dateFormat)
    );
  });
});
