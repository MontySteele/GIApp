import { describe, it, expect } from 'vitest';
import { buildQuickPrimoSnapshot } from './quickSnapshot';
import type { ResourceSnapshot } from '@/types';

function makeSnapshot(overrides: Partial<ResourceSnapshot> = {}): ResourceSnapshot {
  return {
    id: 'snap-1',
    timestamp: '2026-04-01T12:00:00.000Z',
    createdAt: '2026-04-01T12:00:00.000Z',
    primogems: 1000,
    genesisCrystals: 50,
    intertwined: 12,
    acquaint: 4,
    starglitter: 30,
    stardust: 800,
    ...overrides,
  };
}

describe('buildQuickPrimoSnapshot', () => {
  it('inherits all non-primo fields from the latest snapshot', () => {
    const latest = makeSnapshot();

    const result = buildQuickPrimoSnapshot(latest, 9999);

    expect(result).toEqual({
      primogems: 9999,
      genesisCrystals: 50,
      intertwined: 12,
      acquaint: 4,
      starglitter: 30,
      stardust: 800,
    });
  });

  it('overrides the primogems field with the supplied value', () => {
    const latest = makeSnapshot({ primogems: 1000 });

    const result = buildQuickPrimoSnapshot(latest, 2500);

    expect(result.primogems).toBe(2500);
  });

  it('defaults all fields to 0 when no previous snapshot exists', () => {
    const result = buildQuickPrimoSnapshot(undefined, 500);

    expect(result).toEqual({
      primogems: 500,
      genesisCrystals: 0,
      intertwined: 0,
      acquaint: 0,
      starglitter: 0,
      stardust: 0,
    });
  });

  it('preserves zero-valued inherited fields instead of falling back to defaults', () => {
    const latest = makeSnapshot({
      genesisCrystals: 0,
      intertwined: 0,
      acquaint: 0,
      starglitter: 0,
      stardust: 0,
    });

    const result = buildQuickPrimoSnapshot(latest, 42);

    expect(result).toEqual({
      primogems: 42,
      genesisCrystals: 0,
      intertwined: 0,
      acquaint: 0,
      starglitter: 0,
      stardust: 0,
    });
  });

  it('accepts 0 as a valid primogem entry', () => {
    const latest = makeSnapshot({ primogems: 1000, intertwined: 7 });

    const result = buildQuickPrimoSnapshot(latest, 0);

    expect(result.primogems).toBe(0);
    expect(result.intertwined).toBe(7);
  });
});
