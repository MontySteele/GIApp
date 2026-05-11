# Sprint 15: E2E Testing Foundation & Key Enhancements

**Duration:** January 2026
**Theme:** Testing infrastructure + user experience improvements

---

## Overview

Sprint 15 establishes the E2E testing foundation while delivering high-value user experience enhancements. This is a hybrid sprint balancing quality assurance improvements with feature delivery.

---

## Sprint Goals

### E2E Testing (40% effort)
1. **Playwright Infrastructure** - Set up E2E testing framework
2. **Page Object Models** - Create reusable test abstractions
3. **Tier 1 Critical Tests** - Cover 8 critical user workflows
4. **CI Integration** - Add E2E tests to the pipeline

### Unit Test Coverage (15% effort)
1. **Bosses Feature Tests** - Currently 0% coverage
2. **Calendar Page Tests** - Currently minimal coverage

### Features (35% effort)
1. **Link Budget to Calculator** - Connect primogem projections to pull scenarios
2. **Today's Farming Dashboard Widget** - Quick access to daily priorities

### UX Improvements (10% effort)
1. **Mobile Bottom Navigation** - Tab bar for screens < 768px

---

## E2E Testing Plan

### Phase 1: Infrastructure (Sprint 15)

#### Playwright Setup
```bash
# Installation
npm install -D @playwright/test
npx playwright install

# Configuration
playwright.config.ts  # Browser configs, base URL, timeouts
```

#### Project Structure
```
e2e/
├── fixtures/
│   ├── test-data.ts          # Seeding functions
│   └── auth.ts               # If needed in future
├── pages/
│   ├── BasePage.ts           # Common page methods
│   ├── DashboardPage.ts      # Dashboard interactions
│   ├── RosterPage.ts         # Character CRUD
│   ├── TeamsPage.ts          # Team management
│   ├── WishesPage.ts         # Wish history/calculator
│   └── components/
│       ├── Modal.ts          # Modal interactions
│       ├── Toast.ts          # Toast assertions
│       └── Toolbar.ts        # Search/filter/sort
├── tests/
│   ├── character-crud.spec.ts
│   ├── character-import.spec.ts
│   ├── team-management.spec.ts
│   ├── wish-tracking.spec.ts
│   ├── navigation.spec.ts
│   └── data-export.spec.ts
└── utils/
    ├── database.ts           # IndexedDB helpers
    └── assertions.ts         # Custom matchers
```

### Tier 1: Critical User Flows (Sprint 15)

| Test | Priority | Complexity |
|------|----------|------------|
| 1. Character CRUD (manual entry) | P0 | Low |
| 2. Enka.network import (UID) | P0 | Medium |
| 3. GOOD format import | P0 | Medium |
| 4. Team creation with search | P0 | Medium |
| 5. Single-character planner | P0 | Medium |
| 6. Wish history display | P0 | Low |
| 7. GOOD format export | P0 | Low |
| 8. Deep navigation flow | P0 | Medium |

### Phase 2: Expanded Coverage (Sprint 16)

#### Tier 2: High Priority Flows
| Test | Priority | Complexity |
|------|----------|------------|
| 1. Irminsul import (full inventory) | P1 | High |
| 2. Multi-character planning | P1 | High |
| 3. gcsim import for templates | P1 | Medium |
| 4. wfpsim export | P1 | Medium |
| 5. Pull calculators (single/multi) | P1 | Medium |
| 6. Reverse calculator | P1 | Medium |
| 7. Modal multi-view navigation | P1 | Medium |
| 8. Large roster performance | P1 | Medium |

#### Tier 3: Medium Priority Flows
| Test | Priority | Complexity |
|------|----------|------------|
| 1. Build template CRUD | P2 | Medium |
| 2. Domain farming recommendations | P2 | Low |
| 3. Search and filter combinations | P2 | Medium |
| 4. Form validation patterns | P2 | Medium |
| 5. Weekly boss tracking | P2 | Low |
| 6. Budget tracking | P2 | Medium |
| 7. Calendar events display | P2 | Low |

