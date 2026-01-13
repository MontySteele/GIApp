# Sprint 18: Navigation Reorganization & UX Improvements

**Duration:** January 2026
**Theme:** Restructure navigation for better workflows, add banner tracking, improve onboarding
**Status:** Planning

---

## Overview

Sprint 18 focuses on a comprehensive navigation reorganization to better align with user workflows, along with high-value feature additions (banner tracking, artifact scoring) and technical improvements (API resilience, error test coverage).

---

## Navigation Reorganization

### Current Structure (Problems Identified)

```
├── Dashboard
├── Roster (Characters, Weapons, Artifacts)
├── Teams (My Teams, Planner, Build Templates, Weekly Bosses)  ← Too much here
├── Wishes (History, Calculator, Budget)  ← Name implies history, not planning
├── Calendar  ← Underutilized, content scattered
└── Settings
```

**Key Issues:**
- Build Templates are character-centric but live under Teams
- Material Planner serves both characters AND teams but is nested under Teams
- "Wishes" implies historical tracking, but Calculator/Budget are planning tools
- Calendar content overlaps with Planner (domains) and Pulls (banners)
- No banner history/rerun tracking feature

### New Structure

```
├── Dashboard (/)
│   └── Quick stats, event countdown widget, today's farming summary
│
├── Roster (/roster) - "My Collection"
│   ├── Characters (default)
│   ├── Weapons
│   ├── Artifacts
│   └── Builds (MOVED from Teams - character build guides)
│
├── Teams (/teams) - "Team Building"
│   ├── My Teams (default)
│   └── Weekly Bosses
│
├── Pulls (/pulls) - RENAMED from "Wishes"
│   ├── History (wish records)
│   ├── Calculator (probability simulation)
│   ├── Budget (income tracking)
│   └── Banners (NEW - banner history & rerun tracker)
│
├── Planner (/planner) - PROMOTED to top-level
│   ├── Overview (today's farming recommendations)
│   ├── Materials (deficit tracking, totals)
│   └── Domains (weekly schedule)
│
│   [Context Selector UI]
│   "Planning for:" dropdown with options:
│   • Single character
│   • A specific team (aggregated view)
│   • All main priority characters
│   • Custom multi-select
│
└── Settings (/settings)
```

### Route Changes

| Old Route | New Route | Action |
|-----------|-----------|--------|
| `/wishes` | `/pulls` | Rename |
| `/wishes/calculator` | `/pulls/calculator` | Rename |
| `/wishes/budget` | `/pulls/budget` | Rename |
| `/teams/templates` | `/roster/builds` | Move |
| `/teams/planner` | `/planner` | Promote |
| `/calendar` | (removed) | Merge into Dashboard/Planner |
| — | `/pulls/banners` | New |

### Redirects to Add

```typescript
// Backwards compatibility
{ path: 'wishes', element: <Navigate to="/pulls" replace /> },
{ path: 'wishes/*', element: <Navigate to="/pulls/*" replace /> },
{ path: 'teams/templates', element: <Navigate to="/roster/builds" replace /> },
{ path: 'teams/planner', element: <Navigate to="/planner" replace /> },
{ path: 'calendar', element: <Navigate to="/planner/domains" replace /> },
```

### Mobile Navigation Update

```
Current: Dashboard | Roster | Teams | Wishes | Settings
New:     Dashboard | Roster | Teams | Pulls  | Planner
                                              (Settings via menu)
```

---

## Sprint Goals

### P0: Navigation Reorganization

#### 1. Rename Wishes → Pulls
- [ ] Update route paths in `routes.tsx`
- [ ] Rename `WishesLayout` → `PullsLayout`
- [ ] Rename `WishesSubNav` → `PullsSubNav`
- [ ] Update TABS constant in `constants.ts`
- [ ] Update TabNav and MobileBottomNav
- [ ] Add redirect from `/wishes/*` to `/pulls/*`
- [ ] Update all internal links

#### 2. Move Build Templates to Roster
- [ ] Move `/teams/templates` route to `/roster/builds`
- [ ] Update RosterSubNav to include "Builds" tab
- [ ] Update TeamsSubNav to remove "Build Templates"
- [ ] Move `TemplatesTab` component to roster feature
- [ ] Add redirect from old route
- [ ] Update any cross-links (character detail → builds)

#### 3. Promote Planner to Top-Level
- [ ] Create new `/planner` route structure
- [ ] Create `PlannerLayout` with sub-navigation
- [ ] Create `PlannerSubNav` component
- [ ] Add to TABS constant
- [ ] Update TabNav and MobileBottomNav
- [ ] Add redirect from `/teams/planner`

#### 4. Add Planner Context Selector
- [ ] Create `PlannerContextSelector` component
- [ ] Support modes: single character, team, all main, custom
- [ ] Persist last-used context in localStorage
- [ ] Add deep-link support (`/planner?team=abc123`)
- [ ] Character detail "Plan Materials" links to planner with character pre-selected
- [ ] Team detail "Plan Materials" links to planner with team pre-selected

