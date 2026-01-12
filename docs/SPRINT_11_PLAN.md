# Sprint 11 - Foundation & Features

> **Status**: Planning
> **Target**: January 2026
> **Starting Test Count**: 545 tests

---

## Overview

Sprint 11 is a comprehensive sprint divided into three phases:

1. **Phase 1: Test Coverage Expansion** - Increase test coverage to 80%+
2. **Phase 2: Technical Debt Reduction** - Refactor large components, improve type safety
3. **Phase 3: New Feature Development** - Team DPS comparisons, build templates, boss tracker

---

## Phase 1: Test Coverage Expansion

**Goal**: Increase test coverage from ~65-70% to 80%+, targeting the critical gaps identified in the codebase review.

### 1.1 Page Component Tests (HIGH PRIORITY)

Currently only 2 of 13 pages have tests. Add comprehensive tests for:

| Page | File | Priority | Est. Tests |
|------|------|----------|------------|
| PlannerPage | `features/planner/pages/PlannerPage.tsx` | Critical | 40-50 |
| CalculatorPage | `features/calculator/pages/CalculatorPage.tsx` | Critical | 25-30 |
| WishesPage | `features/wishes/pages/WishesPage.tsx` | Critical | 20-25 |
| WishHistoryPage | `features/wishes/pages/WishHistoryPage.tsx` | High | 20-25 |
| CalendarPage | `features/calendar/pages/CalendarPage.tsx` | High | 15-20 |
| DashboardPage | `features/dashboard/pages/DashboardPage.tsx` | High | 15-20 |
| LedgerPage | `features/ledger/pages/LedgerPage.tsx` | Medium | 20-25 |
| ArtifactsPage | `features/artifacts/pages/ArtifactsPage.tsx` | Medium | 15-20 |
| WeaponsPage | `features/weapons/pages/WeaponsPage.tsx` | Medium | 15-20 |
| NotesPage | `features/notes/pages/NotesPage.tsx` | Low | 10-15 |
| SyncPage | `features/sync/pages/SyncPage.tsx` | Low | 10-15 |

**Test Coverage Requirements:**
- Render tests (loading, empty, populated states)
- User interaction tests (clicks, form submissions)
- Navigation tests (route changes, modal triggers)
- Error state handling
- Accessibility checks (keyboard navigation, ARIA)

### 1.2 Custom Hook Tests (HIGH PRIORITY)

No hooks currently have direct tests. Add tests for:

| Hook | File | Priority | Est. Tests |
|------|------|----------|------------|
| useCharacters | `features/roster/hooks/useCharacters.ts` | Critical | 15-20 |
| useTeams | `features/roster/hooks/useTeams.ts` | Critical | 10-15 |
| useMaterials | `features/planner/hooks/useMaterials.ts` | Critical | 15-20 |
| useMultiCharacterPlan | `features/planner/hooks/useMultiCharacterPlan.ts` | High | 10-15 |
| useWeaponPlan | `features/planner/hooks/useWeaponPlan.ts` | High | 10-15 |
| useResources | `features/ledger/hooks/useResources.ts` | High | 15-20 |
| useEvents | `features/calendar/hooks/useEvents.ts` | Medium | 10-15 |
| useArtifacts | `features/artifacts/hooks/useArtifacts.ts` | Medium | 10-15 |
| useWeapons | `features/weapons/hooks/useWeapons.ts` | Medium | 10-15 |
| useGoals | `features/notes/hooks/useGoals.ts` | Low | 8-10 |
| useNotes | `features/notes/hooks/useNotes.ts` | Low | 8-10 |
| useCurrentPity | `features/wishes/hooks/useCurrentPity.ts` | Medium | 10-15 |
| useTheme | `hooks/useTheme.ts` | Medium | 8-10 |
| useRosterModals | `features/roster/hooks/useRosterModals.ts` | Low | 10-12 |

