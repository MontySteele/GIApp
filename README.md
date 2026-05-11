# GIApp

GIApp is a local-first Genshin Impact progress tracker focused on turning account data into practical next actions: what to pull for, what to farm today, when to refresh imports, and how close a target is.

## What It Tracks

- **Targets** - Goal-first planning for character acquisition, character builds, and team polish.
- **Roster** - Owned characters, wishlist intent, weapons, artifacts, build templates, and imports.
- **Pulls** - Wish history, pity, guarantee state, odds calculators, primogem budget, and resource ledger.
- **Planner** - Material deficits, farming schedule, resin guidance, and campaign-aware material routes.
- **Teams** - Team compositions, build gaps, boss needs, and wfpsim/gcsim export.
- **Imports and Sync** - GOOD/Irminsul roster imports, wish history import, backups, freshness status, and last import impact.

The app keeps user data in IndexedDB through Dexie and can run as a PWA.

## Current Information Architecture

### Desktop Navigation

| Route | Surface | Purpose |
|---|---|---|
| `/` | Dashboard | Command center with Next Up, contextual target entry, quick capture, compact snapshot, and conditional data freshness |
| `/campaigns` | Targets | Active, planned, wishlist, and completed planning targets |
| `/roster` | Roster | Characters plus nested weapons, artifacts, and build templates |
| `/teams` | Teams | Team management, boss needs, and team detail flows |
| `/pulls` | Pulls | Budget, calculator, wish history, and planned banners |
| `/planner` | Planner | Material planning, target deficits, domain schedule |
| `/settings` | Sync | Backup, restore, and app sync settings |

### Mobile Navigation

Mobile keeps daily-use routes in the bottom nav: Home, Targets, Roster, Pulls, and More. Secondary destinations such as Planner, Teams, Notes, Imports, Settings, Build Templates, and Bosses live under More or contextual links.

### Key Deep Links

- `/imports` - Import Hub for roster, wish history, manual fallback, backup status, and last import summaries.
- `/roster?import=irminsul` - Opens the Irminsul/GOOD roster import flow.
- `/#quick-resource-logger` - Opens the dashboard and scrolls to the quick primogem/resource logger.
- `/pulls/calculator` - Manual odds fast path and campaign handoff destination.
- `/campaigns?character=Furina&pullPlan=1` - Target draft prefill for one-click "make this a target" flows.

Legacy routes such as `/wishes`, `/calculator`, `/ledger`, `/calendar`, `/builds`, and `/bosses` redirect to their current locations.

## Goal-First UX

Recent UX work reframed the old Campaigns concept around Targets while preserving the `/campaigns` route for storage and route compatibility.

- The dashboard owns "what should I do now?" through a single Next Up system, plus quick resource capture and a compact account snapshot.
- The Start a Target wizard supports Get character, Build character, and Polish team modes.
- Start Target is contextual: the full wizard appears when there are no real targets, while existing targets get a compact entry point.
- Missing or stale imports are promoted into Next Up and the contextual target entry before suggesting another target.
- Manual mode works without imports: users can enter saved pulls, current pity, guarantee, current constellation, target constellation, and deadline.
- Preview math shows hard-pity coverage, worst-case pull shortfall, daily pace, and guards against already-met constellation targets.
- Planned banners, wishlist items, character cards, calculator flows, and dashboard empty states can promote intent into a target.
- Quick actions provide fast access to Start Target, Log Primos, Update Pity, Import Data, and Add Note.

Dashboard ownership stays intentionally narrow: Pulls owns budget depth, wish history, and charts; Planner owns farming math and material deficits; Targets owns target management and grouping.

## Development Quick Start

```bash
npm install
npm run dev
npm run lint
npm run test:run
npm run build
```

Useful checks:

```bash
npx playwright test e2e/tests/campaign-flow.spec.ts --project=chromium
npx playwright test e2e/tests/navigation.spec.ts --project=chromium
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Tech stack, feature boundaries, schema, and routing.
- [Contributing](docs/CONTRIBUTING.md) - Development workflow, TDD, TypeScript, and PR guidance.
- [E2E Testing](docs/E2E_TESTING.md) - Playwright setup, current test files, and debugging.
- [Changelog](docs/CHANGELOG.md) - Recent changes and sprint history.
- [Test Coverage Plan](TEST_COVERAGE_PLAN.md) - Current test metrics and coverage priorities.
- [Testing Checklist](TESTING_CHECKLIST.md) - Manual smoke checks for core flows.

## Database Migrations

- Migrations fail closed: if an upgrade throws, database initialization aborts so the app never runs on a partially migrated schema.
- No-op upgrades still bump `appMeta.schemaVersion` via Dexie upgrade hooks so clients stay aligned with the latest version.
- Metadata like `deviceId` and `createdAt` is hydrated when missing to keep app identity intact across migrations.

Current schema version: Dexie v5.
