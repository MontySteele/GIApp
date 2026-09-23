import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AscensionSummary } from '@/lib/planning/ascensionCalculator';
import * as ascensionCalculator from '@/lib/planning/ascensionCalculator';
import { DAILY_RESIN_REGEN } from '@/features/planner/domain/resinCalculator';
import type { Character } from '@/types';
import type { DifficultyReadiness } from './readiness';
import {
  aggregateLevelingPlan,
  buildLevelingGoal,
  computeLevelingPlan,
  defaultSelection,
  selectLevelingCandidates,
} from './levelingPlan';

// The summary calculator is intercepted so goal construction can be asserted
// without material lookups; one test restores the real implementation.
const calculateAscensionSummaryMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/planning/ascensionCalculator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/planning/ascensionCalculator')>();
  return { ...actual, calculateAscensionSummary: calculateAscensionSummaryMock };
});

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-id-1',
    key: 'Xingqiu',
    level: 50,
    ascension: 2,
    constellation: 0,
    talent: { auto: 4, skill: 5, burst: 6 },
    weapon: { key: 'SacrificialSword', level: 70, ascension: 4, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'support',
    teamIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeSummary(overrides: Partial<AscensionSummary> = {}): AscensionSummary {
  return {
    characterKey: 'Xingqiu',
    materials: [],
    totalMora: 100_000,
    totalExp: 500_000,
    estimatedResin: 120,
    resinBreakdown: { talentBoss: 40, expMora: 80, total: 120 },
    estimatedDays: 1,
    canAscend: true,
    nextAscensionReady: true,
    ...overrides,
  };
}

function makeReadiness(overrides: Partial<DifficultyReadiness> = {}): DifficultyReadiness {
  return {
    difficulty: 'hard',
    required: 16,
    eligibleCount: 14,
    ready: false,
    shortfall: 2,
    eligible: [],
    nearMiss: [],
    blockedByUnlock: false,
    ...overrides,
  };
}

describe('selectLevelingCandidates', () => {
  it('should return the nearMiss set in nearMiss ordering', () => {
    const readiness = makeReadiness({
      nearMiss: [
        { key: 'Fischl', level: 69, levelsNeeded: 1 },
        { key: 'Kaeya', level: 55, levelsNeeded: 15 },
        { key: 'Xingqiu', level: 40, levelsNeeded: 30 },
      ],
    });

    expect(selectLevelingCandidates(readiness)).toEqual([
      { key: 'Fischl', level: 69, levelsNeeded: 1 },
      { key: 'Kaeya', level: 55, levelsNeeded: 15 },
      { key: 'Xingqiu', level: 40, levelsNeeded: 30 },
    ]);
  });

  it('should sort by levelsNeeded ascending with key as tie-break', () => {
    const readiness = makeReadiness({
      nearMiss: [
        { key: 'Zhongli', level: 60, levelsNeeded: 10 },
        { key: 'Amber', level: 60, levelsNeeded: 10 },
        { key: 'Barbara', level: 69, levelsNeeded: 1 },
      ],
    });

    expect(selectLevelingCandidates(readiness).map((candidate) => candidate.key)).toEqual([
      'Barbara',
      'Amber',
      'Zhongli',
    ]);
  });

  it('should return an empty list when nothing is near-missing', () => {
    expect(selectLevelingCandidates(makeReadiness())).toEqual([]);
  });

  it('should not mutate the readiness nearMiss array', () => {
    const nearMiss = [
      { key: 'Zhongli', level: 60, levelsNeeded: 10 },
      { key: 'Barbara', level: 69, levelsNeeded: 1 },
    ];
    selectLevelingCandidates(makeReadiness({ nearMiss }));

    expect(nearMiss[0]?.key).toBe('Zhongli');
  });
});

describe('defaultSelection', () => {
  it('should pick the first shortfall candidates', () => {
    const candidates = selectLevelingCandidates(
      makeReadiness({
        nearMiss: [
          { key: 'Fischl', level: 69, levelsNeeded: 1 },
          { key: 'Kaeya', level: 55, levelsNeeded: 15 },
          { key: 'Xingqiu', level: 40, levelsNeeded: 30 },
        ],
      })
    );

    expect(defaultSelection(candidates, 2)).toEqual(['Fischl', 'Kaeya']);
  });

  it('should cap at the number of candidates available', () => {
    const candidates = selectLevelingCandidates(
      makeReadiness({ nearMiss: [{ key: 'Fischl', level: 69, levelsNeeded: 1 }] })
    );

    expect(defaultSelection(candidates, 5)).toEqual(['Fischl']);
    expect(defaultSelection(candidates, 0)).toEqual([]);
  });
});

describe('buildLevelingGoal', () => {
  it('should target the difficulty floor with the matching ascension phase', () => {
    const goal = buildLevelingGoal(makeCharacter({ level: 55, ascension: 3 }), 70);

    expect(goal.characterKey).toBe('Xingqiu');
    expect(goal.currentLevel).toBe(55);
    expect(goal.targetLevel).toBe(70);
    expect(goal.currentAscension).toBe(3);
    expect(goal.targetAscension).toBe(ascensionCalculator.getAscensionPhase(70));
  });

  it('should leave talents unchanged so talent materials come out at zero', () => {
    const goal = buildLevelingGoal(makeCharacter({ talent: { auto: 4, skill: 5, burst: 6 } }), 60);

    expect(goal.currentTalents).toEqual({ auto: 4, skill: 5, burst: 6 });
    expect(goal.targetTalents).toEqual(goal.currentTalents);
  });
});

describe('aggregateLevelingPlan', () => {
  it('should sum resin, mora and exp across summaries', () => {
    const plan = aggregateLevelingPlan(
      [
        makeSummary({ characterKey: 'Fischl', estimatedResin: 100, totalMora: 10, totalExp: 1000 }),
        makeSummary({ characterKey: 'Kaeya', estimatedResin: 50, totalMora: 5, totalExp: 500 }),
      ],
      2
    );

    expect(plan.selectedKeys).toEqual(['Fischl', 'Kaeya']);
    expect(plan.totalResin).toBe(150);
    expect(plan.totalMora).toBe(15);
    expect(plan.totalExp).toBe(1500);
  });

  it('should compute daysNeeded by ceiling division at the daily resin budget', () => {
    const plan = aggregateLevelingPlan(
      [makeSummary({ estimatedResin: DAILY_RESIN_REGEN + 1 })],
      1
    );

    expect(plan.daysNeeded).toBe(2);
  });

  it('should honour an explicit daily resin budget', () => {
    const plan = aggregateLevelingPlan([makeSummary({ estimatedResin: 101 })], 1, 50);

    expect(plan.daysNeeded).toBe(3);
  });

  it('should report 0 days for a 0-resin plan', () => {
    const plan = aggregateLevelingPlan([makeSummary({ estimatedResin: 0 })], 1);

    expect(plan.totalResin).toBe(0);
    expect(plan.daysNeeded).toBe(0);
  });

  it('should report 0 days and an empty selection for no summaries', () => {
    const plan = aggregateLevelingPlan([], 0);

    expect(plan).toEqual({
      selectedKeys: [],
      totalResin: 0,
      totalMora: 0,
      totalExp: 0,
      daysNeeded: 0,
      coversShortfall: true,
    });
  });

  it('should set coversShortfall when the selection meets or exceeds the shortfall', () => {
    expect(aggregateLevelingPlan([makeSummary(), makeSummary()], 2).coversShortfall).toBe(true);
    expect(aggregateLevelingPlan([makeSummary(), makeSummary()], 1).coversShortfall).toBe(true);
  });

  it('should clear coversShortfall when there are fewer candidates than the shortfall', () => {
    expect(aggregateLevelingPlan([makeSummary()], 3).coversShortfall).toBe(false);
  });
});

describe('computeLevelingPlan', () => {
  beforeEach(() => {
    calculateAscensionSummaryMock.mockReset();
  });

  it('should call calculateAscensionSummary per selected character with an empty inventory', async () => {
    const spy = calculateAscensionSummaryMock.mockResolvedValue(
      makeSummary({ estimatedResin: 60, totalMora: 1, totalExp: 2 })
    );

    const characters = [
      makeCharacter({ id: '1', key: 'Fischl', level: 60, ascension: 3 }),
      makeCharacter({ id: '2', key: 'Kaeya', level: 50, ascension: 2 }),
      makeCharacter({ id: '3', key: 'Barbara', level: 20, ascension: 1 }),
    ];

    const plan = await computeLevelingPlan({
      characters,
      selectedKeys: ['Fischl', 'Kaeya'],
      minLevel: 70,
      shortfall: 2,
      skipApiFetch: true,
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        characterKey: 'Fischl',
        currentLevel: 60,
        targetLevel: 70,
        targetAscension: ascensionCalculator.getAscensionPhase(70),
      }),
      {},
      { skipApiFetch: true }
    );
    expect(plan.totalResin).toBe(120);
    expect(plan.coversShortfall).toBe(true);
  });

  it('should ignore selected keys that are not in the roster', async () => {
    const spy = calculateAscensionSummaryMock.mockResolvedValue(makeSummary());

    const plan = await computeLevelingPlan({
      characters: [makeCharacter({ key: 'Fischl' })],
      selectedKeys: ['Fischl', 'NotOwned'],
      minLevel: 70,
      shortfall: 2,
      skipApiFetch: true,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(plan.coversShortfall).toBe(false);
  });

  it('should match roster keys regardless of spacing and casing', async () => {
    const spy = calculateAscensionSummaryMock.mockResolvedValue(makeSummary());

    await computeLevelingPlan({
      characters: [makeCharacter({ key: 'Kuki Shinobu' })],
      selectedKeys: ['KukiShinobu'],
      minLevel: 70,
      shortfall: 1,
      skipApiFetch: true,
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should produce a real offline estimate with skipApiFetch and no network', async () => {
    const actual = await vi.importActual<typeof import('@/lib/planning/ascensionCalculator')>(
      '@/lib/planning/ascensionCalculator'
    );
    calculateAscensionSummaryMock.mockImplementation(actual.calculateAscensionSummary);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const plan = await computeLevelingPlan({
      characters: [makeCharacter({ key: 'Fischl', level: 50, ascension: 2 })],
      selectedKeys: ['Fischl'],
      minLevel: 70,
      shortfall: 1,
      skipApiFetch: true,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(plan.selectedKeys).toEqual(['Fischl']);
    expect(plan.totalMora).toBeGreaterThan(0);
    expect(plan.totalExp).toBeGreaterThan(0);
    expect(plan.daysNeeded).toBe(Math.ceil(plan.totalResin / DAILY_RESIN_REGEN));
  });
});
