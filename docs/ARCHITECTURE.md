# Architecture

## Tech Stack

- **React 18** with TypeScript
- **Vite** for development and production builds
- **Dexie.js** for IndexedDB persistence
- **Zustand** for lightweight UI state
- **Tailwind CSS**, **Recharts**, and **Lucide React** for UI
- **Web Workers** for Monte Carlo pull simulations
- **PWA** support through Vite PWA

## Data Flow

```text
React Components -> Hooks -> Repository Layer -> Dexie (IndexedDB)
                 -> Domain Selectors / Services
                 -> Zustand UI State
                 -> Web Workers for heavy probability work
```

The app is local-first. Most data changes go through feature repositories, reactive reads use `useLiveQuery`, and product-level summaries are computed in domain modules rather than in page components.

## Product Model

The user-facing planning concept is **Targets**. The storage and route layer still uses `campaigns` for compatibility, but UI copy should prefer Targets or Goals when the user is making a plan.

Target summaries are a facade over existing tables:

- Active campaigns in `campaigns`
- Planned banners in `plannedBanners`
- Wishlist entries in Zustand
- Owned character build/polish shortcuts from `characters`

The dashboard consumes those summaries to choose one Next Up action and decide whether First Target Setup, the full Start Target wizard, or a compact target entry point should appear.

First Target Setup is intentionally separate from storage. `features/targets/domain/firstTargetSetup.ts` computes a small state machine from live counts and account freshness:

1. Import or refresh roster data
2. Add pull/resource context
3. Choose the first target
4. Review the target plan

Dashboard and Import Hub render the shared setup card only while no campaign, planned banner, or wishlist target exists. Pulls renders a resource-specific handoff when there are no snapshots or wish records yet, using the same route constants from the setup domain.

## Feature Boundaries

```text
src/
├── app/                    # Router, layout shell, hash scrolling
├── components/
│   ├── ui/                 # Primitives: Button, Card, Modal, Input, Select, Badge
│   └── common/             # Header, desktop nav, mobile nav, quick actions, onboarding
├── db/                     # Dexie schema, migrations, app metadata
├── features/
│   ├── artifacts/          # Standalone artifact inventory and scoring
│   ├── bosses/             # Weekly boss data and trackers
│   ├── builds/             # Build templates and gcsim/wfpsim parsing
│   ├── calculator/         # Pull probability calculators and worker integration
│   ├── calendar/           # Reset timers and event/domain schedule helpers
│   ├── campaigns/          # Target storage, target control center, campaign planning
│   ├── dashboard/          # Command center, Next Up logic, quick capture
│   ├── ledger/             # Primogem/fate/resource entries and projections
│   ├── more/               # Mobile secondary navigation hub
│   ├── notes/              # Notes and quick note widgets
│   ├── planner/            # Material planning, farming schedule, target deficits
│   ├── roster/             # Characters, teams hooks, GOOD/Irminsul/Enka import UI
│   ├── sync/               # Import Hub, backup/restore, app metadata, freshness
│   ├── targets/            # Product-level target facade, First Target Setup, Start Target wizard
│   ├── teams/              # Team hub, team detail, bosses, wfpsim export
│   ├── weapons/            # Standalone weapon inventory
│   └── wishes/             # Wish records, pity, import, banners, freshness
├── lib/                    # Constants, game data, shared services, utilities
├── mappers/                # External format mappers: GOOD, Enka, Irminsul
├── stores/                 # Global Zustand stores
├── types/                  # Shared TypeScript types
└── workers/                # Monte Carlo worker
```

## Routing and IA

Primary routes:

- `/` - Dashboard command center
- `/campaigns`, `/campaigns/materials`, and `/campaigns/:id` - Targets control center, target material deficits, and target detail
- `/roster`, `/roster/teams`, `/roster/teams/:id`, `/roster/planner`, `/roster/domains`, `/roster/bosses`, `/roster/weapons`, `/roster/artifacts`, `/roster/builds`, `/roster/:id`
- `/pulls`, `/pulls/calculator`, `/pulls/history`, `/pulls/banners`
- `/imports` - Import Hub
- `/more` - Mobile More page
- `/notes`
- `/settings` - Sync and backup settings