---

## Feature Specifications

### 1. Link Budget to Calculator

**Goal:** Connect primogem income projections to pull probability scenarios

**User Story:**
> As a player, I want my projected primogem income to automatically populate in the pull calculator so I can see my chances for upcoming banners.

**Implementation:**
```
Location: src/features/calculator/
Changes:
├── components/
│   ├── BudgetLinkBanner.tsx     # Shows linked budget info
│   └── SingleTargetForm.tsx     # Add "Use Budget" button
├── hooks/
│   └── useBudgetLink.ts         # Fetch projected income
└── domain/
    └── budgetProjection.ts      # Calculate available primos
```

**UI Flow:**
1. User opens Calculator page
2. Banner shows: "You have ~12,450 primogems projected by Feb 15"
3. "Use Budget" button auto-fills primogem input
4. Optionally show breakdown (current + projected income)

**Data Flow:**
```
ledgerRepo.getLatestSnapshot()
  → historicalReconstruction.calculateProjection()
  → calculatorStore.setBudget()
```

**Acceptance Criteria:**
- [ ] Calculator shows current + projected primogems
- [ ] "Use Budget" button populates calculator input
- [ ] Projection uses configured rate window (14/30/60/90 days)
- [ ] Works in both single and multi-target calculators
- [ ] Unit tests for budget projection logic
- [ ] Integration test for data flow

---

### 2. Today's Farming Dashboard Widget

**Goal:** Quick-access widget showing daily farming priorities on Dashboard

**User Story:**
> As a player, I want to see my optimal farming activities at a glance when I open the app.

**Implementation:**
```
Location: src/features/dashboard/
Changes:
├── components/
│   └── TodaysFarmingWidget.tsx  # Main widget component
├── hooks/
│   └── useTodaysFarming.ts      # Aggregate farming data
└── domain/
    └── farmingPriorities.ts     # Calculate recommendations
```

**Widget Content:**
1. **Talent Domains** - Which domains to farm today based on team needs
2. **Weekly Bosses** - Uncompleted bosses for selected teams
3. **Material Deficits** - Top 3 blocking materials
4. **Resin Estimate** - Total resin needed for priorities

**UI Design:**
```
┌─────────────────────────────────────┐
│ 🌾 Today's Farming                  │
├─────────────────────────────────────┤
│ Talent Domains (Tuesday)            │
│ • Freedom (Mondstadt) - Kazuha      │
│ • Elegance (Inazuma) - Furina       │
│                                     │
│ Weekly Bosses (2/3 remaining)       │
│ • Signora - Neuvillette             │
│ • Apep - Nahida                     │
│                                     │
│ ⚡ ~180 Resin needed                │
└─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Shows talent domains available today
- [ ] Filters by characters in active teams
- [ ] Shows incomplete weekly bosses
- [ ] Calculates resin requirements
- [ ] Links to Planner page for details
- [ ] Unit tests for priority calculation
- [ ] Responsive on mobile

---

### 3. Mobile Bottom Navigation

**Goal:** Tab bar at bottom of screen for mobile devices (< 768px)

**User Story:**
> As a mobile user, I want navigation tabs at the bottom of the screen for easier thumb access.

**Implementation:**
```
Location: src/components/common/
Changes:
├── MobileBottomNav.tsx    # New component
├── Layout.tsx             # Conditionally render
└── TabNav.tsx             # Hide on mobile
```

**Design:**
```
Mobile (< 768px):
┌─────────────────────────────────────┐
│ [Page Content]                      │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 🏠  👤  ⚔️  🎰  📅  ⚙️            │
│ Home Roster Teams Wishes Cal  Set   │
└─────────────────────────────────────┘