#### 5. Team-Level Planner Aggregation
- [ ] Calculate shared materials across team members
- [ ] Show boss optimization ("Signora benefits 2/4 characters")
- [ ] Show domain efficiency ("Emblem domain covers 2 characters")
- [ ] Display aggregate totals (Mora, EXP, boss mats)
- [ ] Priority suggestions based on shared resources

#### 6. Merge Calendar Content
- [ ] Move event countdown to Dashboard widget
- [ ] Move domain schedule to Planner > Domains
- [ ] Move banner countdown to Pulls > Banners
- [ ] Remove Calendar from top-level navigation
- [ ] Add redirect from `/calendar`

#### 7. Update Mobile Navigation
- [ ] Replace Wishes with Pulls
- [ ] Add Planner to mobile nav
- [ ] Move Settings to overflow menu or keep as 5th item

---

### P1: New Features

#### 8. Banner History Tracker (NEW)
Create a new Banners tab under Pulls that shows:

**Data Model:**
```typescript
interface BannerRecord {
  id: string;
  bannerType: 'character' | 'weapon';
  version: string;           // "5.3", "5.4"
  phase: 1 | 2;              // First or second half
  startDate: string;         // ISO date
  endDate: string;
  featuredCharacters: string[];  // Character keys
  featuredWeapons: string[];     // Weapon keys
}
```

**Features:**
- [ ] Display banner history timeline
- [ ] Show character rerun history ("Hu Tao: last seen 5.1, 8 versions ago")
- [ ] Filter by character/weapon
- [ ] Predict potential reruns based on patterns
- [ ] Link to pull calculator with character pre-selected

**Data Source:**
- Hardcode historical data (can be updated with game patches)
- Store in `src/lib/bannerHistory.ts`

#### 9. Artifact Roll Quality Scoring
Add artifact evaluation to the Artifacts tab:

**Scoring System:**
```typescript
interface ArtifactScore {
  totalRolls: number;        // Total substat upgrades
  maxRolls: number;          // Maximum possible (5 for 5★)
  rollQuality: number;       // Average roll value (0-1)
  cvScore: number;           // Crit Value (CR×2 + CD)
  efficiencyScore: number;   // % of max possible stats
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}
```

**UI Elements:**
- [ ] Score badge on artifact cards
- [ ] Detailed breakdown in artifact detail view
- [ ] Sort artifacts by score
- [ ] Filter by grade threshold
- [ ] Tooltip explaining scoring methodology

#### 10. Onboarding Wizard
Create a guided first-run experience:

**Flow:**
1. Welcome screen with app overview
2. Import method selection (Enka, GOOD, Irminsul, Manual)
3. Import walkthrough with progress indicator
4. Quick tour of main features (optional)
5. Dashboard with "Getting Started" checklist

**Implementation:**
- [ ] Create `OnboardingWizard` component
- [ ] Track onboarding completion in localStorage
- [ ] Add "Getting Started" checklist to Dashboard for new users
- [ ] Allow re-triggering from Settings

#### 11. Feature Tooltips
Add contextual help for gacha mechanics:

**Tooltip Locations:**
- [ ] Pity counter: "Soft pity begins at 74 pulls, hard pity at 90"
- [ ] Guaranteed indicator: "After losing 50/50, next 5★ is guaranteed featured"
- [ ] Capturing Radiance: "55% base rate, guaranteed after 3 consecutive losses"
- [ ] Fate Points: "Weapon banner epitomized path mechanics"
- [ ] Probability percentages: "Based on X Monte Carlo simulations"

**Implementation:**
- [ ] Create reusable `InfoTooltip` component
- [ ] Add `?` icons next to key metrics
- [ ] Store tooltip content in constants file

---

### P2: Technical Improvements

#### 12. API Retry Logic
Add resilience for external API calls:

**Affected Services:**
- `genshinDbService.ts` - Genshin-DB API
- `enkaService.ts` - Enka.Network API

**Implementation:**
```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  }
): Promise<T>
```

- [ ] Implement exponential backoff (2s, 4s, 8s, max 16s)
- [ ] Max 4 retry attempts
- [ ] Show user-friendly error after all retries fail
- [ ] Add toast notification for retry attempts

#### 13. Error Path Test Coverage
Expand tests to cover failure scenarios:

**Test Cases:**
- [ ] Network timeout handling
- [ ] Invalid import data handling
- [ ] Database write failures
- [ ] Empty state edge cases
- [ ] Concurrent modification conflicts
- [ ] LocalStorage quota exceeded

**Target:** Increase branch coverage from 68% to 75%

---

## File Changes Summary

### New Files

