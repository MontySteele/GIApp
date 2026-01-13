# Genshin Progress Tracker

A local-first PWA for Genshin Impact players to track characters, wishes, primogems, and plan future pulls.

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Tech stack, file structure, design patterns
- **[Contributing](docs/CONTRIBUTING.md)** - Development guidelines, TDD, coding standards
- **[E2E Testing](docs/E2E_TESTING.md)** - Playwright setup, troubleshooting, containerized environments
- **[Changelog](docs/CHANGELOG.md)** - Sprint history and recent changes
- **[Refactoring Plan](docs/REFACTORING_PLAN.md)** - UI consolidation plan (13→6 tabs)
- **[Test Plan](TEST_COVERAGE_PLAN.md)** - Test coverage strategy and priorities

---

## App Structure (6 Tabs)

| Tab | Route | Description |
|-----|-------|-------------|
| **Dashboard** | `/` | Quick stats, notes widget, today's priorities |
| **Roster** | `/roster` | Characters, weapons, artifacts collection |
| **Teams** | `/teams` | Team hub with materials, bosses, build templates, wfpsim export |
| **Wishes** | `/wishes` | Pity tracking, pull calculator, primogem budget |
| **Calendar** | `/calendar` | Domain schedule, reset timers, events |
| **Settings** | `/settings` | Configuration and data sync |

### Key Nested Routes
- `/roster/weapons`, `/roster/artifacts` - Collection sub-views
- `/roster/:id` - Character detail with goals
- `/teams/:id` - Team detail (materials, bosses, build gaps)
- `/teams/templates` - Build template browser
- `/wishes/calculator` - Pull probability simulator
- `/wishes/budget` - Primogem income tracking

---

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run test:run     # Run unit tests
npm run test:coverage   # Coverage report
npm run test:e2e     # Run E2E tests (requires: npx playwright install chromium)
```

---

## Architecture Overview

```
React Components → Hooks → Repository Layer → Dexie (IndexedDB)
                ↘ Zustand (UI State)
                ↘ Shared Services (lib/services)
```

**Key Patterns:**
- Feature-based organization (`/domain`, `/repo`, `/hooks`, `/components`, `/pages`)
- Repository pattern for all database access
- `useLiveQuery` for reactive database queries
- Web Workers for Monte Carlo simulations

---

## Current Sprint: 14 - Complete (January 2026)

### Sprint 14: Build Templates UX Enhancement
- ✅ **Character search in TeamForm** - Quick filter when building teams
- ✅ **Equipment data** - Static weapon/artifact data for form dropdowns
- ✅ **BuildTemplateForm overhaul** - Searchable weapon/artifact selectors, main stat buttons, substat priority
- ✅ **Filter/sort utilities** - Consolidated ~480 lines of duplicate logic into shared utils
- ✅ **gcsim import** - Parse gcsim configs into build templates via modal

### Test Status
- All 1,263 tests passing
- Run `npm run test:run` before committing

### Previous Sprint (13) - Completed ✅
- PityHeader across all Wishes sub-tabs
- BuildGapDisplay with completion percentage
- ApplyTemplateModal and TeamMemberCard
- Weekly boss filtering by team needs
- Goal creation in-context

---

## Essential Guidelines

### TDD
- Write tests first
- Domain logic must have unit tests
- 80% coverage target

### TypeScript
- No `any` types
- Define props interfaces
- Discriminated unions for complex state

### Architecture
- Feature-based organization
- Repository pattern
- No circular dependencies

See [Contributing Guide](docs/CONTRIBUTING.md) for details.

---

## Key Domain Logic

### Primogem Reconstruction
`src/features/ledger/domain/historicalReconstruction.ts`
- Reconstruct from snapshots + wish spending (160 primos/pull)
- Forward projection from pull frequency

### Gacha Probability
`src/features/calculator/domain/pityEngine.ts`
- Post-5.0 Capturing Radiance: 55% base, guarantee after 3 losses
- Soft pity: 74+, Hard pity: 90

### Material Identification
`src/lib/services/genshinDbService.ts`
- genshin-db API with 7-day cache
- LOCAL_SPECIALTIES whitelist
- COMMON_TIER_PATTERNS for material categorization
- Cache schema versioning for automatic refresh on structure changes

---

## Future Sprint Backlog

### Sprint 15 Candidates
1. **Link budget to calculator** - Connect primogem projections to pull scenarios
2. **Team sharing/export** - JSON export, shareable links for team compositions
3. **Today's farming widget** - Dashboard widget showing optimal daily farming
4. **Artifact optimizer** - Basic artifact scoring and set recommendations

### Technical Debt (Ongoing)
- Maintain 80%+ test coverage
- Add E2E tests for critical user flows
- Performance profiling for large inventories
- Extract duplicate filter/sort logic to shared utilities
