import { describe, it, expect } from 'vitest';
import {
  SERVER_UTC_OFFSET_HOURS,
  getServerRegionFromTimezone,
  getServerNow,
  getServerDay,
  getNextDailyReset,
  getLastDailyReset,
  getNextWeeklyReset,
  getLastWeeklyReset,
  serverWallToDate,
  parseHoyoRegion,
  serverOffsetString,
  isServerRegion,
  type ServerRegion,
} from './serverTime';

// Calendar facts used below: 2026-01-11 is a Sunday, 2026-01-12 a Monday,
// 2026-01-13 a Tuesday, 2026-01-19 the following Monday.
const iso = (s: string) => new Date(s);

describe('serverTime constants', () => {
  it('uses fixed offsets for all four regions', () => {
    expect(SERVER_UTC_OFFSET_HOURS).toEqual({ na: -5, eu: 1, asia: 8, tw: 8 });
  });

  it('serverOffsetString formats ISO offsets', () => {
    expect(serverOffsetString('na')).toBe('-05:00');
    expect(serverOffsetString('eu')).toBe('+01:00');
    expect(serverOffsetString('asia')).toBe('+08:00');
    expect(serverOffsetString('tw')).toBe('+08:00');
  });

  it('isServerRegion guards values', () => {
    expect(isServerRegion('na')).toBe(true);
    expect(isServerRegion('tw')).toBe(true);
    expect(isServerRegion('jp')).toBe(false);
    expect(isServerRegion(undefined)).toBe(false);
  });
});

describe('getServerRegionFromTimezone', () => {
  it.each([
    ['America/New_York', 'na'],
    ['America/Sao_Paulo', 'na'],
    ['US/Pacific', 'na'],
    ['Pacific/Honolulu', 'na'],
    ['Europe/London', 'eu'],
    ['Europe/Berlin', 'eu'],
    ['Africa/Lagos', 'eu'],
    ['Atlantic/Azores', 'eu'],
    ['Asia/Tokyo', 'asia'],
    ['Asia/Singapore', 'asia'],
    ['Asia/Kolkata', 'asia'],
    ['Australia/Sydney', 'asia'],
    ['Pacific/Auckland', 'asia'],
    ['Asia/Taipei', 'tw'],
    ['Asia/Hong_Kong', 'tw'],
    ['Asia/Macau', 'tw'],
  ])('%s → %s', (tz, expected) => {
    expect(getServerRegionFromTimezone(tz)).toBe(expected);
  });

  it('falls back to na for UTC / unknown zones', () => {
    expect(getServerRegionFromTimezone('UTC')).toBe('na');
    expect(getServerRegionFromTimezone('Etc/GMT+3')).toBe('na');
    expect(getServerRegionFromTimezone('')).toBe('na');
    expect(getServerRegionFromTimezone(undefined)).toBe('na');
  });

  it('returns a valid region for the runtime timezone', () => {
    expect(isServerRegion(getServerRegionFromTimezone())).toBe(true);
  });
});

describe('getServerNow', () => {
  it('returns the server wall clock for each region', () => {
    const now = iso('2026-01-12T22:30:15Z');
    expect(getServerNow('na', now)).toMatchObject({
      year: 2026, month: 1, day: 12, hour: 17, minute: 30, second: 15, weekday: 1, isoDate: '2026-01-12',
    });
    expect(getServerNow('eu', now)).toMatchObject({ day: 12, hour: 23, weekday: 1, isoDate: '2026-01-12' });
    expect(getServerNow('asia', now)).toMatchObject({ day: 13, hour: 6, weekday: 2, isoDate: '2026-01-13' });
    expect(getServerNow('tw', now)).toMatchObject({ day: 13, hour: 6, weekday: 2, isoDate: '2026-01-13' });
  });

  it('crosses month and year boundaries', () => {
    expect(getServerNow('asia', iso('2025-12-31T20:00:00Z'))).toMatchObject({
      year: 2026, month: 1, day: 1, hour: 4, isoDate: '2026-01-01',
    });
    expect(getServerNow('na', iso('2026-01-01T03:00:00Z'))).toMatchObject({
      year: 2025, month: 12, day: 31, hour: 22, isoDate: '2025-12-31',
    });
  });
});