Desktop (≥ 768px):
┌─────────────────────────────────────┐
│ [Header with TabNav - unchanged]    │
├─────────────────────────────────────┤
│ [Page Content]                      │
└─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Bottom nav appears only on screens < 768px
- [ ] Top TabNav hidden on mobile
- [ ] Active tab highlighted
- [ ] Safe area padding for notched devices
- [ ] Smooth transition between breakpoints
- [ ] Keyboard accessible

---

## Unit Test Coverage Tasks

### Bosses Feature Tests

**Current State:** 0 tests
**Target:** 15+ tests

**Files to Test:**
```
src/features/bosses/
├── domain/
│   └── bossCalculations.ts    # Boss cost, filtering logic
├── repo/
│   └── bossRepo.ts            # CRUD operations
├── hooks/
│   └── useBosses.ts           # Hook logic
└── components/
    ├── BossCard.tsx           # Render tests
    └── BossTracker.tsx        # Interaction tests
```

**Test Cases:**
- [ ] Boss completion toggle
- [ ] Weekly reset logic
- [ ] Team filtering (show bosses needed by team)
- [ ] Resin cost calculations
- [ ] CRUD operations

### Calendar Page Tests

**Current State:** 1 test
**Target:** 10+ tests

**Files to Test:**
```
src/features/calendar/
├── domain/
│   └── resetCalculations.ts   # Timer logic
├── hooks/
│   └── useCalendarEvents.ts   # Event fetching
└── components/
    ├── ResetTimer.tsx         # Timer display
    └── EventCard.tsx          # Event rendering
```

**Test Cases:**
- [ ] Reset timer countdown
- [ ] Daily/weekly reset display
- [ ] Event fetching and caching
- [ ] Event type badges
- [ ] Domain schedule for current day

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| E2E Tests | 0 | 8+ |
| Bosses Tests | 0 | 15+ |
| Calendar Tests | 1 | 10+ |
| Total Tests | 1,263 | ~1,300+ |
| E2E Coverage | 0% | Tier 1 complete |

---

## Sprint 16 Preview

**E2E Expansion:**
- Tier 2 high-priority flows (8 tests)
- Tier 3 medium-priority flows (7 tests)
- Visual regression testing setup

**Features:**
- Team sharing/export (JSON export, shareable links)
- React Error Boundaries

**Technical Debt:**
- Remaining unit test gaps
- Performance profiling

---

## Implementation Order

### Week 1
1. ✅ Sprint 15 plan documentation
2. Playwright setup and configuration
3. Page object model foundation
4. First 4 E2E tests (CRUD, imports)

### Week 2
5. Remaining 4 E2E tests (team, planner, wishes, navigation)
6. CI integration for E2E
7. Bosses feature unit tests
8. Calendar page unit tests

### Week 3
9. Link budget to calculator feature
10. Today's farming dashboard widget
11. Mobile bottom navigation
12. Documentation updates

---

## Files Changed

### New Files
```
e2e/                              # E2E test directory
├── playwright.config.ts
├── fixtures/
├── pages/
├── tests/
└── utils/

src/features/dashboard/components/TodaysFarmingWidget.tsx
src/features/dashboard/hooks/useTodaysFarming.ts
src/features/calculator/components/BudgetLinkBanner.tsx
src/features/calculator/hooks/useBudgetLink.ts
src/components/common/MobileBottomNav.tsx
```

### Modified Files
```
package.json                      # Add Playwright
src/components/common/Layout.tsx  # Mobile nav integration
src/components/common/TabNav.tsx  # Hide on mobile
src/features/calculator/pages/CalculatorPage.tsx
src/features/calculator/components/SingleTargetForm.tsx
src/features/dashboard/pages/DashboardPage.tsx
```

### New Test Files
```
e2e/tests/*.spec.ts              # 8 E2E test files
src/features/bosses/**/*.test.ts # Bosses unit tests
src/features/calendar/**/*.test.ts # Calendar unit tests
```
