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

export function buildDashboardResumeAction({
  targets,
  accountFreshness,
  characterCount,
  wishHistoryCount,
}: DashboardResumeInput): DashboardResumeAction {
  const target = firstOpenTarget(targets);

  if (target?.nextAction) {
    return {
      title: `Resume ${target.title}`,
      detail: target.nextAction.label,
      href: target.href,
      actionLabel: 'Open Target',
      priority: 'target',
    };
  }

  if (target) {
    return {
      title: `Continue ${target.title}`,
      detail: target.subtitle,
      href: target.href,
      actionLabel: target.actionLabel,
      priority: 'target',
    };
  }

  if (characterCount === 0 || accountFreshness.status === 'missing') {
    return {
      title: 'Import your roster',
      detail: accountFreshness.detail || 'Roster data unlocks target and farming recommendations.',
      href: '/imports',
      actionLabel: 'Open Import Hub',
      priority: 'import',
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

  return {
    title: 'Start your first target',
    detail: 'Pick a character or team and turn it into a daily next action.',
    href: '/campaigns',
    actionLabel: 'New Target',
    priority: 'start',
  };
}
