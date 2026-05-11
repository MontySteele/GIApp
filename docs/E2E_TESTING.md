# E2E Testing Guide

This document covers Playwright E2E testing for GIApp.

## Quick Start

```bash
# Install Playwright browser binaries when needed
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run Chromium only
npm run test:e2e -- --project=chromium

# Run focused smoke suites
npx playwright test e2e/tests/campaign-flow.spec.ts --project=chromium
npx playwright test e2e/tests/navigation.spec.ts --project=chromium
```

The Playwright config starts `npm run dev` automatically at `http://localhost:5173` and reuses an existing dev server outside CI.

## Current Test Files

```text
e2e/
├── fixtures/
│   └── test-data.ts
├── pages/
│   ├── BasePage.ts
│   ├── DashboardPage.ts
│   ├── PullsPage.ts
│   ├── RosterPage.ts
│   └── TeamsPage.ts
└── tests/
    ├── campaign-flow.spec.ts          # Target creation, dashboard action handoffs
    ├── character-crud.spec.ts
    ├── character-import.spec.ts
    ├── data-export.spec.ts
    ├── modal-navigation.spec.ts
    ├── multi-character-planner.spec.ts
    ├── navigation.spec.ts             # Main nav, redirects, quick action hash links
    ├── planner.spec.ts
    ├── pull-calculators.spec.ts
    ├── team-management.spec.ts
    ├── wfpsim-export.spec.ts
    └── wish-tracking.spec.ts
```

## Important Smoke Suites

- `campaign-flow.spec.ts` covers the goal-first loop:
  - dashboard Start Target wizard creates a target without imports
  - pull targets hand off to the calculator
  - build targets hand off to target-aware material planning
  - stale imports become a dashboard next action
- `navigation.spec.ts` covers:
  - desktop navigation
  - legacy route redirects
  - quick action deep links such as `/#quick-resource-logger`
  - keyboard skip link behavior

## Configuration Reference

Current `playwright.config.ts` settings:

| Setting | Value | Purpose |
|---|---:|---|
| `fullyParallel` | `true` | Run files in parallel for faster feedback |
| `workers` | `4` locally, `2` in CI | Keep local runs fast while limiting CI load |
| `retries` | `0` locally, `1` in CI | Retry only in CI |
| `timeout` | `30000` | 30s test timeout |
| `expect.timeout` | `5000` | 5s assertion timeout |
| `reporter` | `html`, `list` | Human report plus terminal output |
| `trace` | `on-first-retry` | Capture traces only when useful |
| `screenshot` | `only-on-failure` | Keep artifacts focused |
| `video` | `on-first-retry` | Avoid large routine artifacts |

Chromium is the active browser project. Firefox, WebKit, and mobile projects are present as commented config stubs.

## Browser Stability Flags

Chromium runs with stability flags for restricted environments:

- `--disable-gpu`
- `--disable-software-rasterizer`
- `--disable-dev-shm-usage`
- `--no-sandbox`
- `--disable-setuid-sandbox`
- `--disable-extensions`
- `--disable-background-networking`
- `--disable-default-apps`
- `--disable-sync`
- `--no-first-run`
- `--disable-translate`
- `--disable-features=IsolateOrigins,site-per-process`
- `--disable-breakpad`
- `--disable-renderer-backgrounding`
- `--disable-background-timer-throttling`
- `--disable-backgrounding-occluded-windows`

## Writing Tests

Prefer user-visible locators:

```ts
await page.getByRole('button', { name: /quick actions/i }).click();
await page.getByRole('link', { name: /log primos/i }).click();
await expect(page.locator('#quick-resource-logger')).toBeInViewport();
```

Scope repeated labels with regions or nearby headings:

```ts
const todayPlan = page.getByRole('region', { name: /today's plan/i });
await expect(todayPlan.getByRole('heading', { name: 'Refresh account data' })).toBeVisible();
```

Avoid `.nth()` selectors unless the order itself is the behavior under test.

## IndexedDB Seeding

Use helper patterns in `e2e/fixtures/test-data.ts` and existing specs. For focused seeded flows, open the app first so Dexie initializes, write records into IndexedDB, then reload:

```ts
await page.goto('/');
await waitForAppReady(page);
await putRecords(page, { campaigns: [campaign], importRecords: [importRecord] });
await page.reload();
await waitForAppReady(page);
```

For destructive database cleanup, navigate away before deleting IndexedDB so Dexie closes active connections.

## Debugging

```bash
npx playwright show-report
npx playwright show-trace test-results/*/trace.zip
npm run test:e2e -- -g "test name pattern"
npm run test:e2e -- --debug
```

## Known Limitations

- Enka/network-dependent paths should be mocked or skipped unless the test explicitly owns network setup.
- Chromium is the only active browser project.
- Some low-level browser warnings are expected in local runs and do not indicate test failures.