**Hook Test Pattern:**
```typescript
// Use @testing-library/react renderHook
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useCharacters', () => {
  it('returns empty array initially', () => { ... });
  it('creates character and updates list', async () => { ... });
  it('filters characters by element', () => { ... });
  it('sorts characters by priority', () => { ... });
});
```

### 1.3 UI Component Tests (MEDIUM PRIORITY)

Complete coverage for remaining UI primitives:

| Component | File | Priority | Est. Tests |
|-----------|------|----------|------------|
| Card | `components/ui/Card.tsx` | Medium | 12-15 |
| Badge | `components/ui/Badge.tsx` | Medium | 15-18 |
| Select | `components/ui/Select.tsx` | Medium | 15-20 |
| Skeleton | `components/ui/Skeleton.tsx` | Low | 8-10 |
| Toast | `components/ui/Toast.tsx` | Low | 10-12 |

### 1.4 Service Tests (MEDIUM PRIORITY)

Add direct tests for services (currently only mocked):

| Service | File | Priority | Est. Tests |
|---------|------|----------|------------|
| resourceService | `lib/services/resourceService.ts` | High | 20-25 |
| genshinDbService | `lib/services/genshinDbService.ts` | Medium | 15-20 |

### 1.5 Utility Tests (LOW PRIORITY)

| Utility | File | Priority | Est. Tests |
|---------|------|----------|------------|
| materialNormalization | `lib/utils/materialNormalization.ts` | Medium | 10-15 |
| errorHandler | `lib/errorHandler.ts` | Low | 8-10 |
| qrScanner | `lib/qrScanner.ts` | Low | 5-8 |

### 1.6 E2E Test Suite (NEW)

Create end-to-end tests for critical user workflows:

| Workflow | Description | Priority |
|----------|-------------|----------|
| Wish Import Flow | Import URL → Parse → View Statistics → Check Pity | Critical |
| Character Planning | Add Character → Set Goals → View Materials → Check Deficit | Critical |
| Resource Tracking | Add Snapshot → Project Income → View Chart | High |
| Team Building | Create Team → Add Characters → View Recommendations | High |
| Data Export/Import | Export GOOD → Clear Data → Import GOOD → Verify | Medium |

**E2E Framework**: Playwright (recommended) or Vitest Browser Mode

**Phase 1 Deliverables:**
- [ ] 200+ new test cases
- [ ] All 13 pages have test files
- [ ] All major hooks have test files
- [ ] All UI primitives have test files
- [ ] E2E test suite with 5+ workflows
- [ ] Coverage report showing 80%+ overall

---

## Phase 2: Technical Debt Reduction

**Goal**: Improve code maintainability, type safety, and developer experience.

### 2.1 Component Refactoring (HIGH PRIORITY)

Break down large components into manageable pieces:

#### PlannerPage.tsx (1,096 lines → target <300 lines)

Extract into:
```
features/planner/
├── pages/
│   └── PlannerPage.tsx              # Shell, routing, state coordination
├── components/
│   ├── CharacterSelector.tsx        # Multi-select character picker
│   ├── GoalTypeSelector.tsx         # Goal dropdown (Max, Comfortable, Functional)
│   ├── MaterialSummary.tsx          # Aggregated material list
│   ├── ResinBreakdown.tsx           # Resin cost visualization
│   ├── FarmingSchedule.tsx          # Today's domain recommendations
│   ├── DeficitPriority.tsx          # Material blocking analysis
│   ├── ResinEfficiencyPanel.tsx     # Daily priority recommendations
│   └── WeaponPlannerSection.tsx     # Weapon material planning
└── hooks/
    ├── usePlannerState.ts           # Page-level state management
    └── useFarmingRecommendations.ts # Farming logic hook
```

#### MultiTargetCalculator.tsx (983 lines → target <250 lines)

