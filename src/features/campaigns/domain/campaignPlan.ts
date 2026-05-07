import type { AvailablePullsResult } from '@/lib/services/resourceService';
import {
  aggregateMaterialRequirements,
  calculateMultiCharacterSummary,
  groupMaterialsByCategory,
  type AggregatedMaterialSummary,
  type MultiCharacterGoal,
} from '@/lib/planning/multiCharacterCalculator';
import type { MaterialRequirement } from '@/lib/planning/ascensionCalculator';
import {
  calculateWeaponAscensionSummary,
  type WeaponMaterialRequirement,
} from '@/lib/planning/weaponCalculator';
import { calculateCharacterArtifactScore } from '@/features/artifacts/domain/artifactScoring';
import {
  getCharacterBuild,
  type CharacterBuild,
} from '@/features/artifacts/domain/setRecommendations';
import { RESIN_REGEN } from '@/lib/planning/materialConstants';
import { findWeapon } from '@/lib/data/equipmentData';
import {
  formatArtifactSetName,
  formatSlotName,
  formatStatName,
  getDisplayName,
} from '@/lib/gameData';
import type {
  Artifact,
  BuildTemplate,
  Campaign,
  CampaignBuildGoal,
  CampaignCharacterTarget,
  CampaignPullTarget,
  Character,
  MainStatKey,
  SetRecommendation,
  SlotKey,
  Team,
} from '@/types';

export type CampaignPlanStatus = 'ready' | 'attention' | 'blocked';
export type CampaignActionCategory = 'pulls' | 'materials' | 'build' | 'roster' | 'done';

export interface CampaignBuildTarget {
  level: number;
  ascension: number;
  weaponLevel: number;
  artifactCount: number;
  artifactLevel: number;
  artifactScore: number;
  artifactFit: number;
  talents: {
    auto: number;
    skill: number;
    burst: number;
  };
}

export type CampaignBuildGapCategory = 'ownership' | 'level' | 'talents' | 'weapon' | 'artifacts';

export interface CampaignBuildGap {
  category: CampaignBuildGapCategory;
  label: string;
  detail: string;
  priority: 1 | 2 | 3;
}

export interface CampaignBuildBreakdown {
  level: number;
  talents: number;
  weapon: number;
  artifacts: number;
}

export interface CampaignCharacterReadiness {
  characterKey: string;
  characterId?: string;
  owned: boolean;
  buildGoal: CampaignBuildGoal;
  percent: number;
  missing: string[];
  buildIntentSource?: CampaignBuildIntentSource;
  buildTemplateId?: string;
  buildTemplateName?: string;
  targetWeaponKey?: string;
  gaps?: CampaignBuildGap[];
  breakdown?: CampaignBuildBreakdown;
  artifactScore?: number;
  artifactGrade?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  artifactFitPercent?: number;
  hasBuildRecommendation?: boolean;
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
  readyCount?: number;
  gapCount?: number;
  percent: number;
  status: CampaignPlanStatus;
  characters: CampaignCharacterReadiness[];
  topGaps?: Array<CampaignBuildGap & { characterKey: string }>;
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
  teams?: Team[];
  buildTemplates?: BuildTemplate[];
}

export type CampaignBuildIntentSource = 'campaign' | 'team' | 'generic';

interface ArtifactBuildGuide {
  recommendedSets: Array<Array<SetRecommendation & { name?: string }>>;
  mainStats: Record<'sands' | 'goblet' | 'circlet', MainStatKey[]>;
  substats: string[];
}

interface ResolvedBuildIntent {
  source: CampaignBuildIntentSource;
  template?: BuildTemplate;
  templateId?: string;
  templateName?: string;
  targetWeaponKey?: string;
  primaryWeapons: string[];
  alternativeWeapons: string[];
  artifactGuide?: ArtifactBuildGuide;
}