describe('getServerDay (game day rolls over at 04:00 server time)', () => {
  it('yields Monday for NA and Tuesday for Asia at the same instant', () => {
    const now = iso('2026-01-12T22:00:00Z');
    expect(getServerDay('na', now)).toEqual({ weekday: 1, weekdayName: 'Monday', isoDate: '2026-01-12' });
    expect(getServerDay('asia', now)).toEqual({ weekday: 2, weekdayName: 'Tuesday', isoDate: '2026-01-13' });
  });

  it('NA: 03:59:59 server time is still the previous game day, 04:00 is the new one', () => {
    // NA 04:00 == 09:00Z
    expect(getServerDay('na', iso('2026-01-13T08:59:59Z'))).toMatchObject({ weekday: 1, isoDate: '2026-01-12' });
    expect(getServerDay('na', iso('2026-01-13T09:00:00Z'))).toMatchObject({ weekday: 2, isoDate: '2026-01-13' });
  });

  it('Asia: 04:00 server time == 20:00Z the previous UTC day', () => {
    expect(getServerDay('asia', iso('2026-01-12T19:59:59Z'))).toMatchObject({ weekday: 1, isoDate: '2026-01-12' });
    expect(getServerDay('asia', iso('2026-01-12T20:00:00Z'))).toMatchObject({ weekday: 2, isoDate: '2026-01-13' });
  });

  it('EU: 04:00 server time == 03:00Z', () => {
    expect(getServerDay('eu', iso('2026-01-13T02:59:59Z'))).toMatchObject({ weekday: 1, isoDate: '2026-01-12' });
    expect(getServerDay('eu', iso('2026-01-13T03:00:00Z'))).toMatchObject({ weekday: 2, isoDate: '2026-01-13' });
  });

  it('TW matches Asia', () => {
    const now = iso('2026-01-12T19:30:00Z');
    expect(getServerDay('tw', now)).toEqual(getServerDay('asia', now));
  });

  it('midnight-to-04:00 server time still belongs to yesterday (domain rotation unchanged)', () => {
    // NA 01:00 server == 06:00Z on Tuesday the 13th
    expect(getServerDay('na', iso('2026-01-13T06:00:00Z')).weekdayName).toBe('Monday');
  });
});

describe('getNextDailyReset / getLastDailyReset', () => {
  it('NA resets at 09:00Z', () => {
    expect(getNextDailyReset('na', iso('2026-01-15T08:00:00Z')).toISOString()).toBe('2026-01-15T09:00:00.000Z');
    expect(getNextDailyReset('na', iso('2026-01-15T10:00:00Z')).toISOString()).toBe('2026-01-16T09:00:00.000Z');
  });

  it('exactly at reset time returns the following reset', () => {
    expect(getNextDailyReset('na', iso('2026-01-15T09:00:00Z')).toISOString()).toBe('2026-01-16T09:00:00.000Z');
  });

  it('EU resets at 03:00Z, Asia/TW at 20:00Z', () => {
    const now = iso('2026-01-15T12:00:00Z');
    expect(getNextDailyReset('eu', now).toISOString()).toBe('2026-01-16T03:00:00.000Z');
    expect(getNextDailyReset('asia', now).toISOString()).toBe('2026-01-15T20:00:00.000Z');
    expect(getNextDailyReset('tw', now).toISOString()).toBe('2026-01-15T20:00:00.000Z');
  });

  it('next reset is always within 24h and strictly in the future', () => {
    const regions: ServerRegion[] = ['na', 'eu', 'asia', 'tw'];
    for (const region of regions) {
      for (let h = 0; h < 48; h++) {
        const now = new Date(Date.UTC(2026, 0, 11, h, 17));
        const next = getNextDailyReset(region, now).getTime() - now.getTime();
        expect(next).toBeGreaterThan(0);
        expect(next).toBeLessThanOrEqual(24 * 3600 * 1000);
        expect(getLastDailyReset(region, now).getTime()).toBe(
          getNextDailyReset(region, now).getTime() - 24 * 3600 * 1000
        );
      }
    }
  });
});

