import type { AccountDataFreshnessStatus } from '@/features/sync/hooks/useAccountDataFreshness';

export type FirstTargetSetupStepId = 'import-roster' | 'set-pulls' | 'choose-target' | 'review-plan';

export interface FirstTargetSetupInput {
  characterCount: number;
  wishHistoryCount: number;
  targetCount: number;
  accountFreshnessStatus: AccountDataFreshnessStatus;
  accountFreshnessDetail?: string;
  resourceSnapshotCount?: number;
  availablePulls?: number;
}

export interface FirstTargetSetupStep {
  id: FirstTargetSetupStepId;
  label: string;
  detail: string;
  isActive: boolean;
  isComplete: boolean;
}

export interface FirstTargetSetupAction {
  label: string;
  href: string;
}

export interface FirstTargetSetupState {
  activeStep: FirstTargetSetupStepId;
  title: string;
  detail: string;
  statusLabel: string;
  primaryAction: FirstTargetSetupAction;
  secondaryActions: FirstTargetSetupAction[];
  steps: FirstTargetSetupStep[];
}

export type FirstTargetResourceActionId = 'set-resources' | 'import-wishes' | 'enter-pity' | 'choose-target';

export interface FirstTargetResourceAction extends FirstTargetSetupAction {
  id: FirstTargetResourceActionId;
  detail: string;
}

export const FIRST_TARGET_SETUP_ROUTES = {
  importRoster: '/roster?import=irminsul',
  pulls: '/pulls',
  resourceSnapshot: '/pulls#resource-snapshot',
  calculator: '/pulls/calculator',
  wishHistory: '/pulls/history',
  campaigns: '/campaigns',
  banners: '/pulls/banners',
  roster: '/roster',
  imports: '/imports',
  dashboard: '/',
  materials: '/campaigns/materials',
} as const;

const STEP_CONTENT: Record<FirstTargetSetupStepId, Pick<FirstTargetSetupStep, 'label' | 'detail'>> = {
  'import-roster': {
    label: 'Import roster',
    detail: 'Bring in characters, weapons, artifacts, and materials.',
  },
  'set-pulls': {
    label: 'Set pulls',
    detail: 'Add current resources, pity, or wish history.',
  },
  'choose-target': {
    label: 'Choose target',
    detail: 'Pick the first character or team goal.',
  },
  'review-plan': {
    label: 'Review plan',
    detail: "Use the target plan for today's next action.",
  },
};

const SETUP_ORDER: FirstTargetSetupStepId[] = [
  'import-roster',
  'set-pulls',
  'choose-target',
  'review-plan',
];

function hasPullSetup(input: FirstTargetSetupInput): boolean {
  return (
    input.wishHistoryCount > 0 ||
    (input.resourceSnapshotCount ?? 0) > 0 ||
    (input.availablePulls ?? 0) > 0
  );
}

function getActiveStep(input: FirstTargetSetupInput): FirstTargetSetupStepId {
  if (input.targetCount > 0) return 'review-plan';
  if (input.characterCount === 0 || input.accountFreshnessStatus !== 'fresh') return 'import-roster';
  if (!hasPullSetup(input)) return 'set-pulls';
  return 'choose-target';
}

function isStepComplete(step: FirstTargetSetupStepId, input: FirstTargetSetupInput): boolean {
  switch (step) {
    case 'import-roster':
      return input.characterCount > 0 && input.accountFreshnessStatus === 'fresh';
    case 'set-pulls':
      return hasPullSetup(input);
    case 'choose-target':
    case 'review-plan':
      return input.targetCount > 0;
  }
}

function buildPrimaryAction(
  activeStep: FirstTargetSetupStepId,
  input: FirstTargetSetupInput
): FirstTargetSetupAction {
  if (activeStep === 'import-roster') {
    return {
      label: input.characterCount > 0 ? 'Refresh Account Data' : 'Import Roster',
      href: FIRST_TARGET_SETUP_ROUTES.importRoster,
    };
  }

  if (activeStep === 'set-pulls') {
    return {
      label: 'Set Resources',
      href: FIRST_TARGET_SETUP_ROUTES.pulls,
    };
  }

  if (activeStep === 'choose-target') {
    return {
      label: 'Choose First Target',
      href: FIRST_TARGET_SETUP_ROUTES.campaigns,
    };
  }

  return {
    label: 'Review Targets',
    href: FIRST_TARGET_SETUP_ROUTES.campaigns,
  };
}

