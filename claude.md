# Genshin Progress Tracker

A local-first PWA for Genshin Impact players to track characters, wishes, primogems, and plan future pulls.

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - Tech stack, file structure, design patterns
- **[Contributing](docs/CONTRIBUTING.md)** - Development guidelines, TDD, coding standards
- **[Changelog](docs/CHANGELOG.md)** - Sprint history and recent changes
- **[Test Plan](TEST_COVERAGE_PLAN.md)** - Test coverage strategy and priorities

---

## Core Features

| Feature | Description |
|---------|-------------|
| **Roster** | Character/team management, Enka import, GOOD format |
| **Wishes** | Pity tracking, Capturing Radiance, URL import |
| **Ledger** | Snapshot-based primogem tracking, projection charts |
| **Calculator** | Single/multi-target probability, Monte Carlo simulation |
| **Planner** | Character materials via genshin-db API |
| **Calendar** | Reset timers, event tracking |

---

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Production build
npm run test:run     # Run tests
npm run test:coverage   # Coverage report
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

## Current Sprint: 8.1 (January 2026) - COMPLETED

### Completed
- Genshin-DB API integration for character-specific materials
- Fixed material categorization (LOCAL_SPECIALTIES whitelist, COMMON_TIER_PATTERNS)
- Fixed API response type parsing (arrays, not objects)
- **All 390 tests passing** (down from 35 failures)
- Fixed resource calculation double-counting bug in resourceService.ts
- Added cache schema versioning to invalidate stale material data
- Added material aggregation (same materials for ascension + talents combined)
- Added manual Mora input field in planner
- Added "Comfortable Build" goal option (80/8/8/8)

### Sprint 9 Candidates
See bottom of this file for prioritized backlog

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

## Sprint 9 Backlog (Prioritized)

### High Priority
1. **Multi-character planner** - Select multiple characters and aggregate all material needs
2. **Weapon material planner** - Extend planner to include weapon ascension materials
3. **Artifact optimizer** - Basic artifact scoring and set recommendations

### Medium Priority
4. **QR code camera import** - Scan Enka QR codes directly from camera
5. **Farming route suggestions** - Show optimal domains/bosses based on needed materials
6. **Resin efficiency calculator** - Recommend best use of daily resin

### Lower Priority
7. **Team DPS comparisons** - Compare team compositions
8. **Build templates** - Save and share character build templates
9. **Achievement tracker** - Track in-game achievements

### Technical Debt
- Increase test coverage to 80% target
- Add E2E tests for critical user flows
- Performance profiling for large inventories
