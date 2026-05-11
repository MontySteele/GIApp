# Genshin Progress Tracker

This is a local-first PWA for Genshin Impact players. Its current product direction is goal-first: help users decide what to do next from their account data, not just store character and primogem records.

## Living Documentation

- [README](README.md) - Product overview, current routes, and quick start
- [Architecture](docs/ARCHITECTURE.md) - Feature boundaries, schema, routing, and patterns
- [Contributing](docs/CONTRIBUTING.md) - Development workflow and coding standards
- [E2E Testing](docs/E2E_TESTING.md) - Playwright setup and current smoke suites
- [Changelog](docs/CHANGELOG.md) - Current history and release notes
- [Test Coverage Plan](TEST_COVERAGE_PLAN.md) - Current test metrics and priorities
- [Patch Update Runbook](CLAUDE_UPDATE.md) - Static game-data update instructions

## Current App Structure

### Primary Routes

| Surface | Route | Notes |
|---|---|---|
| Dashboard | `/` | Next Up, contextual target entry, quick capture, compact snapshot, freshness |
| Targets | `/campaigns` | User-facing Targets control center, storage still uses campaigns |
| Target Detail | `/campaigns/:id` | Target plan, readiness, next actions |
| Roster | `/roster` | Characters plus nested weapons, artifacts, build templates |
| Teams | `/teams` | Team hub, bosses, team detail, export flows |
| Pulls | `/pulls` | Budget, calculator, wish history, banners |
| Planner | `/planner` | Materials, domains, target deficits |
| Import Hub | `/imports` | Roster, wish history, manual fallback, backup, last import impact |
| More | `/more` | Mobile secondary navigation |
| Notes | `/notes` | Notes and quick notes |
| Settings | `/settings` | Sync, backup, restore |

### Route Compatibility

Old routes redirect rather than breaking saved links:

- `/wishes` -> `/pulls`
- `/wishes/calculator` -> `/pulls/calculator`
- `/calculator` -> `/pulls/calculator`
- `/ledger` -> `/pulls/budget`
- `/calendar` -> `/planner/domains`
- `/builds` -> `/roster/builds`
- `/bosses` -> `/teams/bosses`

## Key Product Concepts

### Targets

Targets are the user-facing planning model. Keep the `/campaigns` route and `campaigns` table for compatibility, but use "Targets" in new UI copy unless a code identifier requires "campaign".

Target summaries normalize:

- Active campaigns
- Planned banners
- Wishlist characters
- Owned character polish shortcuts

### Start a Target Wizard

The dashboard and target surfaces expose a three-step wizard:

1. Goal: Get character, Build character, or Polish team
2. Details: character/team, build goal, deadline, pull state, pity, guarantee, constellation
3. Preview: hard-pity coverage, shortfall, daily pace, advice, create/check-odds actions

Manual mode is intentional. The wizard should remain useful before roster or wish imports are complete.

### Import Hub and Freshness

`/imports` centralizes setup:

- Roster and inventory import status
- Wish history status
- Manual fast path
- Backup and restore status
- Live snapshot counts
- Last import impact summary

Dashboard freshness should point users here when account data is missing or stale; fresh data should stay subtle.

### Quick Actions

The floating Quick Action Bar currently exposes:

- Start Target -> `/campaigns`
- Log Primos -> `/#quick-resource-logger`
- Update Pity -> `/pulls/history`
- Import Data -> `/imports`
- Add Note -> `/notes`

Hash scrolling is handled in the app layout so deep links land on the intended dashboard section.

## Development Commands

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
npm run test:e2e -- --project=chromium
```

Focused smokes after target/dashboard/navigation work:

```bash
npx playwright test e2e/tests/campaign-flow.spec.ts --project=chromium
npx playwright test e2e/tests/navigation.spec.ts --project=chromium
```

## Current Test Baseline

Latest verified baseline:

- 145 Vitest files
- 2052 Vitest tests
- Campaign-flow Playwright smoke passing
- Navigation Playwright smoke passing

## Engineering Guidelines

- Prefer feature-local domain logic over page-component calculations.
- Keep storage compatibility unless the user explicitly approves schema churn.
- Preserve user data and old routes during naming changes.
- Use `useLiveQuery` for reactive Dexie reads.
- Use workers for heavy probability simulations.
- Add tests around user advice, routing, import writes, and dashboard next actions.
- Prefer roles and accessible names in Playwright selectors; scope repeated labels with regions.
