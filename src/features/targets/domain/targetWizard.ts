import { buildCampaignPrefillUrl } from '@/features/campaigns/lib/campaignLinks';
import { getDisplayName } from '@/lib/gameData';
import type { CampaignBuildGoal } from '@/types';

export type TargetWizardMode = 'get-character' | 'build-character' | 'polish-team';

export interface TargetWizardState {
  mode: TargetWizardMode;
  characterKey: string;
  teamId: string;
  buildGoal: CampaignBuildGoal;
  deadline: string;
  savedPulls: string;
  currentPity: string;
  currentConstellation: string;
  targetConstellation: string;
  pullBudget: string;
  guaranteed: boolean;
  useWishHistory: boolean;
}

export interface TargetWizardPreview {
  canCreate: boolean;
  title: string;
  summary: string;
  createHref: string;
  calculatorHref?: string;
  desiredCopies: number;
  pullShortfall: number;
  pullsPerDay: number | null;
  readinessPercent: number | null;
  adviceRows: string[];
}

interface PreviewOptions {
  now?: Date;
}

function positiveInteger(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeInteger(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function parseConstellationInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : null;
}

export function isValidConstellationInput(value: string): boolean {
  return !value.trim() || parseConstellationInput(value) !== null;
}

function daysUntil(deadline: string, now: Date): number | null {
  if (!deadline) return null;
  const target = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Math.max(1, Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildCalculatorHref(characterKey: string, desiredCopies: number, savedPulls: number, currentPity: number): string {
  const params = new URLSearchParams();
  params.set('mode', 'multi');
  params.append('target', JSON.stringify({
    name: characterKey,
    banner: 'character',
    copies: desiredCopies,
  }));

  if (savedPulls > 0) {
    params.set('pulls', String(savedPulls));
  }
  if (currentPity > 0) {
    params.set('pity', String(currentPity));
  }

  return `/pulls/calculator?${params.toString()}`;
}

function characterLabel(characterKey: string): string {
  return characterKey ? getDisplayName(characterKey) : 'a character';
}

export function buildTargetWizardPreview(
  state: TargetWizardState,
  options: PreviewOptions = {}
): TargetWizardPreview {
  const now = options.now ?? new Date();
  const constellation = parseConstellationInput(state.targetConstellation);
  const currentConstellation = parseConstellationInput(state.currentConstellation);
  const desiredCopies = state.mode === 'get-character' && constellation !== null
    ? Math.max(1, currentConstellation === null ? constellation + 1 : constellation - currentConstellation)
    : 1;
  const savedPulls = nonNegativeInteger(state.savedPulls);
  const currentPity = Math.min(89, nonNegativeInteger(state.currentPity));
  const pullBudget = positiveInteger(state.pullBudget);
  const daysRemaining = daysUntil(state.deadline, now);
  const hardPityTarget = 90 * desiredCopies;
  const pullProgress = savedPulls + currentPity;
  const pullShortfall = state.mode === 'get-character'
    ? Math.max(0, hardPityTarget - pullProgress)
    : 0;
  const pullsPerDay = daysRemaining && pullShortfall > 0
    ? Number((pullShortfall / daysRemaining).toFixed(1))
    : null;
  const readinessPercent = state.mode === 'get-character'
    ? Math.min(100, Math.round((pullProgress / hardPityTarget) * 100))
    : null;
  const hasCharacter = Boolean(state.characterKey.trim());
  const hasTeam = Boolean(state.teamId.trim());
  const canCreate = state.mode === 'polish-team' ? hasTeam : hasCharacter;
  const displayName = characterLabel(state.characterKey);
  const adviceRows: string[] = [];

  if (state.mode === 'get-character') {
    if (pullShortfall === 0) {
      adviceRows.push('Worst case: you cover hard pity with current pulls and pity.');
    } else {
      adviceRows.push(`Worst case: you need ${pullShortfall} more ${pullShortfall === 1 ? 'pull' : 'pulls'} before the banner target.`);
    }

    if (pullsPerDay !== null) {
      adviceRows.push(`${pullsPerDay} pulls/day until your deadline.`);
    }

    if (state.guaranteed) {
      adviceRows.push('Guarantee is active, so the next character five-star is featured.');
    }

    if (!state.useWishHistory) {
      adviceRows.push('Manual mode is enough to start; importing wish history can refine the odds later.');
    }
  } else if (state.mode === 'build-character') {
    adviceRows.push(`Create a build target for ${displayName} and let imports fill in material gaps.`);
  } else {
    adviceRows.push('Create a team polish target to group member farming and build work.');
  }

  if (pullBudget > 0 && pullShortfall > pullBudget) {
    adviceRows.push(`Budget warning: ${pullBudget} pulls is below the current hard-pity shortfall.`);
  }

  const createHref = state.mode === 'polish-team'
    ? buildCampaignPrefillUrl({
      teamId: state.teamId,
      buildGoal: state.buildGoal,
      ...(state.deadline ? { deadline: state.deadline } : {}),
    })
    : buildCampaignPrefillUrl({
      campaignType: state.mode === 'get-character' ? 'character-acquisition' : 'character-polish',
      characterKey: state.characterKey,
      buildGoal: state.buildGoal,
      includePullTarget: state.mode === 'get-character',
      ...(state.deadline ? { deadline: state.deadline } : {}),
      ...(pullBudget > 0 ? { maxPullBudget: pullBudget } : {}),
      ...(state.mode === 'get-character' ? { desiredCopies } : {}),
      ...(constellation !== null && state.mode === 'get-character' ? { targetConstellation: constellation } : {}),
    });

  return {
    canCreate,
    title: state.mode === 'get-character'
      ? `Get ${displayName}`
      : state.mode === 'build-character'
        ? `Build ${displayName}`
        : 'Polish a team',
    summary: state.mode === 'get-character'
      ? `${readinessPercent}% hard-pity coverage`
      : 'Ready to create a planning target',
    createHref,
    ...(state.mode === 'get-character' && hasCharacter
      ? { calculatorHref: buildCalculatorHref(state.characterKey, desiredCopies, savedPulls, currentPity) }
      : {}),
    desiredCopies,
    pullShortfall,
    pullsPerDay,
    readinessPercent,
    adviceRows,
  };
}