Compatibility redirects:

- `/wishes` -> `/pulls`
- `/wishes/calculator` -> `/pulls/calculator`
- `/calculator` -> `/pulls/calculator`
- `/ledger` -> `/pulls`
- `/planner` -> `/roster/planner`
- `/planner/materials` -> `/campaigns/materials`
- `/planner/domains` -> `/roster/domains`
- `/teams` -> `/roster/teams`
- `/teams/bosses` -> `/roster/bosses`
- `/teams/:id` -> `/roster/teams/:id`
- `/calendar` -> `/roster/domains`
- `/builds` -> `/roster/builds`
- `/bosses` -> `/roster/bosses`

Hash links are handled in the app shell so SPA navigation such as `/#quick-resource-logger` and `/pulls#resource-snapshot` scrolls after route changes.

## Database Schema (Dexie v5)

### Core Tables

- `characters` - Character builds, progression, priority, notes
- `teams` - Team compositions
- `wishRecords` - Raw wish history records
- `primogemEntries` - Primogem ledger entries
- `fateEntries` - Fate ledger entries
- `resourceSnapshots` - Point-in-time resource captures
- `abyssRuns` - Spiral Abyss history
- `goals` - Legacy simplified goal records
- `notes` - Markdown notes
- `plannedBanners` - Future pull intent
- `externalCache` - API response cache
- `appMeta` - Schema version, backup metadata, app metadata
- `calculatorScenarios` - Saved pull scenarios
- `campaigns` - Target plans for pulls, builds, and teams

### Inventory and Import Tables

- `inventoryArtifacts` - Standalone artifact inventory
- `inventoryWeapons` - Standalone weapon inventory
- `materialInventory` - Material counts
- `importRecords` - Import source and timestamp history
- `buildTemplates` - Character build templates

## Key Patterns

- **Feature modules own their domain logic.** Prefer `features/*/domain` for calculations and selectors, then consume those from hooks/components.
- **Repositories hide Dexie details.** UI code should not call `db.table` directly unless it is a small page-level live count or a focused migration/import surface.
- **Target facade avoids schema churn.** Product-level Target logic lives in `features/targets` while storage remains in `campaigns`, `plannedBanners`, and existing stores.
- **Setup state is derived, not persisted.** First Target Setup is computed from live counts, resource state, and import freshness so it cannot drift from the actual account state.
- **Manual fast paths matter.** Pull odds and target creation should work with user-entered pity/pulls even when imports are incomplete.
- **Import freshness is product data.** `useAccountDataFreshness` and Import Hub summaries feed dashboard guidance, not just settings screens.
- **Dashboard ownership is narrow.** Dashboard owns "what should I do now?" and quick capture. Pulls owns budget depth, wish history, and charts. Targets owns target management and target-specific material deficits. Roster owns characters, teams, domains, and progression planning.
- **Workers own expensive simulations.** Monte Carlo and heavy probability work must stay off the main thread.

## Design Guidelines

### Performance

- Use `useLiveQuery` for reactive database queries.
- Memoize expensive selectors and plan calculations.
- Keep dashboard widgets high-signal, compact, and free of duplicated page-depth surfaces.
- Run pull simulations in workers.

### Accessibility

- Icon-only buttons need labels.
- Decorative icons should use `aria-hidden="true"`.
- E2E selectors should prefer roles, names, and scoped regions over positional selectors.

### Security and Privacy

- Authkeys are session-only by default.
- User data stays local unless explicitly exported or backed up by the user.

### Versioning

- Schema migrations use Dexie versions.
- Current schema version is v5.
- Static game-data patching follows `CLAUDE_UPDATE.md`.
