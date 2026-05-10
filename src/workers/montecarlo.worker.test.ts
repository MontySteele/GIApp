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
});
