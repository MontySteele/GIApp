import { describe, expect, it, vi } from 'vitest';
import { runSimulation, type SimulationInput } from './montecarlo.worker';

vi.mock('comlink', () => ({
  expose: vi.fn(),
}));

function createBaseInput(overrides: Partial<SimulationInput>): SimulationInput {
  return {
    targets: [],
    startingPity: 0,
    startingGuaranteed: false,
    startingRadiantStreak: 0,
    startingFatePoints: 0,
    startingPulls: 1,
    incomePerDay: 0,
    config: { iterations: 1, seed: 1, chunkSize: 1 },
    ...overrides,
  };
}

describe('montecarlo worker', () => {
  it('keeps legacy starting pity from contaminating inherited cross-banner targets', async () => {
    const result = await runSimulation(
      createBaseInput({
        startingPity: 89,
        startingGuaranteed: true,
        targets: [
          {
            id: 'weapon-target',
            characterKey: 'Signature Weapon',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            expectedEndDate: '2026-01-01T00:00:00.000Z',
            priority: 5,
            maxPullBudget: 0,
            isConfirmed: true,
            notes: '',
            createdAt: '',
            updatedAt: '',
            bannerType: 'weapon',
            copiesNeeded: 1,
          },
          {
            id: 'character-target',
            characterKey: 'Furina',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            expectedEndDate: '2026-01-01T00:00:00.000Z',
            priority: 1,
            maxPullBudget: null,
            isConfirmed: true,
            notes: '',
            createdAt: '',
            updatedAt: '',
            bannerType: 'character',
            copiesNeeded: 1,
          },
        ],
        perTargetStates: [
          { pity: 41, guaranteed: false, radiantStreak: 0, fatePoints: 1 },
          { pity: null, guaranteed: null, radiantStreak: null, fatePoints: null },
        ],
      })
    );

    expect(result.perCharacter[1]?.characterKey).toBe('Furina');
    expect(result.perCharacter[1]?.constellations[0]?.probability).toBe(0);
  });

  it('keeps per-target pity states attached after date sorting', async () => {
    const result = await runSimulation(
      createBaseInput({
        targets: [
          {
            id: 'character-target',
            characterKey: 'Furina',
            expectedStartDate: '2026-02-01T00:00:00.000Z',
            expectedEndDate: '2026-02-01T00:00:00.000Z',
            priority: 1,
            maxPullBudget: null,
            isConfirmed: true,
            notes: '',
            createdAt: '',
            updatedAt: '',
            bannerType: 'character',
            copiesNeeded: 1,
          },
          {
            id: 'weapon-target',
            characterKey: 'Signature Weapon',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            expectedEndDate: '2026-01-01T00:00:00.000Z',
            priority: 5,
            maxPullBudget: 0,
            isConfirmed: true,
            notes: '',
            createdAt: '',
            updatedAt: '',
            bannerType: 'weapon',
            copiesNeeded: 1,
          },
        ],
        perTargetStates: [
          { pity: 89, guaranteed: true, radiantStreak: 0, fatePoints: 0 },
          { pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 0 },
        ],
      })
    );

    const characterResult = result.perCharacter.find((target) => target.characterKey === 'Furina');
    expect(characterResult?.constellations[0]?.probability).toBe(1);
  });

  it('supports chronicled banner targets', async () => {
    const result = await runSimulation(
      createBaseInput({
        targets: [
          {
            id: 'chronicled-target',
            characterKey: 'Chronicled Target',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            expectedEndDate: '2026-01-01T00:00:00.000Z',
            priority: 1,
            maxPullBudget: null,
            isConfirmed: true,
            notes: '',
            createdAt: '',
            updatedAt: '',
            bannerType: 'chronicled',
            copiesNeeded: 1,
          },
        ],
        perTargetStates: [
          { pity: 89, guaranteed: true, radiantStreak: 0, fatePoints: 0 },
        ],
      })
    );

    expect(result.perCharacter[0]).toMatchObject({
      characterKey: 'Chronicled Target',
      bannerType: 'chronicled',
    });
  });

  const baseTarget = {
    expectedEndDate: '',
    priority: 1 as const,
    maxPullBudget: null,
    isConfirmed: true,
    notes: '',
    createdAt: '',
    updatedAt: '',
    copiesNeeded: 1,
  };

  it('applies Epitomized Path on the weapon banner: charted weapon is certain within 160 pulls', async () => {
    const result = await runSimulation(
      createBaseInput({
        startingPulls: 160,
        targets: [
          {
            ...baseTarget,
            id: 'weapon-target',
            characterKey: 'Aqua Simulacra (R1)',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            bannerType: 'weapon',
          },
        ],
        perTargetStates: [{ pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 0 }],
        config: { iterations: 2000, seed: 7, chunkSize: 500 },
      })
    );

    expect(result.perCharacter[0]?.constellations[0]?.probability).toBe(1);
  });

  it('a starting fate point makes the next weapon 5★ the charted one', async () => {
    const result = await runSimulation(
      createBaseInput({
        startingPulls: 80,
        targets: [
          {
            ...baseTarget,
            id: 'weapon-target',
            characterKey: 'Aqua Simulacra (R1)',
            expectedStartDate: '2026-01-01T00:00:00.000Z',
            bannerType: 'weapon',
          },
        ],
        perTargetStates: [{ pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 1 }],
        config: { iterations: 1000, seed: 11, chunkSize: 500 },
      })
    );

    expect(result.perCharacter[0]?.constellations[0]?.probability).toBe(1);
  });

  it('counts daily income once per interval, not once per target', async () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const in10Days = new Date(now + 10 * day).toISOString();
    const in20Days = new Date(now + 20 * day).toISOString();

    const result = await runSimulation(
      createBaseInput({
        startingPulls: 0,
        incomePerDay: 1,
        targets: [
          { ...baseTarget, id: 'first', characterKey: 'First', expectedStartDate: in10Days, bannerType: 'character' },
          { ...baseTarget, id: 'second', characterKey: 'Second', expectedStartDate: in20Days, bannerType: 'character' },
        ],
        // Both targets impossible (pity 0, budget only from income): we only inspect the timeline.
        perTargetStates: [
          { pity: 0, guaranteed: true, radiantStreak: 0, fatePoints: 0 },
          { pity: 0, guaranteed: true, radiantStreak: 0, fatePoints: 0 },
        ],
        config: { iterations: 1, seed: 1, chunkSize: 1 },
      })
    );

    // Second banner: 20 days of income minus pulls used on the first banner, never 10 + 20 = 30.
    const second = result.pullTimeline[1]!;
    expect(second.projectedPulls).toBeLessThanOrEqual(19);
    const first = result.pullTimeline[0]!;
    expect(first.projectedPulls).toBeLessThanOrEqual(9);
  });
});
