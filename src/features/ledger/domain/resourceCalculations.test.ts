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

    expect(Math.floor(availability.eventPulls)).toBe(43);
    expect(availability.standardPulls).toBe(26);
    expect(Math.floor(availability.allWishes)).toBe(69);
  });

  it('keeps calculateAvailablePulls as the all-wishes ledger total', () => {
    expect(Math.floor(calculateAvailablePulls(resources))).toBe(69);
  });

  it('calculates event pulls without Acquaint Fates', () => {
    expect(Math.floor(calculateEventPulls(resources))).toBe(43);
  });
});
