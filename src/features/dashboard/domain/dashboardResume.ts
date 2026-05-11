import type { AccountDataFreshness } from '@/features/sync';
import type { TargetSummary } from '@/features/targets/domain/targetSummary';

export interface DashboardResumeInput {
  targets: TargetSummary[];
  accountFreshness: Pick<AccountDataFreshness, 'status' | 'label' | 'detail'>;
  characterCount: number;
  wishHistoryCount: number;
}

export interface DashboardResumeAction {
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  priority: 'target' | 'import' | 'manual' | 'start';
}

function firstOpenTarget(targets: TargetSummary[]): TargetSummary | undefined {
  return targets.find((target) => target.status === 'active' || target.status === 'paused') ?? targets[0];
}

function firstUserTarget(targets: TargetSummary[]): TargetSummary | undefined {
  return firstOpenTarget(targets.filter((target) => target.source !== 'owned-character'));
}

export function buildDashboardResumeAction({
  targets,
  accountFreshness,
  characterCount,
  wishHistoryCount,
}: DashboardResumeInput): DashboardResumeAction {
  const userTarget = firstUserTarget(targets);

  if (characterCount === 0 || accountFreshness.status === 'missing') {
    return {
      title: 'Import your roster',
      detail: accountFreshness.detail || 'Roster data unlocks target and farming recommendations.',
      href: '/imports',
      actionLabel: 'Open Import Hub',
      priority: 'import',
    };
  }

  if (accountFreshness.status === 'stale') {
    return {
      title: 'Refresh account data',
      detail: accountFreshness.detail || 'Refresh imports before trusting target readiness.',
      href: '/imports',
      actionLabel: 'Refresh Import',
      priority: 'import',
    };
  }

  if (userTarget?.nextAction) {
    return {
      title: `Resume ${userTarget.title}`,
      detail: userTarget.nextAction.label,
      href: userTarget.href,
      actionLabel: 'Open Target',
      priority: 'target',
    };
  }

  if (userTarget) {
    return {
      title: `Continue ${userTarget.title}`,
      detail: userTarget.subtitle,
      href: userTarget.href,
      actionLabel: userTarget.actionLabel,
      priority: 'target',
    };
  }

  if (wishHistoryCount === 0) {
    return {
      title: 'Add pity or wishes',
      detail: 'Manual pity and pull counts are enough to get useful target odds.',
      href: '/imports',
      actionLabel: 'Set Up Pulls',
      priority: 'manual',
    };
  }

  const suggestedTarget = firstOpenTarget(targets);
  if (suggestedTarget) {
    return {
      title: suggestedTarget.title,
      detail: suggestedTarget.subtitle,
      href: suggestedTarget.actionHref,
      actionLabel: suggestedTarget.actionLabel,
      priority: 'start',
    };
  }

  return {
    title: 'Start your first target',
    detail: 'Pick a character or team and turn it into a daily next action.',
    href: '/campaigns',
    actionLabel: 'New Target',
    priority: 'start',
  };
}
