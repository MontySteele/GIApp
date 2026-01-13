# Test Coverage Plan - Genshin Impact Progress Tracker

## Current State (January 2026 - Sprint 16)

### Test Infrastructure
- **Framework:** Vitest 4.0.16
- **UI Testing:** @testing-library/react
- **E2E Testing:** Playwright (added Sprint 15)
- **Coverage:** v8 provider with 80% threshold target
- **Environment:** jsdom with fake-indexeddb

### Current Metrics
- **Total Tests:** ~1,400+
- **Passing:** ~99%+
- **Test Files:** 60+

### Coverage by Feature

| Feature | Status | Tests | Notes |
|---------|--------|-------|-------|
| Wishes | Excellent | ~200+ | Domain, hooks, components, pages |
| Calculator | Good | ~120+ | Single/multi-target, reverse calculator |
| Roster | Excellent | ~150+ | Characters, teams, mappers |
| Ledger | Good | ~30+ | Repos and components |
| Sync | Good | ~20+ | Compression/encryption tested |
| Artifacts | Good | ~50+ | Scoring, filtering, CRUD |
| Calendar | Excellent | 111 | ResetTimers, EventList, useEvents, eventTypes |
| Notes | Good | ~40+ | CRUD, goals, tags |
| Planner | Good | ~80+ | Multi-character, material calculations |
| Weapons | Good | ~30+ | Inventory and filtering |
| Bosses | Excellent | 81 | WeeklyBossTracker, weeklyBossData |
| UI Components | Good | ~50+ | Button, Card, Modal, ErrorBoundary, Breadcrumbs, Skeleton |
| Dashboard | Good | ~40+ | Widgets, hooks |
| Builds | Partial | ~75+ | Templates, gcsim parser |

### Recent Test Additions (Sprint 16)
- Calendar feature: +65 tests
- Bosses feature: +66 tests
- ErrorBoundary: +17 tests
- Breadcrumbs: +10 tests

---

## Phase 1: Fix Failing Tests (Priority: Critical)

### 1.1 WishStatistics.test.tsx (3 failures)
- **Issue:** Test expects '8' but component renders '8.0'
- **Fix:** Update test assertions to match actual decimal rendering

### 1.2 MultiTargetCalculator.test.tsx (26 failures)
- **Issue:** Complex component with async worker interactions
- **Fix:** Review component changes, update mock implementations

### 1.3 ReverseCalculator.test.tsx (3 failures)
- **Issue:** Input validation and benchmark tests failing
- **Fix:** Update expected values to match current implementation

### 1.4 Mapper tests (teamSnapshot, enka) (3 failures)
- **Issue:** Snapshot creation and character ID mapping
- **Fix:** Update test data to match current mapper behavior

### 1.5 LedgerRepos.test.ts (3 failures)
- **Issue:** Timestamp/metadata default values
- **Fix:** Update expected default values

---

## Phase 2: Add Tests for Untested Features (Priority: High)

### 2.1 Planner Feature
Files needing tests:
- `features/planner/domain/ascensionCalculator.ts`
- `features/planner/domain/materialConstants.ts`
- `lib/services/genshinDbService.ts`
- `lib/utils/materialNormalization.ts`

Test categories:
- Material calculation accuracy
- API response parsing
- Cache behavior
- Error handling

### 2.2 Calendar Feature
Files needing tests:
- `features/calendar/domain/resetTimers.ts`
- `features/calendar/hooks/useEvents.ts`

Test categories:
- Timer calculations
- Server time conversions
- Event filtering

### 2.3 Artifacts Feature
Files needing tests:
- `features/artifacts/repo/artifactRepo.ts`

Test categories:
- CRUD operations
- Artifact filtering/sorting

### 2.4 Weapons Feature
Files needing tests:
- `features/weapons/repo/weaponRepo.ts`

Test categories:
- CRUD operations
- Weapon inventory management

### 2.5 Notes Feature
Files needing tests:
- `features/notes/repo/notesRepo.ts`
- `features/notes/hooks/useNotes.ts`

