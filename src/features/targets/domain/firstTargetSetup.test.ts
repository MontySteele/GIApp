import { describe, expect, it } from 'vitest';
import { buildFirstTargetResourceActions, buildFirstTargetSetupState } from './firstTargetSetup';

describe('buildFirstTargetSetupState', () => {
  it('starts with roster import when no account data exists', () => {
    const setup = buildFirstTargetSetupState({
      characterCount: 0,
      wishHistoryCount: 0,
      resourceSnapshotCount: 0,
      targetCount: 0,
      accountFreshnessStatus: 'missing',
      accountFreshnessDetail: 'No import yet.',
    });

    expect(setup.activeStep).toBe('import-roster');
    expect(setup.primaryAction).toEqual({ label: 'Import Roster', href: '/roster?import=irminsul' });
    expect(setup.detail).toBe('No import yet.');
  });

  it('keeps stale roster refresh ahead of creating another target', () => {
    const setup = buildFirstTargetSetupState({
      characterCount: 8,
      wishHistoryCount: 12,
      resourceSnapshotCount: 1,
      targetCount: 0,
      accountFreshnessStatus: 'stale',
    });

    expect(setup.activeStep).toBe('import-roster');
    expect(setup.primaryAction.label).toBe('Refresh Account Data');
    expect(setup.steps.find((step) => step.id === 'import-roster')?.isComplete).toBe(false);
  });

  it('moves to pull setup after fresh roster data exists', () => {
    const setup = buildFirstTargetSetupState({
      characterCount: 4,
      wishHistoryCount: 0,
      resourceSnapshotCount: 0,
      availablePulls: 0,
      targetCount: 0,
      accountFreshnessStatus: 'fresh',
    });

    expect(setup.activeStep).toBe('set-pulls');
    expect(setup.primaryAction).toEqual({ label: 'Set Resources', href: '/pulls' });
    expect(setup.steps.find((step) => step.id === 'import-roster')?.isComplete).toBe(true);
  });

  it('moves to target selection when pull data is available', () => {
    const setup = buildFirstTargetSetupState({
      characterCount: 4,
      wishHistoryCount: 0,
      resourceSnapshotCount: 1,
      targetCount: 0,
      accountFreshnessStatus: 'fresh',
    });

    expect(setup.activeStep).toBe('choose-target');
    expect(setup.primaryAction).toEqual({ label: 'Choose First Target', href: '/campaigns' });
    expect(setup.steps.find((step) => step.id === 'set-pulls')?.isComplete).toBe(true);
  });

  it('lands on review when a target already exists', () => {
    const setup = buildFirstTargetSetupState({
      characterCount: 4,
      wishHistoryCount: 30,
      resourceSnapshotCount: 1,
      targetCount: 1,
      accountFreshnessStatus: 'fresh',
    });

    expect(setup.activeStep).toBe('review-plan');
    expect(setup.title).toBe('First target is ready');
    expect(setup.primaryAction).toEqual({ label: 'Review Targets', href: '/campaigns' });
  });
});

describe('buildFirstTargetResourceActions', () => {
  it('shares first-target resource routes with the setup domain', () => {
    expect(buildFirstTargetResourceActions()).toEqual([
      {
        id: 'set-resources',
        href: '/pulls#resource-snapshot',
        label: 'Set Current Resources',
        detail: 'Save your primogems, fates, and starglitter as the starting budget.',
      },
      {
        id: 'import-wishes',
        href: '/pulls/history',
        label: 'Import Wish History',
        detail: 'Use real pity and guarantee state when you are ready to connect history.',
      },
      {
        id: 'enter-pity',
        href: '/pulls/calculator',
        label: 'Enter Pity Manually',
        detail: 'Skip imports and start the first target from saved pulls and pity.',
      },
      {
        id: 'choose-target',
        href: '/campaigns',
        label: 'Choose First Target',
        detail: 'Turn the budget into a character, build, or team plan.',
      },
    ]);
  });
});
