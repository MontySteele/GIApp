import { describe, expect, it } from 'vitest';
import {
  calculateAvailablePulls,
  calculateEventPulls,
  calculatePullAvailability,
  type LedgerResourceSnapshot,
} from './resourceCalculations';

const resources: LedgerResourceSnapshot = {
  primogems: 2999,
  genesisCrystals: 587,
  intertwined: 8,
  acquaint: 26,
  starglitter: 66,
};

describe('resourceCalculations pull availability', () => {
  it('separates event-banner pulls from standard wishes', () => {
    const availability = calculatePullAvailability(resources);

    expect(availability.eventPulls).toBe(43);
    expect(availability.standardPulls).toBe(26);
    expect(availability.allWishes).toBe(69);
  });

  it('keeps calculateAvailablePulls as the all-wishes ledger total', () => {
    expect(calculateAvailablePulls(resources)).toBe(69);
  });

  it('calculates event pulls without Acquaint Fates', () => {
    expect(calculateEventPulls(resources)).toBe(43);
  });
});
