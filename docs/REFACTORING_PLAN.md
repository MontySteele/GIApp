# UI Consolidation Refactoring Plan

## Overview

Consolidate the app from **13 tabs to 6 tabs** with a team-centric workflow.

### Target Tab Structure

| Tab | Purpose | Consolidates |
|-----|---------|--------------|
| **Dashboard** | Today's priorities, quick stats | Dashboard |
| **Roster** | Collection management | Roster + Weapons + Artifacts |
| **Teams** | Team planning hub | Teams + Planner + Builds + Bosses |
| **Wishes** | Pull planning & tracking | Wishes + Calculator + Primogems/Ledger |
| **Calendar** | Daily farming schedule | Calendar |
| **Settings** | Configuration & sync | Settings/Sync |

### Primary User Flow

```
"I want to build a team for Spiral Abyss"

1. Wishes → Can I get the characters I need? Track primogems, simulate pulls
2. Teams  → Create team, apply build templates, see all materials needed
3. Teams  → Track weekly boss completion, see farming requirements
4. Teams  → Export to wfpsim to validate DPS/rotation
5. Calendar → See when talent domains are available today
```

---

## Phase 1: Roster Consolidation

**Goal**: Merge Artifacts, Weapons into Roster as sub-views/tabs

### Current State
- `/roster` - Character list and detail pages
- `/artifacts` - Artifact inventory with filtering
- `/weapons` - Weapon inventory with filtering

### Target State
- `/roster` - Unified collection view with character/weapon/artifact tabs
- `/roster/:id` - Character detail (unchanged)

### Tasks

#### 1.1 Create Roster sub-navigation
```
/roster
├── /roster/characters (default)
├── /roster/weapons
├── /roster/artifacts
└── /roster/:id (character detail)
```

**Files to modify:**
- `src/app/routes.tsx` - Add nested routes
- `src/features/roster/pages/RosterPage.tsx` - Add tab navigation
- `src/lib/constants.ts` - Remove weapons, artifacts from TABS

**Files to move/integrate:**
- `src/features/weapons/pages/WeaponsPage.tsx` → `src/features/roster/pages/WeaponsTab.tsx`
- `src/features/artifacts/pages/ArtifactsPage.tsx` → `src/features/roster/pages/ArtifactsTab.tsx`

#### 1.2 Update imports
- Weapons and Artifacts features remain as modules (hooks, repos, domain)
- Only pages get consolidated into Roster

#### 1.3 Remove standalone tabs
- Remove `/weapons` route
- Remove `/artifacts` route
- Update TabNav icons mapping

### Estimated Effort: Small (routing + UI changes only)

---

## Phase 2: Wishes Consolidation

**Goal**: Merge Calculator, Ledger/Primogems into Wishes

### Current State
- `/wishes` - Wish history, pity tracking, import
- `/calculator` - Pull probability calculator, multi-target scenarios
- `/ledger` - Primogem/fate tracking, income projections

### Target State
- `/wishes` - Unified pull planning hub with sub-sections
```
/wishes
├── /wishes/history (default) - Wish records, pity display
├── /wishes/calculator - Pull simulations
└── /wishes/budget - Primogem income, projections
```

### Tasks

#### 2.1 Create Wishes sub-navigation
**Files to modify:**
- `src/app/routes.tsx` - Add nested routes under /wishes
- `src/features/wishes/pages/WishesPage.tsx` - Add section navigation
- `src/lib/constants.ts` - Remove calculator, ledger from TABS

**Files to move/integrate:**
- `src/features/calculator/pages/CalculatorPage.tsx` → `src/features/wishes/pages/CalculatorTab.tsx`
- `src/features/ledger/pages/LedgerPage.tsx` → `src/features/wishes/pages/BudgetTab.tsx`

#### 2.2 Shared context
- Calculator already imports from wishes (useCurrentPity)
- Ledger already imports from wishes (wishRepo)
- Natural consolidation - these features share data

#### 2.3 UI Integration
- Consider shared header showing current pity state
- Link "budget" projections to calculator scenarios

### Estimated Effort: Medium (some UI redesign for cohesive experience)

---

## Phase 3: Teams Hub (Major Feature)

**Goal**: Create unified Teams hub combining team management, build planning, material tracking, and boss completion

### Current State
- Teams: Component only (no page), used in roster
- Planner: Multi-character material calculator
- Builds: Build template browser
- Bosses: Weekly boss completion tracker

### Target State
- `/teams` - Team-centric planning hub
```
/teams
├── Team List (sidebar or cards)
├── /teams/:id - Team Detail View
│   ├── Composition (4 characters with current vs target state)
│   ├── Materials (aggregated requirements)
│   ├── Weekly Bosses (relevant to team, with completion tracking)
│   └── Actions (wfpsim export, share)
└── /teams/templates - Build template browser (moved from /builds)
```

### Tasks

