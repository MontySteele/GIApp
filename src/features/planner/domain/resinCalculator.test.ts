import { describe, it, expect } from 'vitest';
import { isDomainAvailableToday, getNextDomainDay } from './resinCalculator';

describe('resinCalculator domain schedule by server region', () => {
  // 2026-01-12T22:00Z: Monday 17:00 on NA, Tuesday 06:00 on Asia
  const instant = new Date('2026-01-12T22:00:00Z');

  it('isDomainAvailableToday follows the region game day', () => {
    expect(isDomainAvailableToday('monday', 'na', instant)).toBe(true);
    expect(isDomainAvailableToday('tuesday', 'na', instant)).toBe(false);
    expect(isDomainAvailableToday('monday', 'asia', instant)).toBe(false);
    expect(isDomainAvailableToday('tuesday', 'asia', instant)).toBe(true);
  });

  it('treats 00:00-03:59 server time as the previous day', () => {
    // NA Tuesday 02:00 server == 07:00Z Tuesday; game day still Monday
    expect(isDomainAvailableToday('monday', 'na', new Date('2026-01-13T07:00:00Z'))).toBe(true);
    expect(isDomainAvailableToday('monday', 'na', new Date('2026-01-13T09:00:00Z'))).toBe(false);
  });

  it('getNextDomainDay returns today when open, otherwise the next open day', () => {
    expect(getNextDomainDay('monday', 'na', instant).getTime()).toBe(instant.getTime());
    const next = getNextDomainDay('monday', 'asia', instant); // Tue -> Thu (2 days)
    expect(Math.round((next.getTime() - instant.getTime()) / 86400000)).toBe(2);
  });
});