describe('getNextWeeklyReset / getLastWeeklyReset (Monday 04:00 server time)', () => {
  it('NA: Monday before 09:00Z returns the same Monday', () => {
    expect(getNextWeeklyReset('na', iso('2026-01-12T08:00:00Z')).toISOString()).toBe('2026-01-12T09:00:00.000Z');
  });

  it('NA: Monday at/after 09:00Z returns next Monday', () => {
    expect(getNextWeeklyReset('na', iso('2026-01-12T09:00:00Z')).toISOString()).toBe('2026-01-19T09:00:00.000Z');
    expect(getNextWeeklyReset('na', iso('2026-01-12T10:00:00Z')).toISOString()).toBe('2026-01-19T09:00:00.000Z');
  });

  it('NA: Sunday and mid-week return the upcoming Monday', () => {
    expect(getNextWeeklyReset('na', iso('2026-01-11T12:00:00Z')).toISOString()).toBe('2026-01-12T09:00:00.000Z');
    expect(getNextWeeklyReset('na', iso('2026-01-15T12:00:00Z')).toISOString()).toBe('2026-01-19T09:00:00.000Z');
  });

  it('Asia: the same instant can already be past the weekly reset', () => {
    const now = iso('2026-01-11T21:00:00Z'); // Sunday 16:00 NA, Monday 05:00 Asia
    expect(getNextWeeklyReset('na', now).toISOString()).toBe('2026-01-12T09:00:00.000Z');
    expect(getNextWeeklyReset('asia', now).toISOString()).toBe('2026-01-18T20:00:00.000Z');
  });

  it('Asia: Monday 03:59 server time is still before the reset', () => {
    expect(getNextWeeklyReset('asia', iso('2026-01-11T19:59:00Z')).toISOString()).toBe('2026-01-11T20:00:00.000Z');
  });

  it('EU: Monday 04:00 server == 03:00Z', () => {
    expect(getNextWeeklyReset('eu', iso('2026-01-12T02:59:00Z')).toISOString()).toBe('2026-01-12T03:00:00.000Z');
    expect(getNextWeeklyReset('eu', iso('2026-01-12T03:00:00Z')).toISOString()).toBe('2026-01-19T03:00:00.000Z');
  });

  it('getLastWeeklyReset is exactly 7 days before the next one and not in the future', () => {
    const now = iso('2026-01-15T12:00:00Z');
    for (const region of ['na', 'eu', 'asia', 'tw'] as const) {
      const last = getLastWeeklyReset(region, now);
      const next = getNextWeeklyReset(region, now);
      expect(next.getTime() - last.getTime()).toBe(7 * 24 * 3600 * 1000);
      expect(last.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it('handles year boundaries', () => {
    // 2025-12-29 is a Monday; 2026-01-05 the next one.
    expect(getNextWeeklyReset('na', iso('2025-12-31T12:00:00Z')).toISOString()).toBe('2026-01-05T09:00:00.000Z');
  });
});

describe('serverWallToDate', () => {
  it('converts server wall clock to the real instant', () => {
    expect(serverWallToDate('na', 2026, 1, 16).toISOString()).toBe('2026-01-16T09:00:00.000Z');
    expect(serverWallToDate('asia', 2026, 1, 16, 4).toISOString()).toBe('2026-01-15T20:00:00.000Z');
    expect(serverWallToDate('eu', 2026, 2, 1, 4, 30).toISOString()).toBe('2026-02-01T03:30:00.000Z');
  });

  it('normalises month overflow', () => {
    expect(serverWallToDate('na', 2026, 13, 1).toISOString()).toBe('2027-01-01T09:00:00.000Z');
  });
});

describe('parseHoyoRegion', () => {
  it.each([
    ['os_usa', 'na'],
    ['os_euro', 'eu'],
    ['os_asia', 'asia'],
    ['os_cht', 'tw'],
    ['OS_USA', 'na'],
  ])('%s → %s', (param, expected) => {
    expect(parseHoyoRegion(param)).toBe(expected);
  });

  it('returns null for unknown or missing values', () => {
    expect(parseHoyoRegion('cn_gf01')).toBeNull();
    expect(parseHoyoRegion('')).toBeNull();
    expect(parseHoyoRegion(null)).toBeNull();
    expect(parseHoyoRegion(undefined)).toBeNull();
  });
});