#### 3.1 Create Teams page structure
**New files:**
- `src/features/teams/pages/TeamsPage.tsx` - Main hub
- `src/features/teams/pages/TeamDetailPage.tsx` - Single team view
- `src/features/teams/components/TeamMaterialsList.tsx` - Aggregated materials
- `src/features/teams/components/TeamBossTracker.tsx` - Boss completion for team

#### 3.2 Integrate Planner logic
**Move/refactor:**
- Planner's material calculation logic → shared domain
- Character goal tracking → team-level goals
- Resin budgeting → team context

**Key files to refactor:**
- `src/features/planner/domain/ascensionCalculator.ts` - Keep as shared utility
- `src/features/planner/domain/multiCharacterCalculator.ts` - Adapt for team context
- `src/features/planner/hooks/useMaterials.ts` - Extend for team aggregation

#### 3.3 Integrate Builds
**Move:**
- `src/features/builds/pages/BuildTemplatesPage.tsx` → `/teams/templates` route
- Build templates become selectable per team member

**New functionality:**
- Apply template to character in team
- Show "current build" vs "target build" gap

#### 3.4 Integrate Bosses
**Enhance:**
- Filter weekly bosses by team's material needs
- Preserve completion tracking (localStorage)
- Show "3 discounted" budget optimization

**New component:**
- `TeamBossTracker` - Shows only relevant bosses for team

#### 3.5 Connect wfpsim export
- Already exists on TeamCard
- Move to prominent position in team detail view

#### 3.6 Remove standalone tabs
- Remove `/planner` route
- Remove `/builds` route
- Remove `/bosses` route

### Estimated Effort: Large (significant new UI, logic integration)

---

## Phase 4: Notes Integration

**Goal**: Integrate Notes/Goals into relevant contexts rather than standalone tab

### Current State
- `/notes` - Standalone notes and goals page
- Goals can link to characters/teams but managed separately

### Target State
- Remove `/notes` as standalone tab
- Goals appear contextually:
  - Team goals on Team detail page
  - Character goals on Character detail page
  - General notes on Dashboard

### Tasks

#### 4.1 Move goal display to contexts
**Modify:**
- `src/features/roster/pages/CharacterDetailPage.tsx` - Add goals section
- `src/features/teams/pages/TeamDetailPage.tsx` - Add team goals
- `src/features/dashboard/pages/DashboardPage.tsx` - Add pinned notes widget

#### 4.2 Goal creation in context
- "Add goal" button on character/team pages
- Quick-add from Dashboard

#### 4.3 Keep notes hooks/repo
- `useNotes`, `useGoals` remain as shared hooks
- Repository unchanged

### Estimated Effort: Medium (UI redistribution)

---

## Phase 5: Navigation & Routing Cleanup

### Tasks

#### 5.1 Update TABS constant
```typescript
export const TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'roster', label: 'Roster', path: '/roster' },
  { id: 'teams', label: 'Teams', path: '/teams' },
  { id: 'wishes', label: 'Wishes', path: '/wishes' },
  { id: 'calendar', label: 'Calendar', path: '/calendar' },
  { id: 'settings', label: 'Settings', path: '/settings' },
] as const;
```

#### 5.2 Update TabNav icons
```typescript
const icons = {
  dashboard: LayoutDashboard,
  roster: Users,
  teams: UsersRound, // or Swords
  wishes: Sparkles,
  calendar: Calendar,
  settings: Settings,
};
```

#### 5.3 Update routes.tsx
- Consolidate all routes per new structure
- Add nested route handling

#### 5.4 Redirect old routes
- `/artifacts` → `/roster/artifacts`
- `/weapons` → `/roster/weapons`
- `/calculator` → `/wishes/calculator`
- `/ledger` → `/wishes/budget`
- `/planner` → `/teams`
- `/builds` → `/teams/templates`
- `/bosses` → `/teams` (with boss section visible)
- `/notes` → `/` (dashboard)

### Estimated Effort: Small (configuration changes)

---

## Implementation Order

### Sprint A: Foundation (Phases 1, 5) ✅ COMPLETE
1. ✅ Set up new routing structure
2. ✅ Roster consolidation (add weapons/artifacts as sub-tabs)
3. ✅ Update navigation
4. ✅ Add redirects for old routes

**Deliverable**: 13 tabs → 11 tabs (cleaner Roster)

### Sprint B: Wishes Hub (Phase 2) ✅ COMPLETE
1. ✅ Create Wishes sub-navigation
2. ✅ Move Calculator page
3. ✅ Move Ledger/Budget page
4. ✅ Integrate shared pity context

**Deliverable**: 11 tabs → 9 tabs (unified Wishes)

### Sprint C: Teams Hub (Phase 3) ✅ COMPLETE
1. ✅ Create Teams page structure
2. ✅ Integrate Planner material calculations
3. ✅ Integrate Build templates
4. ✅ Integrate Boss tracker with team context
5. ✅ Connect wfpsim export

**Deliverable**: 9 tabs → 7 tabs (team-centric workflow)

