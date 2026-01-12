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
| **Planner** | Multi-char/weapon planning, deficit priority, resin efficiency, farming schedule |
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

## Current Sprint: 10 (January 2026)

### Goals
1. **Artifact optimizer** - Basic artifact scoring and set recommendations
2. **QR code camera import** - Scan Enka QR codes directly from camera

### Requirements
- **TDD**: Write tests BEFORE implementation
- **Coverage**: Maintain 80%+ test coverage
- Run `npm test -- --run` before committing

### Previous Sprint (9) - Completed
- All 449 tests passing
- **Multi-character planner** - Select multiple characters, aggregate material needs
- **Weapon material planner** - Weapon ascension materials with level 80 goal option
- **Goal types** - Added "Functional" (80/80, 1/6/6) for minimal investment support builds
- **Resin breakdown** - Split estimates into Talents/Boss vs EXP/Mora categories
- **Today's Farming Recommendations** - Cross-references talent needs with domain schedule
- **Material Deficit Priority** - Shows which materials block the most progress
- **Resin Efficiency Calculator** - Compares farming activities and recommends daily priorities
- **Fixed resin calculations** - Corrected talent domain drop rates and formula
- **TypeScript cleanup** - Fixed 18 errors across codebase

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

### Sprint 11 Candidates
1. **Team DPS comparisons** - Compare team compositions
2. **Build templates** - Save and share character build templates
3. **Achievement tracker** - Track in-game achievements
4. **Weekly boss tracker** - Track completed weekly bosses with reset timer

### Technical Debt (Ongoing)
- Maintain 80%+ test coverage
- Add E2E tests for critical user flows
- Performance profiling for large inventories