Extract into:
```
features/calculator/
├── components/
│   ├── MultiTargetCalculator.tsx    # Shell component
│   ├── TargetList.tsx               # Target management UI
│   ├── TargetForm.tsx               # Add/edit target form
│   ├── SimulationControls.tsx       # Run simulation, iteration count
│   ├── ProbabilityResults.tsx       # Results display
│   ├── ProbabilityChart.tsx         # Recharts visualization
│   └── ScenarioManager.tsx          # Save/load/compare scenarios
└── hooks/
    └── useMultiTargetSimulation.ts  # Simulation state + worker
```

#### gameData.ts (1,015 lines → modular structure)

Refactor into:
```
lib/
├── gameData/
│   ├── index.ts                     # Barrel exports
│   ├── characters.ts                # Character metadata
│   ├── weapons.ts                   # Weapon metadata
│   ├── artifacts.ts                 # Artifact set data
│   ├── materials.ts                 # Material definitions
│   ├── elements.ts                  # Element types + colors
│   └── icons.ts                     # Icon URL mappings
└── gameData.ts                      # Re-export for backwards compatibility
```

### 2.2 Type Safety Improvements (HIGH PRIORITY)

Eliminate `any` types and `@ts-ignore` directives:

| Area | Current Issues | Target |
|------|----------------|--------|
| Mappers (good.ts, enka.ts) | ~40 any types | 0 any types |
| External API responses | Loose typing | Strict interfaces |
| Event handlers | Some any parameters | Proper event types |
| Dynamic object access | Index signature issues | Type guards |

**Implementation:**
1. Create strict interfaces for external formats:
   ```typescript
   // types/external/good.ts
   interface GOODFormat { ... }

   // types/external/enka.ts
   interface EnkaResponse { ... }

   // types/external/irminsul.ts
   interface IrminsulWishHistory { ... }
   ```

2. Add type guards for runtime validation:
   ```typescript
   function isGOODFormat(data: unknown): data is GOODFormat { ... }
   ```

3. Replace `any` with `unknown` + type narrowing

### 2.3 Barrel Exports (MEDIUM PRIORITY)

Add `index.ts` files to all feature directories:

```typescript
// features/roster/index.ts
export { RosterPage } from './pages/RosterPage';
export { CharacterDetailPage } from './pages/CharacterDetailPage';
export { useCharacters } from './hooks/useCharacters';
export { useTeams } from './hooks/useTeams';
export { characterRepo } from './repo/characterRepo';
export type { Character, Team } from './types';
```

