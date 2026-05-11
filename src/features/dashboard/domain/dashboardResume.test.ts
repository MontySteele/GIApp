import { describe, expect, it } from 'vitest';
import { buildDashboardResumeAction } from './dashboardResume';
import type { TargetSummary } from '@/features/targets/domain/targetSummary';

const fresh = {
  status: 'fresh' as const,
  label: 'Account data current',
  detail: 'Last GOOD import was today.',
};

function target(overrides: Partial<TargetSummary> = {}): TargetSummary {
  return {
    id: 'campaign:1',
    source: 'campaign',
    kind: 'pull',
    status: 'active',
    title: 'Recruit Furina',
    subtitle: 'Furina',
    priority: 1,
    href: '/campaigns/1',
    actionHref: '/campaigns/1',
    actionLabel: 'Open Target',
    characterKeys: ['Furina'],
    ...overrides,
  };
}

describe('dashboard resume action', () => {
  it('prioritizes active target next actions', () => {
    expect(buildDashboardResumeAction({
      targets: [target({
        nextAction: {
          id: 'pulls',
          category: 'pulls',
          label: 'Save 38 more pulls',
          detail: '52/90 pulls ready.',
          priority: 1,
        },
      })],
      accountFreshness: fresh,
      characterCount: 10,
      wishHistoryCount: 20,
    })).toEqual({
      title: 'Resume Recruit Furina',
      detail: 'Save 38 more pulls',
      href: '/campaigns/1',
      actionLabel: 'Open Target',
      priority: 'target',
    });
  });

  it('falls back to import and manual setup before asking for a target', () => {
    expect(buildDashboardResumeAction({
      targets: [target({ nextAction: undefined })],
      accountFreshness: fresh,
      characterCount: 10,
      wishHistoryCount: 20,
    })).toMatchObject({
      title: 'Continue Recruit Furina',
      detail: 'Furina',
      href: '/campaigns/1',
      priority: 'target',
    });

    expect(buildDashboardResumeAction({
      targets: [],
      accountFreshness: {
        status: 'missing',
        label: 'Import account data',
        detail: 'Refresh account data.',
      },
      characterCount: 0,
      wishHistoryCount: 0,
    }).priority).toBe('import');

    expect(buildDashboardResumeAction({
      targets: [],
      accountFreshness: fresh,
      characterCount: 4,
      wishHistoryCount: 0,
    })).toMatchObject({
      title: 'Add pity or wishes',
      href: '/imports',
      priority: 'manual',
    });

    expect(buildDashboardResumeAction({
      targets: [],
      accountFreshness: fresh,
      characterCount: 4,
      wishHistoryCount: 12,
    })).toMatchObject({
      title: 'Start your first target',
      href: '/campaigns',
      priority: 'start',
    });
  });
});
