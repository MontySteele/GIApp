import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeWishTimestamp, toWishRecord } from './wishNormalization';
import { DEFAULT_SETTINGS, useUIStore } from '@/stores/uiStore';

describe('normalizeWishTimestamp', () => {
  beforeEach(() => {
    useUIStore.setState({ settings: { ...DEFAULT_SETTINGS, serverRegion: 'na' } });
  });

  it('applies the explicit region offset', () => {
    expect(normalizeWishTimestamp('2025-11-11 14:30:00', 'na')).toBe('2025-11-11T19:30:00.000Z');
    expect(normalizeWishTimestamp('2025-11-11 14:30:00', 'eu')).toBe('2025-11-11T13:30:00.000Z');
    expect(normalizeWishTimestamp('2025-11-11 14:30:00', 'asia')).toBe('2025-11-11T06:30:00.000Z');
    expect(normalizeWishTimestamp('2025-11-11 14:30:00', 'tw')).toBe('2025-11-11T06:30:00.000Z');
  });

  it('falls back to the configured server region when no region is given', () => {
    useUIStore.getState().updateSettings({ serverRegion: 'asia' });
    expect(normalizeWishTimestamp('2025-11-11 14:30:00')).toBe('2025-11-11T06:30:00.000Z');
    expect(normalizeWishTimestamp('2025-11-11 14:30:00', null)).toBe('2025-11-11T06:30:00.000Z');
  });

  it('is idempotent once a timestamp carries an offset', () => {
    const once = normalizeWishTimestamp('2025-11-11 14:30:00', 'asia');
    expect(normalizeWishTimestamp(once, 'na')).toBe(once);
  });

  it('toWishRecord forwards the region', () => {
    const record = toWishRecord(
      { id: '1', name: 'Furina', rarity: 5, itemType: 'character', time: '2025-11-11 14:30:00', banner: 'character', isFeatured: true },
      'eu'
    );
    expect(record.timestamp).toBe('2025-11-11T13:30:00.000Z');
  });

  it('treats space-separated Genshin API timestamps as UTC-5', () => {
    // "2025-11-11 14:30:00" at UTC-5 = 2025-11-11T19:30:00Z
    const result = normalizeWishTimestamp('2025-11-11 14:30:00');
    expect(result).toBe('2025-11-11T19:30:00.000Z');
  });

  it('treats T-separated timestamps without timezone as UTC-5', () => {
    const result = normalizeWishTimestamp('2025-11-11T14:30:00');
    expect(result).toBe('2025-11-11T19:30:00.000Z');
  });

  it('preserves timestamps already in UTC (Z suffix)', () => {
    const result = normalizeWishTimestamp('2025-11-11T19:30:00.000Z');
    expect(result).toBe('2025-11-11T19:30:00.000Z');
  });

  it('preserves timestamps with explicit timezone offset', () => {
    const result = normalizeWishTimestamp('2025-11-11T14:30:00-05:00');
    expect(result).toBe('2025-11-11T19:30:00.000Z');
  });

  it('handles midnight boundary at UTC-5 correctly', () => {
    // 11 PM server time = next day 4 AM UTC
    const result = normalizeWishTimestamp('2025-11-11 23:00:00');
    expect(result).toBe('2025-11-12T04:00:00.000Z');
  });

  it('handles wishes near the 5 PM ET banner boundary', () => {
    // 4:59 PM server time → should be BEFORE the 5 PM ET cutoff
    // 4:59 PM at UTC-5 = 9:59 PM UTC
    const before = normalizeWishTimestamp('2025-11-11 16:59:00');
    expect(before).toBe('2025-11-11T21:59:00.000Z');

    // 5:01 PM server time → should be AFTER the 5 PM ET cutoff
    // 5:01 PM at UTC-5 = 10:01 PM UTC
    const after = normalizeWishTimestamp('2025-11-11 17:01:00');
    expect(after).toBe('2025-11-11T22:01:00.000Z');
  });

  it('returns current time for empty string', () => {
    const before = Date.now();
    const result = normalizeWishTimestamp('');
    const after = Date.now();
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });

  it('returns current time for garbage input', () => {
    const before = Date.now();
    const result = normalizeWishTimestamp('not-a-date');
    const after = Date.now();
    const parsed = new Date(result).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});
