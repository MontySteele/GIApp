import { describe, expect, it } from 'vitest';
import type { Artifact, Campaign, Character, SlotKey } from '@/types';
import {
  calculateCampaignPlan,
  calculateBuildReadiness,
  calculateMaterialReadiness,
  calculatePullReadiness,
  getCampaignBuildTarget,
  getCampaignPullTargets,
} from './campaignPlan';

const ARTIFACT_SLOTS: SlotKey[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

function buildArtifacts(level: number): Artifact[] {
  return ARTIFACT_SLOTS.map((slotKey) => ({
    setKey: 'GoldenTroupe',
    slotKey,
    level,
    rarity: 5,
    mainStatKey: slotKey === 'flower' ? 'hp' : slotKey === 'plume' ? 'atk' : 'critRate_',
    substats: [],
  }));
}

const baseCampaign: Campaign = {
  id: 'campaign-1',
  type: 'character-acquisition',
  name: 'Recruit Furina',
  status: 'active',
  priority: 1,
  pullTargets: [
    {
      id: 'pull-1',
      itemKey: 'Furina',
      itemType: 'character',
      bannerType: 'character',
      desiredCopies: 1,
      maxPullBudget: 160,
      isConfirmed: false,
    },
  ],
  characterTargets: [
    {
      id: 'char-1',
      characterKey: 'Furina',
      ownership: 'wishlist',
      buildGoal: 'comfortable',
    },
  ],
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ownedFurina: Character = {
  id: 'furina',
  key: 'Furina',
  level: 80,
  ascension: 6,
  constellation: 0,
  talent: { auto: 8, skill: 8, burst: 8 },
  weapon: { key: 'FleuveCendreFerryman', level: 90, ascension: 6, refinement: 5 },
  artifacts: buildArtifacts(20),
  notes: '',
  priority: 'main',
  teamIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('campaignPlan', () => {
  it('uses campaign build presets for target thresholds', () => {
    expect(getCampaignBuildTarget('functional')).toMatchObject({
      level: 80,
      ascension: 5,
      weaponLevel: 80,
      artifactLevel: 12,
      talents: { auto: 1, skill: 6, burst: 6 },
    });
    expect(getCampaignBuildTarget('full')).toMatchObject({
      level: 90,
      ascension: 6,
      weaponLevel: 90,
      artifactLevel: 20,
      talents: { auto: 10, skill: 10, burst: 10 },
    });
  });

  it('calculates pull readiness from available pulls and target budget', () => {
    const readiness = calculatePullReadiness(baseCampaign, {
      availablePulls: 80,
      resources: {
        primogems: 0,
        genesisCrystals: 0,
        intertwined: 80,
        acquaint: 0,
        starglitter: 0,
      },
      lastUpdated: null,
      hasSnapshot: false,
    });

    expect(readiness.percent).toBe(50);
    expect(readiness.remainingPulls).toBe(80);
    expect(readiness.status).toBe('attention');
  });

  it('uses whole pull counts for campaign readiness', () => {
    const readiness = calculatePullReadiness(
      {
        ...baseCampaign,
        pullTargets: [
          {
            ...baseCampaign.pullTargets[0]!,
            maxPullBudget: 150,
          },
        ],
      },
      {
        availablePulls: 69.4125,
        resources: {
          primogems: 11106,
          genesisCrystals: 0,
          intertwined: 0,
          acquaint: 0,
          starglitter: 0,
        },
        lastUpdated: null,
        hasSnapshot: true,
      }
    );

    expect(readiness.availablePulls).toBe(69);
    expect(readiness.targetPulls).toBe(150);
    expect(readiness.remainingPulls).toBe(81);
  });

  it('treats wishlist team targets as implicit pull targets', () => {
    const teamCampaign: Campaign = {
      ...baseCampaign,
      type: 'team-polish',
      pullTargets: [],
      characterTargets: [
        {
          id: 'char-lyney',
          characterKey: 'Lyney',
          ownership: 'wishlist',
          buildGoal: 'comfortable',
        },
      ],
    };

    const effectiveTargets = getCampaignPullTargets(teamCampaign);
    const readiness = calculatePullReadiness(teamCampaign, {
      availablePulls: 40,
      resources: {
        primogems: 0,
        genesisCrystals: 0,
        intertwined: 40,
        acquaint: 0,
        starglitter: 0,
      },
      lastUpdated: null,
      hasSnapshot: false,
    });

    expect(effectiveTargets).toEqual([
      expect.objectContaining({
        itemKey: 'Lyney',
        itemType: 'character',
        desiredCopies: 1,
        maxPullBudget: null,
      }),
    ]);
    expect(readiness.hasTargets).toBe(true);
    expect(readiness.targetPulls).toBe(180);
    expect(readiness.remainingPulls).toBe(140);
  });

  it('treats newly owned wishlist targets as build-ready when they meet the goal', () => {
    const readiness = calculateBuildReadiness(baseCampaign, [ownedFurina]);

    expect(readiness.ownedCount).toBe(1);
    expect(readiness.percent).toBe(100);
    expect(readiness.status).toBe('ready');
    expect(readiness.characters[0]?.characterId).toBe('furina');
    expect(readiness.characters[0]?.missing).toEqual([]);
  });

  it('includes weapon and artifact gaps in build readiness', () => {
    const readiness = calculateBuildReadiness(
      {
        ...baseCampaign,
        characterTargets: [
          {
            ...baseCampaign.characterTargets[0]!,
            ownership: 'owned',
            buildGoal: 'comfortable',
          },
        ],
      },
      [
        {
          ...ownedFurina,
          weapon: { ...ownedFurina.weapon, level: 70 },
          artifacts: buildArtifacts(8).slice(0, 4),
        },
      ]
    );

    expect(readiness.status).toBe('attention');
    expect(readiness.percent).toBeLessThan(100);
    expect(readiness.characters[0]?.missing).toEqual([
      'Weapon Lv. 70/90',
      'Artifacts 4/5 equipped',
    ]);
  });

  it('adds equipment gaps to campaign material readiness', async () => {
    const readiness = await calculateMaterialReadiness(
      {
        ...baseCampaign,
        pullTargets: [],
        characterTargets: [
          {
            ...baseCampaign.characterTargets[0]!,
            ownership: 'owned',
            buildGoal: 'comfortable',
          },
        ],
      },
      [
        {
          ...ownedFurina,
          weapon: { ...ownedFurina.weapon, level: 70, ascension: 4 },
          artifacts: buildArtifacts(8).slice(0, 4),
        },
      ],
      { Mora: 0 }
    );

    const materials = readiness.summary?.aggregatedMaterials ?? [];

    expect(materials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'Mora',
          required: 80000,
          deficit: 80000,
        }),
        expect.objectContaining({
          name: 'Weapon Domain Material (Purple)',
          category: 'weapon',
          required: 6,
          deficit: 6,
        }),
        expect.objectContaining({
          key: 'WeaponEnhancementLevels',
          name: 'Weapon enhancement levels',
          category: 'weapon',
          required: 90,
          owned: 70,
          deficit: 20,
        }),
        expect.objectContaining({
          key: 'ArtifactEnhancementLevels',
          name: 'Artifact enhancement levels',
          category: 'artifact',
          required: 80,
          owned: 32,
          deficit: 48,
        }),
      ])
    );
    expect(readiness.totalEstimatedResin).toBeGreaterThan(0);
    expect(readiness.deficitMaterials).toBeGreaterThan(0);
    expect(readiness.summary?.resinBreakdown.weapon).toBeGreaterThan(0);
    expect(readiness.summary?.resinBreakdown.total).toBe(
      (readiness.summary?.resinBreakdown.talentBoss ?? 0) +
        (readiness.summary?.resinBreakdown.expMora ?? 0) +
        (readiness.summary?.resinBreakdown.weapon ?? 0)
    );
  });

  it('adds semantic target metadata to next actions', async () => {
    const underbuiltFurina = {
      ...ownedFurina,
      level: 40,
      ascension: 2,
      talent: { auto: 1, skill: 3, burst: 3 },
    };
    const plan = await calculateCampaignPlan(
      {
        ...baseCampaign,
        pullTargets: [],
        characterTargets: [
          {
            ...baseCampaign.characterTargets[0]!,
            ownership: 'owned',
          },
        ],
      },
      {
        characters: [underbuiltFurina],
        materials: {},
        availablePulls: {
          availablePulls: 0,
          resources: {
            primogems: 0,
            genesisCrystals: 0,
            intertwined: 0,
            acquaint: 0,
            starglitter: 0,
          },
          lastUpdated: null,
          hasSnapshot: false,
        },
      }
    );

    expect(plan.buildReadiness.characters[0]?.characterId).toBe('furina');
    expect(plan.nextActions).toContainEqual(
      expect.objectContaining({
        category: 'build',
        characterKey: 'Furina',
      })
    );
  });

  it('treats zero-target campaigns as ready for review', async () => {
    const plan = await calculateCampaignPlan(
      {
        ...baseCampaign,
        pullTargets: [],
        characterTargets: [],
      },
      {
        characters: [],
        materials: {},
        availablePulls: {
          availablePulls: 0,
          resources: {
            primogems: 0,
            genesisCrystals: 0,
            intertwined: 0,
            acquaint: 0,
            starglitter: 0,
          },
          lastUpdated: null,
          hasSnapshot: false,
        },
      }
    );

    expect(plan.status).toBe('ready');
    expect(plan.overallPercent).toBe(100);
    expect(plan.nextActions[0]).toMatchObject({
      category: 'done',
      label: 'Campaign looks ready',
    });
  });

  it('rolls status up by severity with blocked above attention above ready', async () => {
    const campaignWithPullTarget = {
      ...baseCampaign,
      characterTargets: [],
      pullTargets: [
        {
          ...baseCampaign.pullTargets[0]!,
          maxPullBudget: 100,
        },
      ],
    };
    const context = (availablePulls: number) => ({
      characters: [],
      materials: {},
      availablePulls: {
        availablePulls,
        resources: {
          primogems: 0,
          genesisCrystals: 0,
          intertwined: availablePulls,
          acquaint: 0,
          starglitter: 0,
        },
        lastUpdated: null,
        hasSnapshot: false,
      },
    });

    const blockedPlan = await calculateCampaignPlan(campaignWithPullTarget, context(0));
    const attentionPlan = await calculateCampaignPlan(campaignWithPullTarget, context(60));
    const readyPlan = await calculateCampaignPlan(campaignWithPullTarget, context(100));

    expect(blockedPlan.status).toBe('blocked');
    expect(attentionPlan.status).toBe('attention');
    expect(readyPlan.status).toBe('ready');
  });
});