const BUILD_TARGETS: Record<CampaignBuildGoal, CampaignBuildTarget> = {
  functional: {
    level: 80,
    ascension: 5,
    weaponLevel: 80,
    artifactCount: 5,
    artifactLevel: 12,
    artifactScore: 40,
    artifactFit: 50,
    talents: { auto: 1, skill: 6, burst: 6 },
  },
  comfortable: {
    level: 80,
    ascension: 6,
    weaponLevel: 90,
    artifactCount: 5,
    artifactLevel: 16,
    artifactScore: 55,
    artifactFit: 70,
    talents: { auto: 8, skill: 8, burst: 8 },
  },
  full: {
    level: 90,
    ascension: 6,
    weaponLevel: 90,
    artifactCount: 5,
    artifactLevel: 20,
    artifactScore: 70,
    artifactFit: 85,
    talents: { auto: 10, skill: 10, burst: 10 },
  },
};

const WEAPON_LEVEL_CAPS = [20, 40, 50, 60, 70, 80, 90] as const;
const WEAPON_POLISH_KEY = 'WeaponEnhancementLevels';
const ARTIFACT_POLISH_KEY = 'ArtifactEnhancementLevels';
const ARTIFACT_MAIN_STAT_SLOTS: Array<'sands' | 'goblet' | 'circlet'> = ['sands', 'goblet', 'circlet'];

export interface CampaignBuildPlanOptions {
  teams?: Team[];
  buildTemplates?: BuildTemplate[];
}

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

function progress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, (current / target) * 100);
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

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, '');
}

function keysMatch(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  return normalizeKey(left) === normalizeKey(right);
}

function findBuildTemplate(
  templates: BuildTemplate[] | undefined,
  templateId: string | undefined
): BuildTemplate | undefined {
  if (!templates || !templateId) return undefined;
  return templates.find((template) => template.id === templateId);
}

function findCampaignTeam(campaign: Campaign, teams: Team[] | undefined): Team | undefined {
  if (!teams || !campaign.teamTarget?.teamId) return undefined;
  return teams.find((team) => team.id === campaign.teamTarget?.teamId);
}

function getTeamTemplateId(team: Team | undefined, characterKey: string): string | undefined {
  if (!team?.memberBuildTemplates) return undefined;

  return (
    team.memberBuildTemplates[characterKey] ??
    Object.entries(team.memberBuildTemplates).find(([key]) => keysMatch(key, characterKey))?.[1]
  );
}

function buildTemplateArtifactGuide(template: BuildTemplate): ArtifactBuildGuide {
  return {
    recommendedSets: template.artifacts.sets,
    mainStats: template.artifacts.mainStats,
    substats: template.artifacts.substats,
  };
}

function characterBuildArtifactGuide(build: CharacterBuild): ArtifactBuildGuide {
  return {
    recommendedSets: build.recommendedSets,
    mainStats: build.mainStats,
    substats: build.substats,
  };
}

function resolveBuildIntent(
  campaign: Campaign,
  target: CampaignCharacterTarget,
  options: CampaignBuildPlanOptions = {}
): ResolvedBuildIntent {
  const campaignTemplate = findBuildTemplate(options.buildTemplates, target.targetTemplateId);
  const team = findCampaignTeam(campaign, options.teams);
  const teamTemplate = campaignTemplate
    ? undefined
    : findBuildTemplate(options.buildTemplates, getTeamTemplateId(team, target.characterKey));
  const template = campaignTemplate ?? teamTemplate;
  const genericBuild = template ? undefined : getCharacterBuild(target.characterKey);
  const source: CampaignBuildIntentSource = campaignTemplate
    ? 'campaign'
    : teamTemplate
      ? 'team'
      : target.targetWeaponKey
        ? 'campaign'
        : 'generic';

  return {
    source,
    template,
    templateId: template?.id,
    templateName: template?.name,
    targetWeaponKey: target.targetWeaponKey,
    primaryWeapons: template?.weapons.primary ?? [],
    alternativeWeapons: template?.weapons.alternatives ?? [],
    artifactGuide: template
      ? buildTemplateArtifactGuide(template)
      : genericBuild
        ? characterBuildArtifactGuide(genericBuild)
        : undefined,
  };
}

function getEffectiveBuildTarget(
  goal: CampaignBuildGoal,
  intent: ResolvedBuildIntent
): CampaignBuildTarget {
  const base = getCampaignBuildTarget(goal);
  const leveling = intent.template?.leveling;

  if (!leveling) return base;

  return {
    ...base,
    level: leveling.targetLevel || base.level,
    ascension: leveling.targetAscension ?? base.ascension,
    talents: leveling.talentTarget ?? base.talents,
  };
}