function buildSecondaryActions(activeStep: FirstTargetSetupStepId): FirstTargetSetupAction[] {
  if (activeStep === 'import-roster') {
    return [
      { label: 'Use Manual Numbers', href: FIRST_TARGET_SETUP_ROUTES.calculator },
      { label: 'Import Hub', href: FIRST_TARGET_SETUP_ROUTES.imports },
    ];
  }

  if (activeStep === 'set-pulls') {
    return [
      { label: 'Enter Pity Manually', href: FIRST_TARGET_SETUP_ROUTES.calculator },
      { label: 'Import Wish History', href: FIRST_TARGET_SETUP_ROUTES.wishHistory },
    ];
  }

  if (activeStep === 'choose-target') {
    return [
      { label: 'Plan From Banners', href: FIRST_TARGET_SETUP_ROUTES.banners },
      { label: 'Review Roster', href: FIRST_TARGET_SETUP_ROUTES.roster },
    ];
  }

  return [
    { label: 'Dashboard', href: FIRST_TARGET_SETUP_ROUTES.dashboard },
    { label: 'Target Materials', href: FIRST_TARGET_SETUP_ROUTES.materials },
  ];
}

function buildStepDetail(activeStep: FirstTargetSetupStepId, input: FirstTargetSetupInput): string {
  if (activeStep === 'import-roster') {
    return input.accountFreshnessDetail || 'Import account data so farming, build, and pull advice starts from real progress.';
  }

  if (activeStep === 'set-pulls') {
    return 'Add a resource snapshot, import wishes, or enter pity manually so target odds have a useful starting point.';
  }

  if (activeStep === 'choose-target') {
    return 'Your account has enough setup to choose a first target and turn it into a daily plan.';
  }

  return 'Your first target exists. Open it to review readiness, deficits, and the next action.';
}

export function buildFirstTargetSetupState(input: FirstTargetSetupInput): FirstTargetSetupState {
  const activeStep = getActiveStep(input);

  return {
    activeStep,
    title: activeStep === 'review-plan' ? 'First target is ready' : 'Set up your first target',
    detail: buildStepDetail(activeStep, input),
    statusLabel: STEP_CONTENT[activeStep].label,
    primaryAction: buildPrimaryAction(activeStep, input),
    secondaryActions: buildSecondaryActions(activeStep),
    steps: SETUP_ORDER.map((step) => ({
      id: step,
      label: STEP_CONTENT[step].label,
      detail: STEP_CONTENT[step].detail,
      isActive: step === activeStep,
      isComplete: step !== activeStep && isStepComplete(step, input),
    })),
  };
}

export function buildFirstTargetResourceActions(): FirstTargetResourceAction[] {
  return [
    {
      id: 'set-resources',
      href: FIRST_TARGET_SETUP_ROUTES.resourceSnapshot,
      label: 'Set Current Resources',
      detail: 'Save your primogems, fates, and starglitter as the starting budget.',
    },
    {
      id: 'import-wishes',
      href: FIRST_TARGET_SETUP_ROUTES.wishHistory,
      label: 'Import Wish History',
      detail: 'Use real pity and guarantee state when you are ready to connect history.',
    },
    {
      id: 'enter-pity',
      href: FIRST_TARGET_SETUP_ROUTES.calculator,
      label: 'Enter Pity Manually',
      detail: 'Skip imports and start the first target from saved pulls and pity.',
    },
    {
      id: 'choose-target',
      href: FIRST_TARGET_SETUP_ROUTES.campaigns,
      label: 'Choose First Target',
      detail: 'Turn the budget into a character, build, or team plan.',
    },
  ];
}