**Benefits:**
- Cleaner imports: `import { useCharacters } from '@/features/roster'`
- Explicit public API per feature
- Easier refactoring (internal changes don't break imports)

### 2.4 Cross-Feature Coupling (MEDIUM PRIORITY)

Reduce tight coupling in `resourceService.ts`:

**Current Issues:**
- Direct imports from ledger, wishes, calculator features
- Circular dependency risk

**Solution:**
1. Define shared interfaces in `types/`
2. Use dependency injection pattern
3. Create event-based communication for cross-feature updates

```typescript
// lib/services/resourceService.ts
interface ResourceServiceDeps {
  getWishCount: () => Promise<number>;
  getSnapshots: () => Promise<ResourceSnapshot[]>;
  getPityState: () => Promise<PityState>;
}

export function createResourceService(deps: ResourceServiceDeps) { ... }
```

### 2.5 Documentation (LOW PRIORITY)

Add inline documentation for complex logic:

- [ ] Add JSDoc to all public functions in domain/
- [ ] Document calculation formulas with references
- [ ] Add ADR (Architecture Decision Records) for key patterns

**Phase 2 Deliverables:**
- [ ] PlannerPage under 300 lines
- [ ] MultiTargetCalculator under 250 lines
- [ ] gameData split into modules
- [ ] 0 `any` types in mappers
- [ ] All features have index.ts barrel exports
- [ ] resourceService uses dependency injection

---

## Phase 3: New Feature Development

**Goal**: Add high-value features from the sprint backlog.

### 3.1 Team DPS Comparisons (HIGH PRIORITY)

**Description**: Compare theoretical DPS output between different team compositions.

**User Stories:**
- As a player, I want to compare my teams' damage potential
- As a player, I want to see which team is strongest for specific content
- As a player, I want recommendations for team improvements

**Technical Design:**

```
features/teams/
├── domain/
│   ├── dpsCalculator.ts         # DPS formulas and calculations
│   ├── teamSynergy.ts           # Reaction/buff calculations
│   ├── rotationSimulator.ts     # Rotation-based DPS estimation
│   └── enemyDefense.ts          # Enemy resistance/defense data
├── components/
│   ├── TeamComparison.tsx       # Side-by-side team comparison
│   ├── DPSBreakdown.tsx         # Per-character contribution chart
│   ├── SynergyAnalysis.tsx      # Reaction/buff visualization
│   └── TeamRanking.tsx          # Ranked list of user's teams
├── hooks/
│   └── useTeamDPS.ts            # DPS calculation hook
└── data/
    ├── characterScaling.ts      # Talent multipliers
    └── reactionMultipliers.ts   # Elemental reaction data
```

**Key Calculations:**
- Base ATK × (1 + ATK%) × Talent Multiplier × (1 + DMG%) × Crit Factor
- Elemental reaction multipliers (Vaporize, Melt, Aggravate, etc.)
- Team buff stacking (Bennett ATK, VV shred, etc.)

**Database Changes:**
- Add `teamDPSSnapshots` table for historical tracking

**Estimated Effort**: 40-50 tests, 8-10 components

### 3.2 Build Templates (MEDIUM PRIORITY)

**Description**: Save, load, and share character build configurations.

**User Stories:**
- As a player, I want to save my current build as a template
- As a player, I want to apply a template to quickly configure a character
- As a player, I want to share builds with friends via export

**Technical Design:**

```
features/builds/
├── domain/
│   ├── buildTemplate.ts         # Template structure and validation
│   └── buildComparison.ts       # Compare builds (stats diff)
├── components/
│   ├── BuildTemplateCard.tsx    # Template preview card
│   ├── BuildTemplateForm.tsx    # Create/edit template
│   ├── BuildLibrary.tsx         # Browse saved templates
│   ├── ApplyTemplateModal.tsx   # Apply template to character
│   └── ShareBuildModal.tsx      # Export/share functionality
├── hooks/
│   └── useBuildTemplates.ts     # Template CRUD operations
└── repo/
    └── buildTemplateRepo.ts     # IndexedDB persistence
```

**Template Structure:**
```typescript
interface BuildTemplate {
  id: string;
  name: string;
  characterName: string;
  weapon: WeaponBuild;
  artifacts: ArtifactBuild;
  talents: TalentLevels;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  shareCode?: string;  // For sharing
}
```

**Database Changes:**
- Add `buildTemplates` table

**Estimated Effort**: 25-30 tests, 6-8 components

### 3.3 Weekly Boss Tracker (MEDIUM PRIORITY)

**Description**: Track weekly boss completions with reset timer.

**User Stories:**
- As a player, I want to see which weekly bosses I've completed
- As a player, I want to know when weekly bosses reset
- As a player, I want to track boss material drops for character planning

**Technical Design:**

```
features/bosses/
├── domain/
│   ├── bossData.ts              # Boss definitions, drops, costs
│   ├── weeklyReset.ts           # Reset timer calculations
│   └── dropTracking.ts          # Material drop statistics
├── components/
│   ├── WeeklyBossTracker.tsx    # Main tracker grid
│   ├── BossCard.tsx             # Individual boss status
│   ├── BossResetTimer.tsx       # Countdown to reset
│   ├── DropHistoryChart.tsx     # Drop rate visualization
│   └── BossMaterialNeeds.tsx    # Integration with planner
├── hooks/
│   ├── useWeeklyBosses.ts       # Boss completion state
│   └── useBossDrops.ts          # Drop history tracking
├── repo/
│   └── bossCompletionRepo.ts    # Completion persistence
└── data/
    └── weeklyBosses.ts          # Boss metadata
```

**Boss Data:**
```typescript
interface WeeklyBoss {
  id: string;
  name: string;
  region: string;
  resinCost: number;  // 30 resin (discounted) or 60
  drops: BossMaterial[];
  unlockedAt?: string;  // Archon quest requirement
}
```

**Database Changes:**
- Add `bossCompletions` table
- Add `bossDropHistory` table

**Integration Points:**
- Calendar page: Add boss reset timer
- Planner page: Show boss material requirements
- Dashboard: Weekly boss completion status

**Estimated Effort**: 20-25 tests, 6-8 components

### 3.4 Mobile Navigation Enhancement (LOW PRIORITY)

**Description**: Improve navigation experience on mobile devices.

**Options:**
1. **Bottom Tab Bar**: Fixed bottom navigation for primary features
2. **Hamburger Menu**: Collapsible side drawer
3. **Hybrid**: Bottom tabs for main features + drawer for settings

**Recommended**: Bottom Tab Bar with 5 primary destinations

```tsx
// components/common/BottomNav.tsx
const PRIMARY_TABS = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/roster', icon: Users, label: 'Roster' },
  { path: '/wishes', icon: Sparkles, label: 'Wishes' },
  { path: '/planner', icon: Calendar, label: 'Planner' },
  { path: '/more', icon: Menu, label: 'More' },  // Opens drawer
];
```

**Implementation:**
- Show bottom nav on screens < 768px
- Keep horizontal tabs on larger screens
- "More" tab opens drawer with remaining features

**Estimated Effort**: 10-15 tests, 3-4 components

---

## Sprint 11 Summary

### Deliverables Checklist

**Phase 1: Test Coverage**
- [ ] Page component tests (11 new test files)
- [ ] Custom hook tests (14 new test files)
- [ ] UI component tests (5 new test files)
- [ ] Service tests (2 new test files)
- [ ] E2E test suite (5+ workflows)
- [ ] Target: 750+ total tests (200+ new)

**Phase 2: Technical Debt**
- [ ] PlannerPage refactored (<300 lines)
- [ ] MultiTargetCalculator refactored (<250 lines)
- [ ] gameData modularized
- [ ] Type safety: 0 `any` in mappers
- [ ] Barrel exports in all features
- [ ] Cross-feature coupling reduced

**Phase 3: New Features**
- [ ] Team DPS Comparisons
- [ ] Build Templates
- [ ] Weekly Boss Tracker
- [ ] Mobile Navigation (stretch goal)

### Success Criteria

1. **Test Coverage**: 80%+ overall coverage, all critical paths tested
2. **Code Quality**: No files over 300 lines, 0 `any` types in public APIs
3. **Features**: 3 new features fully functional with tests
4. **Performance**: No regression in build time or runtime performance

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Phase 1 & 2 must complete before Phase 3 features |
| Test flakiness | Use fake-indexeddb consistently, avoid timing-based tests |
| Breaking changes | Run full test suite before each phase completion |
| DPS calculation accuracy | Research community formulas, add disclaimers |

---

## Appendix: File Changes Summary

### New Files (Estimated)

**Tests**: ~35 new test files
**Components**: ~25 new components
**Hooks**: ~8 new hooks
**Domain**: ~10 new domain files
**Types**: ~5 new type files
**Repos**: ~3 new repos

### Modified Files

- `src/features/planner/pages/PlannerPage.tsx` (major refactor)
- `src/features/calculator/components/MultiTargetCalculator.tsx` (major refactor)
- `src/lib/gameData.ts` (split into modules)
- `src/mappers/*.ts` (type safety improvements)
- `src/db/schema.ts` (new tables)
- All feature directories (add index.ts)

### Database Migrations

```typescript
// db/schema.ts - Version 4
db.version(4).stores({
  // Existing tables...
  buildTemplates: '++id, characterName, createdAt',
  bossCompletions: '++id, bossId, weekStart',
  bossDropHistory: '++id, bossId, date',
  teamDPSSnapshots: '++id, teamId, calculatedAt',
});
```