function getEffectiveTargetForCampaignTarget(
  campaign: Campaign,
  target: CampaignCharacterTarget,
  options: CampaignBuildPlanOptions = {}
): CampaignBuildTarget {
  return getEffectiveBuildTarget(target.buildGoal, resolveBuildIntent(campaign, target, options));
}

function formatWeaponName(weaponKey: string): string {
  return findWeapon(weaponKey)?.name ?? weaponKey;
}

function calculateWeaponFitProgress(character: Character, intent: ResolvedBuildIntent): number | undefined {
  if (intent.targetWeaponKey) {
    return keysMatch(character.weapon.key, intent.targetWeaponKey) ? 100 : 0;
  }

  if (intent.primaryWeapons.length === 0 && intent.alternativeWeapons.length === 0) {
    return undefined;
  }

  if (intent.primaryWeapons.some((weaponKey) => keysMatch(character.weapon.key, weaponKey))) {
    return 100;
  }

  if (intent.alternativeWeapons.some((weaponKey) => keysMatch(character.weapon.key, weaponKey))) {
    return 75;
  }

  return 0;
}

function calculateWeaponProgress(
  character: Character,
  target: CampaignBuildTarget,
  intent: ResolvedBuildIntent
): number {
  const weaponLevelProgress = progress(character.weapon.level, target.weaponLevel);
  const weaponFitProgress = calculateWeaponFitProgress(character, intent);

  return weaponFitProgress === undefined
    ? weaponLevelProgress
    : average([weaponLevelProgress, weaponFitProgress]);
}

function calculateTargetBreakdown(
  character: Character,
  target: CampaignBuildTarget,
  intent: ResolvedBuildIntent
): CampaignBuildBreakdown {
  const levelProgress = average([
    progress(character.level, target.level),
    progress(character.ascension, target.ascension),
  ]);
  const talentProgress = average([
    progress(character.talent.auto, target.talents.auto),
    progress(character.talent.skill, target.talents.skill),
    progress(character.talent.burst, target.talents.burst),
  ]);
  const weaponProgress = calculateWeaponProgress(character, target, intent);
  const artifactProgress = calculateArtifactProgress(character, target, intent);

  return {
    level: clampPercent(levelProgress),
    talents: clampPercent(talentProgress),
    weapon: clampPercent(weaponProgress),
    artifacts: clampPercent(artifactProgress),
  };
}

function calculateTargetProgress(
  character: Character,
  target: CampaignBuildTarget,
  intent: ResolvedBuildIntent
): number {
  const breakdown = calculateTargetBreakdown(character, target, intent);
  return clampPercent(average(Object.values(breakdown)));
}

function calculateArtifactProgress(
  character: Character,
  target: CampaignBuildTarget,
  intent: ResolvedBuildIntent
): number {
  if (target.artifactCount === 0 || target.artifactLevel === 0) return 100;

  const artifacts = character.artifacts ?? [];
  const equippedProgress = Math.min(100, (artifacts.length / target.artifactCount) * 100);
  const topArtifacts = [...artifacts]
    .sort((a, b) => b.level - a.level)
    .slice(0, target.artifactCount);
  const leveledProgress = Array.from({ length: target.artifactCount }).reduce<number>((sum, _, index) => {
    const artifact = topArtifacts[index];
    return sum + Math.min(100, ((artifact?.level ?? 0) / target.artifactLevel) * 100);
  }, 0) / target.artifactCount;

  const artifactScore = calculateCharacterArtifactScore(character.artifacts ?? []);
  const qualityProgress = progress(artifactScore.averageScore, target.artifactScore);
  const fitProgress = intent.artifactGuide
    ? calculateArtifactFitProgress(intent.artifactGuide, character.artifacts ?? [], target)
    : 100;

  return average([equippedProgress, leveledProgress, qualityProgress, fitProgress]);
}

