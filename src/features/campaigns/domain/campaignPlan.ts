import type { AvailablePullsResult } from '@/lib/services/resourceService';
import {
  calculateMultiCharacterSummary,
  createGoalsFromCharacters,
  type AggregatedMaterialSummary,
  type MultiCharacterGoal,
} from '@/features/planner/domain/multiCharacterCalculator';
import type { MaterialRequirement } from '@/features/planner/domain/ascensionCalculator';
import { getDisplayName } from '@/lib/gameData';
import type { Campaign, CampaignBuildGoal, CampaignCharacterTarget, Character } from '@/types';

export type CampaignPlanStatus = 'ready' | 'attention' | 'blocked';
export type CampaignActionCategory = 'pulls' | 'materials' | 'build' | 'roster' | 'done';

export interface CampaignBuildTarget {
  level: number;
  ascension: number;
  talents: {
    auto: number;
    skill: number;
    burst: number;
  };
}

export interface CampaignCharacterReadiness {
  characterKey: string;
  characterId?: string;
  owned: boolean;
  buildGoal: CampaignBuildGoal;
  percent: number;
  missing: string[];
}

export interface CampaignPullReadiness {
  hasTargets: boolean;
  availablePulls: number;
  targetPulls: number;
  remainingPulls: number;
  percent: number;
  status: CampaignPlanStatus;
}

export interface CampaignBuildReadiness {
  targetCount: number;
  ownedCount: number;
  percent: number;
  status: CampaignPlanStatus;
  characters: CampaignCharacterReadiness[];
}

export interface CampaignMaterialReadiness {
  hasTargets: boolean;
  percent: number;
  status: CampaignPlanStatus;
  totalMaterials: number;
  readyMaterials: number;
  deficitMaterials: number;
  topDeficits: MaterialRequirement[];
  totalEstimatedResin: number;
  totalEstimatedDays: number;
  summary: AggregatedMaterialSummary | null;
  errors: string[];
}

export interface CampaignNextAction {
  id: string;
  category: CampaignActionCategory;
  label: string;
  detail: string;
  priority: 1 | 2 | 3;
  characterKey?: string;
  materialKey?: string;
}

export interface CampaignPlan {
  campaignId: string;
  overallPercent: number;
  status: CampaignPlanStatus;
  pullReadiness: CampaignPullReadiness;
  buildReadiness: CampaignBuildReadiness;
  materialReadiness: CampaignMaterialReadiness;
  nextActions: CampaignNextAction[];
}

export interface CampaignPlanContext {
  characters: Character[];
  materials: Record<string, number>;
  availablePulls: AvailablePullsResult;
}

