import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannedBanner } from '@/types';
import {
  addDaysToDateInput,
  formatBannerDate,
  formatDateInput,
  getBannerTimingLabel,
  getDateOnly,
} from './bannerDates';

function makeBanner(overrides: Partial<PlannedBanner> = {}): PlannedBanner {
  return {
    id: 'banner-1',
    characterKey: 'Furina',
    expectedStartDate: '2026-06-01',
    expectedEndDate: '2026-06-21',
    priority: 1,
    maxPullBudget: 180,
    isConfirmed: true,
    notes: '',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('bannerDates', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats and offsets date input values without UTC conversion', () => {
    expect(formatDateInput(new Date(2026, 5, 1))).toBe('2026-06-01');
    expect(addDaysToDateInput('2026-06-01', 20)).toBe('2026-06-21');
  });

  it('accepts legacy ISO timestamp values by extracting the date-only part', () => {
    expect(getDateOnly('2026-06-01T00:00:00.000Z')).toBe('2026-06-01');
    expect(formatBannerDate('not-a-date')).toBe('Unknown');
  });

  it('labels date-only planned banners relative to the current day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 10, 12));

    expect(getBannerTimingLabel(makeBanner())).toBe('Live now');
    expect(
      getBannerTimingLabel(
        makeBanner({
          expectedStartDate: '2026-06-12',
          expectedEndDate: '2026-07-02',
        })
      )
    ).toBe('Starts in 2 days');
    expect(
      getBannerTimingLabel(
        makeBanner({
          expectedStartDate: '2026-05-01',
          expectedEndDate: '2026-05-21',
        })
      )
    ).toBe('Ended');
  });
});
