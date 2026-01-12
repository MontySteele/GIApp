# Test Coverage Plan - Genshin Impact Progress Tracker

## Current State (January 2026)

### Test Infrastructure
- **Framework:** Vitest 4.0.16
- **UI Testing:** @testing-library/react
- **Coverage:** v8 provider with 80% threshold target
- **Environment:** jsdom with fake-indexeddb

### Current Metrics
- **Total Tests:** 381
- **Passing:** 342 (89.7%)
- **Failing:** 39 (10.3%)
- **Test Files:** 30

### Coverage by Feature

| Feature | Status | Tests | Notes |
|---------|--------|-------|-------|
| Wishes | Good | ~110 | Domain logic well-covered, some UI failures |
| Calculator | Partial | ~93 | 26+ failures in MultiTargetCalculator |
| Roster | Good | ~28 | Mappers and repos covered |
| Ledger | Partial | ~5 | Some timestamp failures |
| Sync | Good | ~10 | Compression/encryption tested |
| Artifacts | None | 0 | Needs full coverage |
| Calendar | None | 0 | Needs full coverage |
| Notes | None | 0 | Needs full coverage |
| Planner | None | 0 | Needs full coverage (including genshinDbService) |
| Weapons | None | 0 | Needs full coverage |
| UI Components | None | 0 | Button, Card, Modal, etc. |

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

### Week 1: Fix Critical Failures
- [ ] Fix WishStatistics decimal rendering tests
- [ ] Fix MultiTargetCalculator component tests
- [ ] Fix ReverseCalculator input tests
- [ ] Fix mapper tests (teamSnapshot, enka)
- [ ] Fix ledgerRepos timestamp tests

### Week 2: Add Planner Tests
- [ ] ascensionCalculator.test.ts
- [ ] materialConstants.test.ts
- [ ] genshinDbService.test.ts
- [ ] materialNormalization.test.ts

### Week 3: Add Feature Tests
- [ ] Calendar feature tests
- [ ] Artifacts feature tests
- [ ] Weapons feature tests
- [ ] Notes feature tests

### Week 4: UI Component Tests
- [ ] Button component tests
- [ ] Card component tests
- [ ] Input/Select component tests
- [ ] Modal component tests

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

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Statements | ~60% | 80% | In Progress |
| Branches | ~50% | 75% | In Progress |
| Functions | ~55% | 80% | In Progress |
| Lines | ~60% | 80% | In Progress |

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
