# Test Coverage Plan - Genshin Progress Tracker

## Current State (May 2026)

### Test Infrastructure

- **Unit/integration framework:** Vitest 4.0.16
- **UI testing:** Testing Library React
- **E2E testing:** Playwright
- **Coverage provider:** v8
- **Browser-like environment:** jsdom plus fake-indexeddb

### Current Metrics

Last verified after the goal-first UX branch:

- **Test files:** 147 passing
- **Tests:** 2055 passing
- **E2E smoke suites verified:** `campaign-flow.spec.ts`, `navigation.spec.ts`, `team-management.spec.ts`

Use `npm run test:run` as the authoritative local unit/integration check.

## Coverage by Area

| Area | Status | Notes |
|---|---|---|
| Targets / Campaigns | Good | Target summaries, wizard math, campaign links, campaign pages, target material handoffs |
| Dashboard | Good | Next Up states, contextual target entry, loading states, freshness behavior, capture/snapshot panel, mobile viewport smoke |
| Imports / Sync | Good | Import Hub, backup/restore, app metadata, import impact summaries, freshness |
| Pulls / Wishes | Excellent | Wish import, history, pity selectors, replay, import impact, calculators |
| Calculator | Excellent | Single, multi-target, reverse calculator, worker integration |
| Roster | Excellent | Characters, forms, wishlist, progression, import components, selectors |
| Roster Planning | Good | Progression planning, domain schedule, teams, bosses, build templates |
| Materials | Good | Material calculations, farming schedule, target deficits, inventory updates |
| Ledger | Good | Resource calculations, quick logger, historical reconstruction, repos |
| Artifacts / Weapons | Good | Inventory hooks, repo behavior, scoring/filtering/page tests |
| Notes | Good | CRUD hooks, page behavior, quick notes |
| Calendar / Bosses | Good | Reset timers, event types, boss data and trackers |
| UI Components | Good | Button, Card, Modal, Badge, Skeleton, ErrorBoundary, common navigation |

## Recent Coverage Added

Goal-first UX work added or hardened tests for:

- Target aggregation and ordering
- Goal-first Start Target wizard paths
- Manual pull fast path and hard-pity preview math
- Current constellation and already-met constellation handling
- Dashboard checklist/self-healing import state
- Dashboard loading skeleton branch
- Dashboard Next Up priorities and stale/missing import promotion
- Dashboard contextual Start Target states and Capture + Snapshot panel
- Import Hub status and persisted impact summaries
- GOOD and Irminsul component-level import summary writes
- Quick Resource Logger presets and undo
- Quick Action Bar routes
- Mobile navigation active states
- Hash-link scrolling for quick actions
- Campaign-flow, navigation, and team-management Playwright smokes

## Standard Verification

Run these before committing feature work:

```bash
npm run lint
npm run test:run
npm run build
```

For UX/navigation work, also run the relevant Playwright smoke:

```bash
npx playwright test e2e/tests/campaign-flow.spec.ts --project=chromium
npx playwright test e2e/tests/navigation.spec.ts --project=chromium
npx playwright test e2e/tests/team-management.spec.ts --project=chromium
```

Run the full E2E suite when changing shared routing, persistence setup, page objects, or Playwright config:

```bash
npm run test:e2e -- --project=chromium
```

## Coverage Priorities

### Keep Strong

- Domain functions that compute user-facing advice, readiness, pity, odds, or import deltas.
- Import flows that write persistent state.
- Dashboard actions that route users to another workflow.
- Route compatibility and redirects.
- Manual-mode paths that are meant to work without imports.

### Watch For Gaps

- True before/after import deltas for campaign readiness if that feature is expanded beyond count summaries.
- Material readiness in the target wizard preview if it starts reading inventory.
- Full mobile visual smoke if more controls move into the More/quick-action surfaces.
- Larger roster/inventory performance tests.

## Test File Naming Convention

```text
src/
├── features/
│   └── [feature]/
│       ├── domain/
│       │   └── [module].test.ts
│       ├── components/
│       │   └── [Component].test.tsx
│       ├── hooks/
│       │   └── [useHook].test.ts
│       └── repo/
│           └── [repo].test.ts
├── lib/
│   ├── services/
│   │   └── [service].test.ts
│   └── utils/
│       └── [util].test.ts
└── components/
    └── ui/
        └── [Component].test.tsx
```

E2E specs live in `e2e/tests/*.spec.ts`.

## TDD Process for New Features

1. Write or update a failing test that captures the behavior.
2. Implement the smallest coherent change.
3. Add edge cases around boundary math, routing, missing data, and stale imports.
4. Refactor only with tests green.
5. Update docs when product vocabulary, routes, or test expectations change.

## Running Tests

```bash
# Run all unit/integration tests
npm run test:run

# Watch mode
npm run test

# Coverage report
npm run test:coverage

# Focused file
npx vitest run src/features/targets/domain/targetWizard.test.ts

# E2E focused file
npx playwright test e2e/tests/campaign-flow.spec.ts --project=chromium
```