function calculateArtifactFitProgress(
  guide: ArtifactBuildGuide,
  artifacts: Artifact[],
  target: CampaignBuildTarget
): number {
  if (artifacts.length === 0) return 0;

  const setProgress = calculateRecommendedSetProgress(guide, artifacts);
  const mainStatProgress = calculateRecommendedMainStatProgress(guide, artifacts);
  return progress(average([setProgress, mainStatProgress]), target.artifactFit);
}

function calculateRecommendedSetProgress(guide: ArtifactBuildGuide, artifacts: Artifact[]): number {
  if (guide.recommendedSets.length === 0) return 100;

  const setCounts = new Map<string, number>();
  for (const artifact of artifacts) {
    const key = artifact.setKey.toLowerCase();
    setCounts.set(key, (setCounts.get(key) ?? 0) + 1);
  }

  return Math.max(
    ...guide.recommendedSets.map((combo) => {
      const requiredPieces = combo.reduce((sum, rec) => sum + rec.pieces, 0);
      const matchedPieces = combo.reduce(
        (sum, rec) => sum + Math.min(setCounts.get(rec.setKey.toLowerCase()) ?? 0, rec.pieces),
        0
      );
      return progress(matchedPieces, requiredPieces);
    })
  );
}

function normalizeStatKey(statKey: string): string {
  return statKey.toLowerCase().replace(/%/g, '_');
}

function isGuideMainStat(guide: ArtifactBuildGuide, slot: SlotKey, mainStatKey: string): boolean {
  if (slot === 'flower' || slot === 'plume') return true;

  const normalized = normalizeStatKey(mainStatKey);
  return guide.mainStats[slot]?.some((stat) => normalizeStatKey(stat) === normalized) ?? false;
}

function calculateRecommendedMainStatProgress(guide: ArtifactBuildGuide, artifacts: Artifact[]): number {
  const slotScores = ARTIFACT_MAIN_STAT_SLOTS.map((slot) => {
    const artifact = artifacts.find((candidate) => candidate.slotKey === slot);
    if (!artifact) return 0;
    return isGuideMainStat(guide, slot, artifact.mainStatKey) ? 100 : 0;
  });
  return average(slotScores);
}

function formatSetCombo(combo: Array<SetRecommendation & { name?: string }>): string {
  return combo
    .map((recommendation) => `${recommendation.pieces}pc ${recommendation.name ?? formatArtifactSetName(recommendation.setKey)}`)
    .join(' + ');
}

function formatMainStatTargets(stats: MainStatKey[]): string {
  return stats.map(formatStatName).join(' / ');
}

function getArtifactFitGaps(
  artifacts: Artifact[],
  guide: ArtifactBuildGuide
): CampaignBuildGap[] {
  const gaps: CampaignBuildGap[] = [];

  if (calculateRecommendedSetProgress(guide, artifacts) < 100) {
    const preferredCombo = guide.recommendedSets[0];
    if (preferredCombo) {
      gaps.push({
        category: 'artifacts',
        label: 'Artifact sets',
        detail: `Aim for ${formatSetCombo(preferredCombo)}`,
        priority: 3,
      });
    }
  }

  for (const slot of ARTIFACT_MAIN_STAT_SLOTS) {
    const recommendedStats = guide.mainStats[slot] ?? [];
    if (recommendedStats.length === 0) continue;

    const artifact = artifacts.find((candidate) => candidate.slotKey === slot);
    if (!artifact) {
      gaps.push({
        category: 'artifacts',
        label: `${formatSlotName(slot)} main stat`,
        detail: `Missing ${formatMainStatTargets(recommendedStats)}`,
        priority: 3,
      });
      continue;
    }

    if (!isGuideMainStat(guide, slot, artifact.mainStatKey)) {
      gaps.push({
        category: 'artifacts',
        label: `${formatSlotName(slot)} main stat`,
        detail: `${formatStatName(artifact.mainStatKey)} -> ${formatMainStatTargets(recommendedStats)}`,
        priority: 3,
      });
    }
  }

  return gaps;
}

