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

## Current Sprint: 9 (January 2026)

### Goals
1. **Multi-character planner** - Select multiple characters, aggregate all material needs
2. **Weapon material planner** - Extend planner to include weapon ascension

### Requirements
- **TDD**: Write tests BEFORE implementation
- **Coverage**: Maintain 80%+ test coverage
- Run `npm test -- --run` before committing

### Previous Sprint (8.1) - Completed
- All 390 tests passing
- Genshin-DB API integration with cache versioning
- Material aggregation, manual Mora input, Comfortable Build goal

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

### Sprint 10 Candidates
1. **Artifact optimizer** - Basic artifact scoring and set recommendations
2. **QR code camera import** - Scan Enka QR codes directly from camera
3. **Farming route suggestions** - Show optimal domains/bosses based on needed materials

### Sprint 11+ Candidates
4. **Resin efficiency calculator** - Recommend best use of daily resin
5. **Team DPS comparisons** - Compare team compositions
6. **Build templates** - Save and share character build templates
7. **Achievement tracker** - Track in-game achievements

### Technical Debt (Ongoing)
- Maintain 80%+ test coverage
- Add E2E tests for critical user flows
- Performance profiling for large inventories