### Sprint D: Polish (Phase 4) ✅ COMPLETE
1. ✅ Redistribute Notes/Goals (QuickNotesWidget, GoalsSection)
2. ✅ Dashboard improvements (notes widget, updated links)
3. ✅ Character/Team detail page goals integration

**Deliverable**: 7 tabs → 6 tabs (Final experience)

---

## Sprint 13: Build Template Integration ✅ COMPLETE

### High Priority ✅
- [x] Build template application to team members (show current vs target build gap)
- [x] Filter weekly bosses by team's material needs in TeamDetailPage
- [x] Shared header in Wishes showing current pity state across all sub-tabs

### Medium Priority ✅
- [x] "Apply template" action on team member cards
- [x] Goal creation in-context (quick-add from character/team pages via GoalsSection modal)
- [ ] Link budget projections to calculator scenarios

### Low Priority ✅
- [x] Add `buildTemplateId` to team members schema for applied builds

### Sprint 13 Deliverables

**New Components:**
- `PityHeader` - Shared pity state display across all Wishes sub-tabs
- `BuildGapDisplay` - Shows current vs target build comparison
- `ApplyTemplateModal` - Browse and apply build templates to team members
- `TeamMemberCard` - Enhanced team member display with template support

**Updated Components:**
- `WishesLayout` - Now includes PityHeader
- `WeeklyBossTracker` - Filter by team's required materials
- `TeamDetailPage` - Uses TeamMemberCard, passes required materials to boss tracker

**Schema Updates:**
- `Team.memberBuildTemplates` - Optional field to store applied template IDs per character

---

## Sprint 14: Build Templates UX Enhancement (In Progress)

### Completed ✅
- [x] Character search in TeamForm - Quick filter when building teams
- [x] Equipment data file - Static weapon/artifact data for form dropdowns (100+ weapons, 40+ sets)
- [x] BuildTemplateForm overhaul - Searchable weapon selector, artifact set selector, main stat buttons, substat priority

### Remaining
- [ ] Extract duplicate filter/sort logic to shared utilities
- [ ] Import from gcsim config to build templates
- [ ] Link budget projections to calculator scenarios
- [ ] Team sharing/export functionality
- [ ] Consolidated "Today's farming" widget on Dashboard

### Sprint 14 Deliverables

**New Files:**
- `src/lib/data/equipmentData.ts` - Weapon and artifact set data with types and bonuses

**Updated Components:**
- `TeamForm` - Added character search input
- `BuildTemplateForm` - Complete overhaul with structured dropdowns instead of text inputs
- `BuildTemplatesPage` - Passes roster characters to form

---

## Database Considerations

### No schema changes required
- All existing tables remain valid
- Relationships unchanged
- Features access same data, just presented differently

### Potential future enhancements
- Add `teamId` to goals for better team-goal linking
- Add `buildTemplateId` to team members for applied builds

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Keep feature modules intact, only consolidate pages |
| Test failures | Run full test suite after each phase |
| User confusion from UI changes | Add redirects from old routes |
| Large merge conflicts | Complete one phase at a time, commit frequently |

---

## Success Metrics

- [x] 6 functional tabs (down from 13) ✅
- [x] All 1,192 tests passing ✅
- [x] Team-centric workflow functional end-to-end ✅
- [x] Old routes redirect properly ✅
- [x] No regression in existing features ✅

**Completed**: January 2026

---

## Files Summary

### To Create
- `src/features/teams/pages/TeamsPage.tsx`
- `src/features/teams/pages/TeamDetailPage.tsx`
- `src/features/teams/components/TeamMaterialsList.tsx`
- `src/features/teams/components/TeamBossTracker.tsx`
- `src/features/roster/pages/WeaponsTab.tsx`
- `src/features/roster/pages/ArtifactsTab.tsx`
- `src/features/wishes/pages/CalculatorTab.tsx`
- `src/features/wishes/pages/BudgetTab.tsx`

### To Modify
- `src/app/routes.tsx`
- `src/lib/constants.ts`
- `src/components/common/TabNav.tsx`
- `src/features/roster/pages/RosterPage.tsx`
- `src/features/wishes/pages/WishesPage.tsx`
- `src/features/dashboard/pages/DashboardPage.tsx`

### To Deprecate (keep module, remove page route)
- `src/features/weapons/pages/WeaponsPage.tsx` (content moves to WeaponsTab)
- `src/features/artifacts/pages/ArtifactsPage.tsx` (content moves to ArtifactsTab)
- `src/features/calculator/pages/CalculatorPage.tsx` (content moves to CalculatorTab)
- `src/features/ledger/pages/LedgerPage.tsx` (content moves to BudgetTab)
- `src/features/planner/pages/PlannerPage.tsx` (logic integrates into Teams)
- `src/features/builds/pages/BuildTemplatesPage.tsx` (moves to /teams/templates)
- `src/features/bosses/pages/WeeklyBossTrackerPage.tsx` (integrates into Teams)
- `src/features/notes/pages/NotesPage.tsx` (distributes to contexts)