function getWeaponChoiceGap(
  character: Character,
  intent: ResolvedBuildIntent
): CampaignBuildGap | null {
  const fitProgress = calculateWeaponFitProgress(character, intent);
  if (fitProgress === undefined || fitProgress > 0) return null;

  const targetWeapons = intent.targetWeaponKey
    ? [intent.targetWeaponKey]
    : [...intent.primaryWeapons, ...intent.alternativeWeapons];
  const preferredWeapon = targetWeapons[0];
  if (!preferredWeapon) return null;

  return {
    category: 'weapon',
    label: 'Weapon choice',
    detail: `${formatWeaponName(character.weapon.key)} -> ${formatWeaponName(preferredWeapon)}`,
    priority: 2,
  };
}

function getTargetGaps(
  character: Character,
  target: CampaignBuildTarget,
  intent: ResolvedBuildIntent
): CampaignBuildGap[] {
  const gaps: CampaignBuildGap[] = [];

  if (character.level < target.level) {
    gaps.push({
      category: 'level',
      label: 'Character level',
      detail: `Lv. ${character.level}/${target.level}`,
      priority: 1,
    });
  }
  if (character.ascension < target.ascension) {
    gaps.push({
      category: 'level',
      label: 'Ascension',
      detail: `A${character.ascension}/A${target.ascension}`,
      priority: 1,
    });
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
    gaps.push({
      category: 'talents',
      label: 'Talents',
      detail: talentParts.join(', '),
      priority: 1,
    });
  }
  if (character.weapon.level < target.weaponLevel) {
    gaps.push({
      category: 'weapon',
      label: 'Weapon level',
      detail: `Weapon Lv. ${character.weapon.level}/${target.weaponLevel}`,
      priority: 2,
    });
  }
  const weaponChoiceGap = getWeaponChoiceGap(character, intent);
  if (weaponChoiceGap) {
    gaps.push(weaponChoiceGap);
  }

  const artifacts = character.artifacts ?? [];
  if (artifacts.length < target.artifactCount) {
    gaps.push({
      category: 'artifacts',
      label: 'Artifacts equipped',
      detail: `Artifacts ${artifacts.length}/${target.artifactCount} equipped`,
      priority: 2,
    });
  } else {
    const readyArtifacts = artifacts.filter((artifact) => artifact.level >= target.artifactLevel).length;
    if (readyArtifacts < target.artifactCount) {
      gaps.push({
        category: 'artifacts',
        label: 'Artifact levels',
        detail: `Artifacts ${readyArtifacts}/${target.artifactCount} at +${target.artifactLevel}`,
        priority: 2,
      });
    }
  }

  if (artifacts.length > 0) {
    const artifactScore = calculateCharacterArtifactScore(artifacts);
    if (artifactScore.averageScore < target.artifactScore) {
      gaps.push({
        category: 'artifacts',
        label: 'Artifact quality',
        detail: `Artifact score ${artifactScore.averageScore}/${target.artifactScore}`,
        priority: 3,
      });
    }

    const fitPercent = intent.artifactGuide
      ? calculateArtifactFitProgress(intent.artifactGuide, artifacts, target)
      : 100;
    const artifactFitGaps = intent.artifactGuide
      ? getArtifactFitGaps(artifacts, intent.artifactGuide)
      : [];
    if (intent.artifactGuide && fitPercent < 100 && artifactFitGaps.length === 0) {
      gaps.push({
        category: 'artifacts',
        label: 'Artifact build fit',
        detail: `Artifact build fit ${fitPercent}%`,
        priority: 3,
      });
    }
    gaps.push(...artifactFitGaps);
  }

  return gaps.sort((a, b) => a.priority - b.priority);
}