Test categories:
- Note CRUD operations
- Tag filtering
- Search functionality

---

## Phase 3: Add UI Component Tests (Priority: Medium)

### 3.1 Core UI Components
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Input.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Select.tsx`
- `components/ui/Badge.tsx`

Test categories:
- Render with different props
- User interactions
- Accessibility attributes

### 3.2 Common Components
- `components/common/Header.tsx`
- `components/common/TabNav.tsx`

---

## Phase 4: Service Layer Tests (Priority: High)

### 4.1 genshinDbService.ts
Test categories:
- API fetch success/failure
- Response parsing
- Cache hit/miss
- Stale data fallback
- Error handling

### 4.2 resourceService.ts
Test categories:
- Available pulls calculation
- Resource aggregation

### 4.3 materialNormalization.ts
Test categories:
- Key normalization
- Inventory matching
- Tier identification

---

## Implementation Checklist

### Sprint 11: Core Test Expansion ✅
- [x] Fix WishStatistics decimal rendering tests
- [x] Fix MultiTargetCalculator component tests
- [x] Fix ReverseCalculator input tests
- [x] Fix mapper tests (teamSnapshot, enka)
- [x] Fix ledgerRepos timestamp tests

### Sprint 11-14: Feature Tests ✅
- [x] ascensionCalculator.test.ts
- [x] materialConstants.test.ts
- [x] genshinDbService.test.ts
- [x] materialNormalization.test.ts
- [x] Calendar feature tests (partial)
- [x] Artifacts feature tests
- [x] Weapons feature tests
- [x] Notes feature tests

### Sprint 15: E2E & Infrastructure ✅
- [x] Playwright E2E framework setup
- [x] MobileBottomNav component tests
- [x] Page object model pattern

### Sprint 16: UX & Coverage ✅
- [x] Calendar feature tests (expanded to 111)
- [x] Bosses feature tests (expanded to 81)
- [x] ErrorBoundary component tests (17)
- [x] Breadcrumbs component tests (10)
- [x] Button component tests
- [x] Card component tests
- [x] Input/Select component tests
- [x] Modal component tests
- [x] Skeleton component tests

### Remaining Work (Future Sprints)
- [ ] E2E Tier 2 tests (8 flows)
- [ ] E2E Tier 3 tests (7 flows)
- [ ] Visual regression testing
- [ ] Performance testing for large rosters

---

## Test File Naming Convention

```
src/
├── features/
│   └── [feature]/
│       ├── domain/
│       │   └── [module].test.ts      # Domain logic tests
│       ├── components/
│       │   └── [Component].test.tsx  # Component tests
│       ├── hooks/
│       │   └── [useHook].test.ts     # Hook tests
│       └── repo/
│           └── [repo].test.ts        # Repository tests
├── lib/
│   ├── services/
│   │   └── [service].test.ts         # Service tests
│   └── utils/
│       └── [util].test.ts            # Utility tests
└── components/
    └── ui/
        └── [Component].test.tsx      # UI component tests
```

---

## Coverage Goals

| Metric | Sprint 11 | Sprint 16 | Target | Status |
|--------|-----------|-----------|--------|--------|
| Statements | ~60% | ~75% | 80% | On Track |
| Branches | ~50% | ~68% | 75% | On Track |
| Functions | ~55% | ~72% | 80% | On Track |
| Lines | ~60% | ~75% | 80% | On Track |
| Total Tests | 545 | 1,400+ | - | Exceeded |

---

## TDD Process for New Features

1. **Write failing test first** - Define expected behavior
2. **Implement minimum code** - Make test pass
3. **Refactor** - Clean up while keeping tests green
4. **Add edge cases** - Cover boundary conditions
5. **Document** - Update this plan with new tests

---

## Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage report
npm run test:coverage

# Run specific test file
npx vitest run src/features/planner/domain/ascensionCalculator.test.ts

# Run tests matching pattern
npx vitest run --grep "material"
```