```
src/features/planner/
├── pages/
│   ├── PlannerLayout.tsx
│   └── DomainsTab.tsx (moved from calendar)
├── components/
│   ├── PlannerSubNav.tsx
│   ├── PlannerContextSelector.tsx
│   └── TeamAggregationCard.tsx

src/features/pulls/
├── pages/
│   ├── PullsLayout.tsx (renamed from WishesLayout)
│   └── BannersTab.tsx (NEW)
├── components/
│   ├── PullsSubNav.tsx (renamed from WishesSubNav)
│   ├── BannerTimeline.tsx
│   └── RerunTracker.tsx

src/features/roster/pages/
└── BuildsTab.tsx (moved from teams)

src/features/artifacts/components/
├── ArtifactScoreCard.tsx
└── ArtifactScoreBadge.tsx

src/components/common/
├── OnboardingWizard.tsx
└── InfoTooltip.tsx

src/lib/
├── bannerHistory.ts
├── artifactScoring.ts
└── fetchWithRetry.ts
```

### Modified Files

```
src/app/routes.tsx                    # Route restructure
src/lib/constants.ts                  # TABS update
src/components/common/TabNav.tsx      # Navigation update
src/components/common/MobileBottomNav.tsx
src/features/roster/components/RosterSubNav.tsx  # Add Builds tab
src/features/teams/components/TeamsSubNav.tsx    # Remove Templates, Planner
src/features/planner/hooks/useMaterials.ts       # Add team aggregation
src/features/planner/components/*.tsx            # Context-aware updates
src/features/dashboard/pages/DashboardPage.tsx   # Add event widget
src/lib/services/genshinDbService.ts             # Add retry logic
src/lib/services/enkaService.ts                  # Add retry logic
```

### Deleted Files

```
src/features/calendar/                # Merged into Dashboard/Planner
src/features/wishes/                  # Renamed to pulls
```

---

## Implementation Order

### Phase 1: Navigation Foundation (Days 1-3)
1. Rename Wishes → Pulls (routes, components, links)
2. Add redirects for old routes
3. Update constants and navigation components

### Phase 2: Content Reorganization (Days 4-6)
4. Move Build Templates to Roster
5. Promote Planner to top-level
6. Merge Calendar content into Dashboard/Planner

### Phase 3: Planner Enhancements (Days 7-9)
7. Add Planner context selector
8. Implement team-level aggregation features
9. Add deep-linking support

### Phase 4: New Features (Days 10-14)
10. Build Banner History tracker
11. Implement Artifact Roll Quality scoring
12. Create Onboarding Wizard

### Phase 5: Polish & Technical (Days 15-17)
13. Add Feature Tooltips
14. Implement API retry logic
15. Add error path tests

### Phase 6: Testing & Documentation (Days 18-20)
16. Update E2E tests for new routes
17. Manual QA of all workflows
18. Update documentation

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Navigation tabs | 6 (unchanged count) |
| New routes | 4 (`/pulls`, `/pulls/banners`, `/planner`, `/roster/builds`) |
| Redirects | 6 (backwards compatibility) |
| New features | 4 (banners, artifact score, onboarding, tooltips) |
| API retry coverage | 100% of external calls |
| Branch coverage | 75% (up from 68%) |
| All existing tests | Passing |
| New E2E tests | 3+ for new routes |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing bookmarks | Add comprehensive redirects |
| User confusion from changes | Add changelog notice on first visit |
| Mobile nav overcrowding | Test thoroughly, consider overflow menu |
| Banner data maintenance | Structure for easy updates |
| Artifact scoring complexity | Start with CV-based scoring, iterate |

---

## Testing Checklist

### Navigation
- [ ] All old routes redirect correctly
- [ ] Mobile navigation works on small screens
- [ ] Breadcrumbs show correct hierarchy
- [ ] Deep links work (e.g., `/planner?team=abc`)

### Planner
- [ ] Single character mode shows correct materials
- [ ] Team mode shows aggregated materials
- [ ] Boss optimization displays correctly
- [ ] Context persists across sessions

### Banners
- [ ] Timeline displays historical banners
- [ ] Character rerun history is accurate
- [ ] Filtering works correctly
- [ ] Links to calculator work

### Artifacts
- [ ] Scores calculate correctly
- [ ] Grade thresholds are reasonable
- [ ] Sorting by score works
- [ ] Tooltips explain methodology

### Onboarding
- [ ] Wizard appears on first visit only
- [ ] All import paths work
- [ ] Can skip/dismiss wizard
- [ ] Can re-trigger from Settings

---

## Dependencies

No new npm dependencies required. All features use existing libraries:
- Recharts for timeline visualization
- Zustand for state management
- Existing UI components

---

## Future Considerations (Out of Scope)

- Push notifications (deferred per user request)
- Battle Chronicle API integration
- Multi-account support
- Team rotation simulator
- Comparative analytics