export function calculateBuildReadiness(
  campaign: Campaign,
  characters: Character[],
  options: CampaignBuildPlanOptions = {}
): CampaignBuildReadiness {
  const readiness = campaign.characterTargets.map((target): CampaignCharacterReadiness => {
    const character = findCharacter(characters, target.characterKey);
    const intent = resolveBuildIntent(campaign, target, options);
    const buildTarget = getEffectiveBuildTarget(target.buildGoal, intent);
    const intentMetadata = {
      buildIntentSource: intent.source,
      buildTemplateId: intent.templateId,
      buildTemplateName: intent.templateName,
      targetWeaponKey: intent.targetWeaponKey,
    };

    if (!character) {
      return {
        characterKey: target.characterKey,
        owned: false,
        buildGoal: target.buildGoal,
        percent: 0,
        ...intentMetadata,
        gaps: [{
          category: 'ownership',
          label: 'Ownership',
          detail: 'Not owned yet',
          priority: 1,
        }],
        breakdown: {
          level: 0,
          talents: 0,
          weapon: 0,
          artifacts: 0,
        },
        missing: ['Not owned yet'],
      };
    }

    const artifactScore = calculateCharacterArtifactScore(character.artifacts ?? []);
    const gaps = getTargetGaps(character, buildTarget, intent);

    return {
      characterKey: target.characterKey,
      characterId: character.id,
      owned: true,
      buildGoal: target.buildGoal,
      ...intentMetadata,
      percent: calculateTargetProgress(character, buildTarget, intent),
      missing: gaps.map((gap) => gap.detail),
      gaps,
      breakdown: calculateTargetBreakdown(character, buildTarget, intent),
      artifactScore: artifactScore.averageScore,
      artifactGrade: artifactScore.averageGrade,
      artifactFitPercent: intent.artifactGuide
        ? calculateArtifactFitProgress(intent.artifactGuide, character.artifacts ?? [], buildTarget)
        : undefined,
      hasBuildRecommendation: Boolean(intent.artifactGuide),
    };
  });

  const percent = clampPercent(average(readiness.map((target) => target.percent)));
  const readyCount = readiness.filter((target) => target.owned && target.percent >= 100).length;
  const topGaps = readiness
    .flatMap((target) =>
      (target.gaps ?? []).map((gap) => ({
        ...gap,
        characterKey: target.characterKey,
      }))
    )
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
  const gapCount = readiness.reduce((sum, target) => sum + (target.gaps?.length ?? 0), 0);

  return {
    targetCount: campaign.characterTargets.length,
    ownedCount: readiness.filter((target) => target.owned).length,
    readyCount,
    gapCount,
    percent,
    status: statusFromPercent(percent),
    characters: readiness,
    topGaps,
  };
}

function estimatePullsForTarget(target: Campaign['pullTargets'][number]): number {
  if (target.maxPullBudget !== null && target.maxPullBudget > 0) {
    return Math.ceil(target.maxPullBudget);
  }

  const pullsPerCopy = target.bannerType === 'weapon' ? 160 : 180;
  return pullsPerCopy * target.desiredCopies;
}

export function getCampaignPullTargets(campaign: Campaign): CampaignPullTarget[] {
  const explicitTargets = [...campaign.pullTargets];
  const explicitCharacterKeys = new Set(
    explicitTargets
      .filter((target) => target.itemType === 'character')
      .map((target) => target.itemKey.toLowerCase())
  );

  const wishlistPullTargets = campaign.characterTargets
    .filter(
      (target) =>
        target.ownership === 'wishlist' &&
        !explicitCharacterKeys.has(target.characterKey.toLowerCase())
    )
    .map((target): CampaignPullTarget => ({
      id: `${target.id}-wishlist-pull`,
      itemKey: target.characterKey,
      itemType: 'character',
      bannerType: 'character',
      desiredCopies: 1,
      maxPullBudget: null,
      isConfirmed: false,
      notes: 'Auto-added from campaign wishlist target.',
    }));

  return [...explicitTargets, ...wishlistPullTargets];
}

