# Team DPS Comparison - Technical Design Document

> **Status**: ⚠️ Pivoted to wfpsim Integration (see SPRINT_12_PLAN.md)
> **Priority**: High
> **Estimated Effort**: ~700 lines, 50-65 tests

---

## Design Decision: wfpsim Integration

**Decision Date**: January 2026

After evaluating the complexity of building a custom DPS calculator, we decided to integrate with [wfpsim](https://wfpsim.com/) instead.

### Why Not Custom Calculator?

| Aspect | Custom Calculator | wfpsim Integration |
|--------|-------------------|-------------------|
| **Accuracy** | Approximate formulas | Frame-perfect Monte Carlo |
| **Maintenance** | Track every patch | Community-maintained |
| **Dev Effort** | ~40k+ lines (see gcsim) | ~700 lines |
| **Rotation Handling** | Auto-estimated (inaccurate) | User-defined scripts |

### Chosen Approach

**Phase 1 (Sprint 12)**: Export team configs to wfpsim format
- Generate config text from team data
- User pastes into wfpsim.com and adds rotation
- Low effort, high accuracy

**Phase 2 (Future)**: Embedded wfpsim binary
- Bundle wfpsim with Tauri app
- Seamless in-app simulation
- Higher maintenance burden

See [SPRINT_12_PLAN.md](./SPRINT_12_PLAN.md) for implementation details.

---

## Original Design (Archived)

The below design documents the original custom DPS calculator approach, preserved for reference.

---

## Overview

The Team DPS Comparison feature enables players to compare theoretical damage output between different team compositions. This helps players make informed decisions about team building, character investment, and content strategy.

---

## User Stories

1. **As a player**, I want to compare my teams' damage potential so I can decide which team to invest in
2. **As a player**, I want to see which team is strongest for specific content (single target vs AoE)
3. **As a player**, I want to understand each character's contribution to team DPS
4. **As a player**, I want to see how elemental reactions affect my team's damage
5. **As a player**, I want recommendations for improving my team composition

---

## Current State Analysis

### What We Have

| Data | Location | Status |
|------|----------|--------|
| Character type (level, talents, weapon, artifacts) | `types/index.ts` | ✅ Complete |
| Team type (name, characterKeys, notes) | `types/index.ts` | ✅ Complete |
| Character metadata (element, weaponType, rarity) | `features/roster/data/characterMetadata.ts` | ✅ 110+ characters |
| Artifact sets (35+ sets) | `features/artifacts/domain/artifactConstants.ts` | ✅ Names only |
| Weapon database (150+ weapons) | `features/weapons/domain/weaponConstants.ts` | ✅ Names/types only |
| Build recommendations | `features/artifacts/domain/setRecommendations.ts` | ✅ 12 characters |
| Artifact stat scoring | `features/artifacts/domain/artifactScoring.ts` | ✅ Quality assessment |

### What We Need to Add

| Data | Priority | Source |
|------|----------|--------|
| Character base stats by level/ascension | Critical | genshin-db API or static |
| Talent multipliers per character | Critical | genshin-db API or static |
| Weapon base ATK + substats | Critical | genshin-db API or static |
| Artifact set bonus effects | High | Static data |
| Elemental reaction multipliers | High | Static (known formulas) |
| Character passive effects | Medium | Static data |
| Enemy resistance/defense data | Medium | Static data |

---

## Data Architecture

### New Type Definitions

```typescript
// types/dps.ts

/** Character combat stats derived from level, weapon, artifacts */
export interface CharacterStats {
  baseATK: number;      // Character base + weapon base
  baseHP: number;
  baseDEF: number;
  flatATK: number;      // From artifacts
  flatHP: number;
  flatDEF: number;
  atkPercent: number;   // Sum of all ATK% bonuses
  hpPercent: number;
  defPercent: number;
  critRate: number;     // 5% base + artifacts
  critDMG: number;      // 50% base + artifacts
  elementalMastery: number;
  energyRecharge: number;
  dmgBonus: {           // By damage type
    physical: number;
    pyro: number;
    hydro: number;
    electro: number;
    cryo: number;
    anemo: number;
    geo: number;
    dendro: number;
  };
}

/** Talent scaling data */
export interface TalentData {
  name: string;
  type: 'normal' | 'charged' | 'plunge' | 'skill' | 'burst';
  element: ElementType | 'physical';
  scalingAttribute: 'atk' | 'hp' | 'def' | 'em';
  multipliers: number[];  // By talent level (1-15)
  hits?: number;          // Multi-hit abilities
  cooldown?: number;      // Seconds
  energyCost?: number;    // Burst only
}

/** Elemental reaction types */
export type ReactionType =
  | 'vaporize'      // Pyro + Hydro (1.5x or 2x)
  | 'melt'          // Pyro + Cryo (1.5x or 2x)
  | 'overloaded'    // Pyro + Electro (transformative)
  | 'superconduct'  // Cryo + Electro (transformative + phys shred)
  | 'electroCharged' // Hydro + Electro (transformative)
  | 'frozen'        // Hydro + Cryo (CC)
  | 'swirl'         // Anemo + element (transformative)
  | 'crystallize'   // Geo + element (shield)
  | 'bloom'         // Dendro + Hydro (transformative)
  | 'hyperbloom'    // Bloom + Electro
  | 'burgeon'       // Bloom + Pyro
  | 'aggravate'     // Dendro + Electro (additive)
  | 'spread'        // Dendro on Quicken (additive)
  | 'burning';      // Dendro + Pyro

/** Reaction multiplier data */
export interface ReactionData {
  type: ReactionType;
  category: 'amplifying' | 'transformative' | 'additive' | 'other';
  baseMultiplier: number;
  emScaling: boolean;
  levelScaling: boolean;
}

/** Team DPS calculation result */
export interface TeamDPSResult {
  teamId: string;
  totalDPS: number;
  rotationTime: number;  // Seconds per rotation
  characterContributions: CharacterDPSContribution[];
  reactionContributions: ReactionContribution[];
  assumptions: string[];
  calculatedAt: string;
}

/** Per-character DPS breakdown */
export interface CharacterDPSContribution {
  characterKey: string;
  totalDamage: number;
  dpsPercent: number;
  breakdown: {
    normalAttacks: number;
    chargedAttacks: number;
    skill: number;
    burst: number;
    reactions: number;
  };
  fieldTime: number;  // Seconds on field
  buffContributions: BuffContribution[];
}

/** Buff/debuff contribution tracking */
export interface BuffContribution {
  source: string;        // "Bennett Burst", "VV 4pc", etc.
  type: 'atk' | 'dmgBonus' | 'critRate' | 'critDMG' | 'em' | 'resShred' | 'defShred';
  value: number;
  uptime: number;        // Percentage (0-1)
  affectedCharacters: string[];
}

/** Reaction damage contribution */
export interface ReactionContribution {
  reaction: ReactionType;
  trigger: string;       // Character who triggers
  damage: number;
  occurrences: number;   // Per rotation
}

/** Enemy configuration for calculations */
export interface EnemyConfig {
  level: number;
  resistance: {
    physical: number;
    pyro: number;
    hydro: number;
    electro: number;
    cryo: number;
    anemo: number;
    geo: number;
    dendro: number;
  };
  defenseMultiplier?: number;
}

/** DPS calculation parameters */
export interface DPSCalculationParams {
  team: Team;
  characters: Character[];
  enemy: EnemyConfig;
  rotationTime?: number;     // Override auto-detection
  assumptions?: {
    perfectRotation: boolean;
    fullBuffUptime: boolean;
    reactionConsistency: number;  // 0-1
  };
}
```

### Database Schema Changes

```typescript
// db/schema.ts - Version 4

db.version(4).stores({
  // ... existing tables

  // Team DPS snapshots for historical tracking
  teamDPSSnapshots: '++id, teamId, calculatedAt',

  // Character stat cache (avoid recalculating)
  characterStatCache: 'characterId, updatedAt',
});

interface TeamDPSSnapshot {
  id?: number;
  teamId: string;
  result: TeamDPSResult;
  params: DPSCalculationParams;
  calculatedAt: string;
}

interface CharacterStatCache {
  characterId: string;
  stats: CharacterStats;
  updatedAt: string;
}
```

---

## Damage Formula Implementation

### Core Damage Formula

Genshin Impact uses the following damage formula:

```
Damage = Base Damage × (1 + DMG Bonus) × DEF Multiplier × RES Multiplier × Crit Multiplier × Reaction Multiplier
```

Where:
- **Base Damage** = Talent Multiplier × Scaling Stat (ATK/HP/DEF/EM)
- **DMG Bonus** = Sum of all damage bonuses (elemental, skill-specific, etc.)
- **DEF Multiplier** = (Char Level + 100) / ((Char Level + 100) + (Enemy Level + 100) × (1 - DEF Reduction))
- **RES Multiplier** = Based on enemy resistance after shred
- **Crit Multiplier** = 1 + (Crit Rate × Crit DMG) for average, or full crit for ceiling

### Implementation

```typescript
// features/teams/domain/damageFormula.ts

export interface DamageCalculationInput {
  talentMultiplier: number;
  scalingStat: number;      // Final ATK/HP/DEF value
  dmgBonus: number;         // As decimal (0.466 for 46.6%)
  critRate: number;         // As decimal
  critDMG: number;          // As decimal
  characterLevel: number;
  enemyLevel: number;
  enemyResistance: number;  // As decimal
  defReduction?: number;    // As decimal
  resShred?: number;        // As decimal
}

export function calculateDamage(input: DamageCalculationInput): {
  average: number;
  nonCrit: number;
  crit: number;
} {
  const {
    talentMultiplier,
    scalingStat,
    dmgBonus,
    critRate,
    critDMG,
    characterLevel,
    enemyLevel,
    enemyResistance,
    defReduction = 0,
    resShred = 0,
  } = input;

  // Base damage
  const baseDamage = talentMultiplier * scalingStat;

  // DMG bonus multiplier
  const dmgMultiplier = 1 + dmgBonus;

  // DEF multiplier
  const defMultiplier = (characterLevel + 100) /
    ((characterLevel + 100) + (enemyLevel + 100) * (1 - defReduction));

  // RES multiplier (complex formula based on final resistance)
  const finalRes = enemyResistance - resShred;
  let resMultiplier: number;
  if (finalRes < 0) {
    resMultiplier = 1 - (finalRes / 2);
  } else if (finalRes < 0.75) {
    resMultiplier = 1 - finalRes;
  } else {
    resMultiplier = 1 / (4 * finalRes + 1);
  }

  // Calculate non-crit and crit damage
  const nonCritDamage = baseDamage * dmgMultiplier * defMultiplier * resMultiplier;
  const critDamage = nonCritDamage * (1 + critDMG);

  // Average damage (accounting for crit rate)
  const effectiveCritRate = Math.min(critRate, 1); // Cap at 100%
  const averageDamage = nonCritDamage * (1 + effectiveCritRate * critDMG);

  return {
    average: averageDamage,
    nonCrit: nonCritDamage,
    crit: critDamage,
  };
}
```

### Reaction Formulas

```typescript
// features/teams/domain/reactionFormulas.ts

// Transformative reaction base damage by character level
const TRANSFORMATIVE_BASE: Record<number, number> = {
  90: 1446.85,
  89: 1405.10,
  80: 1077.44,
  // ... etc
};

// Reaction type multipliers
const REACTION_MULTIPLIERS: Record<ReactionType, number> = {
  overloaded: 2.0,
  superconduct: 0.5,
  electroCharged: 1.2,
  swirl: 0.6,
  bloom: 2.0,
  hyperbloom: 3.0,
  burgeon: 3.0,
  burning: 0.25,
  // Amplifying reactions use different formula
  vaporize: 0,  // Handled separately
  melt: 0,
  aggravate: 0,
  spread: 0,
  frozen: 0,
  crystallize: 0,
};

export function calculateTransformativeReaction(
  reaction: ReactionType,
  characterLevel: number,
  elementalMastery: number,
  enemyResistance: number,
  resShred: number = 0
): number {
  const baseValue = TRANSFORMATIVE_BASE[characterLevel] ?? TRANSFORMATIVE_BASE[90];
  const reactionMultiplier = REACTION_MULTIPLIERS[reaction];

  // EM bonus for transformative reactions
  const emBonus = (16 * elementalMastery) / (elementalMastery + 2000);

  // Resistance calculation
  const finalRes = enemyResistance - resShred;
  const resMultiplier = finalRes < 0
    ? 1 - (finalRes / 2)
    : finalRes < 0.75
      ? 1 - finalRes
      : 1 / (4 * finalRes + 1);

  return baseValue * reactionMultiplier * (1 + emBonus) * resMultiplier;
}

export function calculateAmplifyingReaction(
  reaction: 'vaporize' | 'melt',
  isForward: boolean,  // Pyro on Hydro / Cryo on Pyro = forward (2x base)
  baseDamage: number,
  elementalMastery: number
): number {
  const baseMultiplier = isForward ? 2.0 : 1.5;
  const emBonus = (2.78 * elementalMastery) / (elementalMastery + 1400);

  return baseDamage * baseMultiplier * (1 + emBonus);
}

export function calculateAdditiveReaction(
  reaction: 'aggravate' | 'spread',
  characterLevel: number,
  elementalMastery: number
): number {
  const baseValue = TRANSFORMATIVE_BASE[characterLevel] ?? TRANSFORMATIVE_BASE[90];
  const reactionMultiplier = reaction === 'aggravate' ? 1.15 : 1.25;
  const emBonus = (5 * elementalMastery) / (elementalMastery + 1200);

  return baseValue * reactionMultiplier * (1 + emBonus);
}
```

---

## Feature Architecture

### Directory Structure

```
src/features/teams/
├── pages/
│   └── TeamDPSPage.tsx              # Main comparison page
├── components/
│   ├── TeamComparison.tsx           # Side-by-side team cards
│   ├── TeamDPSCard.tsx              # Single team DPS summary
│   ├── DPSBreakdownChart.tsx        # Pie/bar chart of contributions
│   ├── CharacterContribution.tsx    # Per-character damage breakdown
│   ├── ReactionAnalysis.tsx         # Reaction damage visualization
│   ├── BuffTimeline.tsx             # Buff uptime visualization
│   ├── TeamRanking.tsx              # Ranked list of user's teams
│   ├── EnemyConfigPanel.tsx         # Enemy level/resistance settings
│   └── CalculationAssumptions.tsx   # Show/edit calculation assumptions
├── domain/
│   ├── damageFormula.ts             # Core damage calculations
│   ├── reactionFormulas.ts          # Reaction damage calculations
│   ├── statCalculator.ts            # Derive stats from character data
│   ├── teamSynergy.ts               # Team buff/debuff analysis
│   ├── rotationEstimator.ts         # Estimate rotation time/field time
│   └── dpsCalculator.ts             # Main DPS calculation orchestrator
├── hooks/
│   ├── useTeamDPS.ts                # Calculate DPS for a team
│   ├── useCharacterStats.ts         # Derive character combat stats
│   └── useTeamComparison.ts         # Compare multiple teams
├── repo/
│   └── teamDPSRepo.ts               # Snapshot persistence
├── data/
│   ├── characterScaling.ts          # Talent multipliers by character
│   ├── weaponStats.ts               # Weapon base ATK + passives
│   ├── artifactSetBonuses.ts        # Set bonus effects
│   ├── reactionData.ts              # Reaction constants
│   └── enemyPresets.ts              # Common enemy configurations
└── index.ts                         # Barrel exports
```

### Component Hierarchy

```
TeamDPSPage
├── EnemyConfigPanel
├── TeamComparison
│   ├── TeamDPSCard (Team A)
│   │   ├── DPSBreakdownChart
│   │   └── CharacterContribution (×4)
│   │       └── BuffTimeline
│   └── TeamDPSCard (Team B)
│       └── ...
├── ReactionAnalysis
└── CalculationAssumptions
```

---

## Data Sources

### Option 1: genshin-db API Extension (Recommended)

Extend existing `genshinDbService.ts` to fetch:
- Character base stats: `https://genshin-db-api.vercel.app/api/v5/characters?query=<name>&resultLanguage=en`
- Talent data: `https://genshin-db-api.vercel.app/api/v5/talents?query=<name>&resultLanguage=en`
- Weapon stats: `https://genshin-db-api.vercel.app/api/v5/weapons?query=<name>&resultLanguage=en`

**Pros:**
- Already have caching infrastructure
- Consistent with existing architecture
- Auto-updates with game patches

**Cons:**
- Requires API availability
- Network dependency

### Option 2: Static Data Files

Bundle essential data as static TypeScript files:

```typescript
// data/characterScaling.ts
export const CHARACTER_TALENTS: Record<string, TalentData[]> = {
  'HuTao': [
    {
      name: 'Normal Attack',
      type: 'normal',
      element: 'physical',
      scalingAttribute: 'atk',
      multipliers: [0.469, 0.507, 0.545, ...], // Level 1-15
      hits: 6,
    },
    {
      name: 'Guide to Afterlife',
      type: 'skill',
      element: 'pyro',
      scalingAttribute: 'hp',
      multipliers: [0.0384, 0.0407, 0.0430, ...],
      cooldown: 16,
    },
    // ...
  ],
  // ... other characters
};
```

**Pros:**
- Works offline
- No API dependency
- Faster calculations

**Cons:**
- Manual updates needed for new characters/changes
- Larger bundle size

### Recommended Approach: Hybrid

1. **Primary**: Use genshin-db API with aggressive caching (7 days)
2. **Fallback**: Bundle static data for top 20 popular characters
3. **Cache**: Store calculated stats in IndexedDB to avoid recalculation

---

## UI/UX Design

### Team DPS Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Team DPS Comparison                    [Enemy: Lv90 Hilichurl ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  Team: National         │  │  Team: Hyperbloom           │  │
│  │  ─────────────────────  │  │  ─────────────────────────  │  │
│  │  Total DPS: 45,230      │  │  Total DPS: 52,180          │  │
│  │  Rotation: 22s          │  │  Rotation: 18s              │  │
│  │                         │  │                             │  │
│  │  [Pie Chart]            │  │  [Pie Chart]                │  │
│  │  ● Xiangling 42%        │  │  ● Nahida 38%               │  │
│  │  ● Xingqiu 28%          │  │  ● Raiden 32%               │  │
│  │  ● Bennett 18%          │  │  ● Yelan 22%                │  │
│  │  ● Raiden 12%           │  │  ● Zhongli 8%               │  │
│  │                         │  │                             │  │
│  │  Key Reactions:         │  │  Key Reactions:             │  │
│  │  • Vaporize (62%)       │  │  • Hyperbloom (45%)         │  │
│  │  • Overload (15%)       │  │  • Aggravate (28%)          │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Calculation Assumptions                              [Edit]││
│  │  • Perfect rotation execution                               ││
│  │  • 100% buff uptime (Bennett, VV, etc.)                    ││
│  │  • 85% reaction consistency                                 ││
│  │  • Enemy: Level 90, 10% all resistance                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Character Contribution Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  Xiangling - Pyronado DPS                                       │
├─────────────────────────────────────────────────────────────────┤
│  Total Damage: 18,950 (42% of team)                            │
│  Field Time: 3.5s (16% of rotation)                            │
│                                                                 │
│  Breakdown:                                                     │
│  ├── Pyronado (Burst): 15,200                                  │
│  │   └── 12 hits × 1,267 avg (Vaporize: 8 hits)               │
│  ├── Guoba (Skill): 2,800                                      │
│  └── Normal Attacks: 950                                       │
│                                                                 │
│  Active Buffs:                                                  │
│  ├── Bennett ATK Buff: +1,200 ATK (100% uptime)               │
│  ├── VV Pyro Shred: -40% RES (85% uptime)                     │
│  └── Noblesse 4pc: +20% ATK (100% uptime)                     │
│                                                                 │
│  Stats Used:                                                    │
│  ATK: 2,450 | Crit: 65/180 | EM: 120 | Pyro DMG: 61.6%        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Plan

### Unit Tests (35-40 tests)

**Domain Logic:**
```typescript
describe('damageFormula', () => {
  it('calculates base damage correctly', () => { ... });
  it('applies defense multiplier based on levels', () => { ... });
  it('handles negative resistance correctly', () => { ... });
  it('caps crit rate at 100%', () => { ... });
  it('calculates average damage with crit', () => { ... });
});

describe('reactionFormulas', () => {
  it('calculates transformative reaction damage', () => { ... });
  it('applies EM bonus to reactions', () => { ... });
  it('calculates vaporize forward (2x)', () => { ... });
  it('calculates melt reverse (1.5x)', () => { ... });
  it('calculates aggravate flat bonus', () => { ... });
});

describe('statCalculator', () => {
  it('aggregates artifact substats', () => { ... });
  it('applies weapon base ATK', () => { ... });
  it('calculates final ATK with % bonuses', () => { ... });
  it('includes set bonus stats', () => { ... });
});

describe('teamSynergy', () => {
  it('identifies team buffs (Bennett)', () => { ... });
  it('calculates VV resistance shred', () => { ... });
  it('stacks multiple ATK buffs', () => { ... });
  it('identifies possible reactions', () => { ... });
});
```

### Integration Tests (10-15 tests)

```typescript
describe('useTeamDPS', () => {
  it('calculates DPS for complete team', () => { ... });
  it('handles missing character data gracefully', () => { ... });
  it('recalculates when team changes', () => { ... });
  it('caches results for performance', () => { ... });
});

describe('TeamComparison', () => {
  it('renders two teams side by side', () => { ... });
  it('highlights higher DPS team', () => { ... });
  it('shows percentage difference', () => { ... });
});
```

---

## Implementation Phases

### Phase 3a: Foundation (Week 1)

1. Add type definitions to `types/dps.ts`
2. Implement `damageFormula.ts` with tests
3. Implement `reactionFormulas.ts` with tests
4. Add database schema changes
5. Create static data for top 10 characters

### Phase 3b: Calculation Engine (Week 2)

1. Implement `statCalculator.ts` - derive stats from character data
2. Implement `teamSynergy.ts` - identify buffs and reactions
3. Implement `dpsCalculator.ts` - orchestrate full calculation
4. Extend genshin-db service for talent/weapon data
5. Add caching layer for calculated stats

### Phase 3c: UI Components (Week 3)

1. Create `TeamDPSCard.tsx` component
2. Create `DPSBreakdownChart.tsx` with Recharts
3. Create `CharacterContribution.tsx` detail view
4. Create `EnemyConfigPanel.tsx` for enemy settings
5. Assemble `TeamDPSPage.tsx`

### Phase 3d: Polish & Integration (Week 4)

1. Add `TeamComparison.tsx` for side-by-side view
2. Add `ReactionAnalysis.tsx` for reaction breakdown
3. Integrate with existing Teams section
4. Add DPS badge to team cards across app
5. Performance optimization and final testing

---

## Limitations & Disclaimers

The DPS calculation system will include clear disclaimers:

1. **Theoretical Maximum**: Calculations assume perfect play
2. **Rotation Variance**: Actual gameplay varies based on skill
3. **Content Specific**: Results optimized for single-target sustained DPS
4. **Simplifications**:
   - ICD (Internal Cooldown) not fully modeled
   - Gauge theory simplified
   - Enemy AI patterns not considered
   - Stamina management not factored

Display prominently:
> "These calculations represent theoretical DPS under ideal conditions. Actual performance varies based on gameplay, enemy behavior, and team execution."

---

## Future Enhancements

1. **Rotation Builder**: Visual rotation timeline editor
2. **AoE vs Single Target**: Toggle between calculation modes
3. **Specific Content**: Spiral Abyss floor presets with enemy data
4. **Community Sharing**: Share team builds with DPS benchmarks
5. **Historical Tracking**: Track DPS improvements over time
6. **Video Integration**: Link to rotation demonstration videos