const BUILD_TARGETS: Record<CampaignBuildGoal, CampaignBuildTarget> = {
  functional: {
    level: 80,
    ascension: 5,
    talents: { auto: 1, skill: 6, burst: 6 },
  },
  comfortable: {
    level: 80,
    ascension: 6,
    talents: { auto: 8, skill: 8, burst: 8 },
  },
  full: {
    level: 90,
    ascension: 6,
    talents: { auto: 10, skill: 10, burst: 10 },
  },
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function wholePulls(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function average(values: number[]): number {
  if (values.length === 0) return 100;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function statusFromPercent(percent: number): CampaignPlanStatus {
  if (percent >= 100) return 'ready';
  if (percent >= 50) return 'attention';
  return 'blocked';
}

function findCharacter(characters: Character[], key: string): Character | undefined {
  return characters.find((character) => character.key.toLowerCase() === key.toLowerCase());
}

export function getCampaignBuildTarget(goal: CampaignBuildGoal): CampaignBuildTarget {
  return BUILD_TARGETS[goal];
}

function calculateTargetProgress(character: Character, target: CampaignBuildTarget): number {
  const levelProgress = (character.level / target.level) * 100;
  const ascensionProgress = target.ascension === 0 ? 100 : (character.ascension / target.ascension) * 100;
  const talentProgress = average([
    (character.talent.auto / target.talents.auto) * 100,
    (character.talent.skill / target.talents.skill) * 100,
    (character.talent.burst / target.talents.burst) * 100,
  ]);

  return clampPercent(average([
    Math.min(levelProgress, 100),
    Math.min(ascensionProgress, 100),
    Math.min(talentProgress, 100),
  ]));
}

function getTargetMissing(character: Character, target: CampaignBuildTarget): string[] {
  const missing: string[] = [];

  if (character.level < target.level) {
    missing.push(`Lv. ${character.level}/${target.level}`);
  }
  if (character.ascension < target.ascension) {
    missing.push(`A${character.ascension}/A${target.ascension}`);
  }

  const talentParts: string[] = [];
  if (character.talent.auto < target.talents.auto) {
    talentParts.push(`AA ${character.talent.auto}/${target.talents.auto}`);
  }
  if (character.talent.skill < target.talents.skill) {
    talentParts.push(`Skill ${character.talent.skill}/${target.talents.skill}`);
  }
  if (character.talent.burst < target.talents.burst) {
    talentParts.push(`Burst ${character.talent.burst}/${target.talents.burst}`);
  }
  if (talentParts.length > 0) {
    missing.push(talentParts.join(', '));
  }

  return missing;
}

export function calculateBuildReadiness(
  campaign: Campaign,
  characters: Character[]
): CampaignBuildReadiness {
  const readiness = campaign.characterTargets.map((target): CampaignCharacterReadiness => {
    const character = findCharacter(characters, target.characterKey);
    const buildTarget = getCampaignBuildTarget(target.buildGoal);

    if (!character) {
      return {
        characterKey: target.characterKey,
        owned: false,
        buildGoal: target.buildGoal,
        percent: 0,
        missing: ['Not owned yet'],
      };
    }

    return {
      characterKey: target.characterKey,
      characterId: character.id,
      owned: true,
      buildGoal: target.buildGoal,
      percent: calculateTargetProgress(character, buildTarget),
      missing: getTargetMissing(character, buildTarget),
    };
  });

  const percent = clampPercent(average(readiness.map((target) => target.percent)));

  return {
    targetCount: campaign.characterTargets.length,
    ownedCount: readiness.filter((target) => target.owned).length,
    percent,
    status: statusFromPercent(percent),
    characters: readiness,
  };
}

function estimatePullsForTarget(target: Campaign['pullTargets'][number]): number {
  if (target.maxPullBudget !== null && target.maxPullBudget > 0) {
    return Math.ceil(target.maxPullBudget);
  }

  const pullsPerCopy = target.bannerType === 'weapon' ? 160 : 180;
  return pullsPerCopy * target.desiredCopies;
}

export function calculatePullReadiness(
  campaign: Campaign,
  availablePulls: AvailablePullsResult
): CampaignPullReadiness {
  const availableWholePulls = wholePulls(availablePulls.availablePulls);

  if (campaign.pullTargets.length === 0) {
    return {
      hasTargets: false,
      availablePulls: availableWholePulls,
      targetPulls: 0,
      remainingPulls: 0,
      percent: 100,
      status: 'ready',
    };
  }

  const targetPulls = campaign.pullTargets.reduce(
    (sum, target) => sum + estimatePullsForTarget(target),
    0
  );
  const remainingPulls = Math.max(0, targetPulls - availableWholePulls);
  const percent = targetPulls === 0 ? 100 : clampPercent((availableWholePulls / targetPulls) * 100);

  return {
    hasTargets: true,
    availablePulls: availableWholePulls,
    targetPulls,
    remainingPulls,
    percent,
    status: statusFromPercent(percent),
  };
}

function campaignTargetToGoal(
  target: CampaignCharacterTarget,
  characters: Character[]
): MultiCharacterGoal | null {
  const character = findCharacter(characters, target.characterKey);
  const source = character
    ? {
        key: character.key,
        level: character.level,
        ascension: character.ascension,
        talent: character.talent,
      }
    : {
        key: target.characterKey,
        level: 1,
        ascension: 0,
        talent: { auto: 1, skill: 1, burst: 1 },
      };

  return createGoalsFromCharacters([source], target.buildGoal)[0] ?? null;
}

export async function calculateMaterialReadiness(
  campaign: Campaign,
  characters: Character[],
  materials: Record<string, number>
): Promise<CampaignMaterialReadiness> {
  const goals = campaign.characterTargets
    .map((target) => campaignTargetToGoal(target, characters))
    .filter((goal): goal is MultiCharacterGoal => goal !== null);

  if (goals.length === 0) {
    return {
      hasTargets: false,
      percent: 100,
      status: 'ready',
      totalMaterials: 0,
      readyMaterials: 0,
      deficitMaterials: 0,
      topDeficits: [],
      totalEstimatedResin: 0,
      totalEstimatedDays: 0,
      summary: null,
      errors: [],
    };
  }

  const summary = await calculateMultiCharacterSummary(goals, materials, {
    skipApiFetch: true,
  });
  const materialRows = summary.aggregatedMaterials;
  const deficitRows = materialRows.filter((material) => material.deficit > 0);
  const readyRows = materialRows.filter((material) => material.deficit <= 0);
  const percent = materialRows.length === 0
    ? 100
    : clampPercent((readyRows.length / materialRows.length) * 100);

  return {
    hasTargets: true,
    percent,
    status: statusFromPercent(percent),
    totalMaterials: materialRows.length,
    readyMaterials: readyRows.length,
    deficitMaterials: deficitRows.length,
    topDeficits: [...deficitRows]
      .sort((a, b) => b.deficit - a.deficit)
      .slice(0, 5),
    totalEstimatedResin: summary.totalEstimatedResin,
    totalEstimatedDays: summary.totalEstimatedDays,
    summary,
    errors: summary.errors,
  };
}

function buildNextActions(
  campaign: Campaign,
  pullReadiness: CampaignPullReadiness,
  buildReadiness: CampaignBuildReadiness,
  materialReadiness: CampaignMaterialReadiness
): CampaignNextAction[] {
  const actions: CampaignNextAction[] = [];

  if (pullReadiness.hasTargets && pullReadiness.remainingPulls > 0) {
    actions.push({
      id: `${campaign.id}-pulls`,
      category: 'pulls',
      label: `Save ${pullReadiness.remainingPulls} more pulls`,
      detail: `${pullReadiness.availablePulls}/${pullReadiness.targetPulls} pulls ready for campaign targets.`,
      priority: 1,
    });
  }

  const missingCharacters = buildReadiness.characters.filter((target) => !target.owned);
  for (const target of missingCharacters.slice(0, 2)) {
    actions.push({
      id: `${campaign.id}-roster-${target.characterKey}`,
      category: 'roster',
      label: `Acquire ${getDisplayName(target.characterKey)}`,
      detail: 'This wishlist target is blocking build completion.',
      priority: 1,
      characterKey: target.characterKey,
    });
  }

  for (const material of materialReadiness.topDeficits.slice(0, 3)) {
    actions.push({
      id: `${campaign.id}-material-${material.key}-${material.tier ?? 'base'}`,
      category: 'materials',
      label: `Farm ${material.name}`,
      detail: `${material.deficit.toLocaleString()} still needed.`,
      priority: 2,
      materialKey: material.key,
    });
  }

  const buildTargets = buildReadiness.characters
    .filter((target) => target.owned && target.missing.length > 0)
    .sort((a, b) => a.percent - b.percent);

  for (const target of buildTargets.slice(0, 2)) {
    actions.push({
      id: `${campaign.id}-build-${target.characterKey}`,
      category: 'build',
      label: `Improve ${getDisplayName(target.characterKey)}`,
      detail: target.missing.slice(0, 2).join(' - '),
      priority: 3,
      characterKey: target.characterKey,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: `${campaign.id}-done`,
      category: 'done',
      label: 'Campaign looks ready',
      detail: 'Review it and mark complete when you are happy with the result.',
      priority: 3,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

export async function calculateCampaignPlan(
  campaign: Campaign,
  context: CampaignPlanContext
): Promise<CampaignPlan> {
  const pullReadiness = calculatePullReadiness(campaign, context.availablePulls);
  const buildReadiness = calculateBuildReadiness(campaign, context.characters);
  const materialReadiness = await calculateMaterialReadiness(
    campaign,
    context.characters,
    context.materials
  );

  const relevantReadiness = [
    pullReadiness.percent,
    buildReadiness.percent,
    materialReadiness.percent,
  ];
  const overallPercent = clampPercent(average(relevantReadiness));
  const status = [pullReadiness.status, buildReadiness.status, materialReadiness.status].includes('blocked')
    ? 'blocked'
    : [pullReadiness.status, buildReadiness.status, materialReadiness.status].includes('attention')
      ? 'attention'
      : 'ready';

  return {
    campaignId: campaign.id,
    overallPercent,
    status,
    pullReadiness,
    buildReadiness,
    materialReadiness,
    nextActions: buildNextActions(campaign, pullReadiness, buildReadiness, materialReadiness),
  };
}