export function calculatePullReadiness(
  campaign: Campaign,
  availablePulls: AvailablePullsResult
): CampaignPullReadiness {
  const availableWholePulls = wholePulls(availablePulls.availablePulls);
  const pullTargets = getCampaignPullTargets(campaign);

  if (pullTargets.length === 0) {
    return {
      hasTargets: false,
      availablePulls: availableWholePulls,
      targetPulls: 0,
      remainingPulls: 0,
      percent: 100,
      status: 'ready',
    };
  }

  const targetPulls = pullTargets.reduce(
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
  characters: Character[],
  buildTarget: CampaignBuildTarget
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

  return {
    characterKey: source.key,
    goal: {
      characterKey: source.key,
      currentLevel: source.level,
      targetLevel: buildTarget.level,
      currentAscension: source.ascension,
      targetAscension: buildTarget.ascension,
      currentTalents: { ...source.talent },
      targetTalents: {
        auto: Math.max(source.talent.auto, buildTarget.talents.auto),
        skill: Math.max(source.talent.skill, buildTarget.talents.skill),
        burst: Math.max(source.talent.burst, buildTarget.talents.burst),
      },
    },
  };
}

interface CampaignEquipmentMaterialPlan {
  materials: MaterialRequirement[];
  estimatedResin: number;
  errors: string[];
}

function getTargetWeaponAscension(targetLevel: number): number {
  const phase = WEAPON_LEVEL_CAPS.findIndex((cap) => cap >= targetLevel);
  return phase >= 0 ? phase : 6;
}

function getWeaponRarity(weaponKey: string): 4 | 5 {
  const rarity = findWeapon(weaponKey)?.rarity;
  return rarity === 5 ? 5 : 4;
}

function toCampaignMaterialRequirement(material: WeaponMaterialRequirement): MaterialRequirement {
  const category = material.category === 'domain'
    ? 'weapon'
    : material.category === 'elite'
      ? 'common'
      : material.category;

  return {
    key: material.key,
    name: material.name,
    category,
    tier: material.tier,
    required: material.required,
    owned: material.owned,
    deficit: material.deficit,
    source: material.source,
    availability: material.availability,
  };
}

function calculateArtifactEnhancementRequirement(
  campaign: Campaign,
  characters: Character[],
  options: CampaignBuildPlanOptions = {}
): MaterialRequirement | null {
  let required = 0;
  let owned = 0;

  for (const target of campaign.characterTargets) {
    const character = findCharacter(characters, target.characterKey);
    if (!character) continue;

    const buildTarget = getEffectiveTargetForCampaignTarget(campaign, target, options);
    if (buildTarget.artifactCount === 0 || buildTarget.artifactLevel === 0) continue;

    required += buildTarget.artifactCount * buildTarget.artifactLevel;
    const topArtifacts = [...(character.artifacts ?? [])]
      .sort((a, b) => b.level - a.level)
      .slice(0, buildTarget.artifactCount);

    owned += topArtifacts.reduce(
      (sum, artifact) => sum + Math.min(artifact.level, buildTarget.artifactLevel),
      0
    );
  }

  const deficit = Math.max(0, required - owned);
  if (required === 0 || deficit === 0) return null;

  return {
    key: ARTIFACT_POLISH_KEY,
    name: 'Artifact enhancement levels',
    category: 'artifact',
    required,
    owned,
    deficit,
    source: 'Equip and level artifacts for campaign targets',
  };
}

function calculateWeaponEnhancementRequirement(
  campaign: Campaign,
  characters: Character[],
  options: CampaignBuildPlanOptions = {}
): MaterialRequirement | null {
  let required = 0;
  let owned = 0;

  for (const target of campaign.characterTargets) {
    const character = findCharacter(characters, target.characterKey);
    if (!character) continue;

    const buildTarget = getEffectiveTargetForCampaignTarget(campaign, target, options);
    required += buildTarget.weaponLevel;
    owned += Math.min(character.weapon.level, buildTarget.weaponLevel);
  }

  const deficit = Math.max(0, required - owned);
  if (required === 0 || deficit === 0) return null;

  return {
    key: WEAPON_POLISH_KEY,
    name: 'Weapon enhancement levels',
    category: 'weapon',
    required,
    owned,
    deficit,
    source: 'Level equipped weapons for campaign targets',
  };
}

async function calculateCampaignEquipmentMaterials(
  campaign: Campaign,
  characters: Character[],
  inventory: Record<string, number>,
  options: CampaignBuildPlanOptions = {}
): Promise<CampaignEquipmentMaterialPlan> {
  const materials: MaterialRequirement[] = [];
  let estimatedResin = 0;
  const errors: string[] = [];

  for (const target of campaign.characterTargets) {
    const character = findCharacter(characters, target.characterKey);
    if (!character) continue;

    const buildTarget = getEffectiveTargetForCampaignTarget(campaign, target, options);
    const targetAscension = getTargetWeaponAscension(buildTarget.weaponLevel);
    if (
      character.weapon.ascension >= targetAscension &&
      character.weapon.level >= buildTarget.weaponLevel
    ) {
      continue;
    }

    const summary = await calculateWeaponAscensionSummary(
      {
        weaponKey: character.weapon.key,
        currentLevel: character.weapon.level,
        targetLevel: buildTarget.weaponLevel,
        currentAscension: character.weapon.ascension,
        targetAscension,
        rarity: getWeaponRarity(character.weapon.key),
      },
      inventory,
      { skipApiFetch: true }
    );

    materials.push(...summary.materials.map(toCampaignMaterialRequirement));
    estimatedResin += summary.estimatedResin;

    if (summary.error && summary.isStale) {
      errors.push(`${character.key} weapon: ${summary.error}`);
    }
  }

  const weaponEnhancementRequirement = calculateWeaponEnhancementRequirement(campaign, characters, options);
  if (weaponEnhancementRequirement) {
    materials.push(weaponEnhancementRequirement);
  }

  const artifactRequirement = calculateArtifactEnhancementRequirement(campaign, characters, options);
  if (artifactRequirement) {
    materials.push(artifactRequirement);
  }

  return { materials, estimatedResin, errors };
}

export async function calculateMaterialReadiness(
  campaign: Campaign,
  characters: Character[],
  materials: Record<string, number>,
  options: CampaignBuildPlanOptions = {}
): Promise<CampaignMaterialReadiness> {
  const goals = campaign.characterTargets
    .map((target) => campaignTargetToGoal(
      target,
      characters,
      getEffectiveTargetForCampaignTarget(campaign, target, options)
    ))
    .filter((goal): goal is MultiCharacterGoal => goal !== null);

  const equipmentPlan = await calculateCampaignEquipmentMaterials(
    campaign,
    characters,
    materials,
    options
  );

  if (goals.length === 0 && equipmentPlan.materials.length === 0) {
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
  const materialRows = equipmentPlan.materials.length > 0
    ? aggregateMaterialRequirements([summary.aggregatedMaterials, equipmentPlan.materials])
    : summary.aggregatedMaterials;
  const groupedMaterials = groupMaterialsByCategory(materialRows);
  const deficitRows = materialRows.filter((material) => material.deficit > 0);
  const readyRows = materialRows.filter((material) => material.deficit <= 0);
  const percent = materialRows.length === 0
    ? 100
    : clampPercent((readyRows.length / materialRows.length) * 100);
  const totalEstimatedResin = summary.totalEstimatedResin + equipmentPlan.estimatedResin;
  const moraRequirement = materialRows.find((material) => material.key.toLowerCase() === 'mora');
  const mergedSummary: AggregatedMaterialSummary = {
    ...summary,
    aggregatedMaterials: materialRows,
    groupedMaterials,
    totalMora: moraRequirement?.required ?? summary.totalMora,
    totalEstimatedResin,
    resinBreakdown: {
      ...summary.resinBreakdown,
      weapon: (summary.resinBreakdown.weapon ?? 0) + equipmentPlan.estimatedResin,
      total: totalEstimatedResin,
    },
    totalEstimatedDays: Math.ceil(totalEstimatedResin / RESIN_REGEN.perDay),
    allCanAscend: materialRows.every((material) => material.deficit === 0),
    errors: [...summary.errors, ...equipmentPlan.errors],
  };

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
    totalEstimatedResin: mergedSummary.totalEstimatedResin,
    totalEstimatedDays: mergedSummary.totalEstimatedDays,
    summary: mergedSummary,
    errors: mergedSummary.errors,
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
    const topGap = target.gaps?.[0];
    actions.push({
      id: `${campaign.id}-build-${target.characterKey}`,
      category: 'build',
      label: `Improve ${getDisplayName(target.characterKey)}`,
      detail: topGap
        ? `${topGap.label}: ${topGap.detail}`
        : target.missing.slice(0, 2).join(' - '),
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
  const planOptions: CampaignBuildPlanOptions = {
    teams: context.teams,
    buildTemplates: context.buildTemplates,
  };
  const buildReadiness = calculateBuildReadiness(campaign, context.characters, planOptions);
  const materialReadiness = await calculateMaterialReadiness(
    campaign,
    context.characters,
    context.materials,
    planOptions
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
