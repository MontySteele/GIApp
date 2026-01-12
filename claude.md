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

## Current Sprint: 8.1 (January 2026)

### Completed
- Genshin-DB API integration for character-specific materials
- Fixed material categorization (LOCAL_SPECIALTIES whitelist, COMMON_TIER_PATTERNS)
- Fixed API response type parsing (arrays, not objects)

### In Progress
- Test coverage improvement (35 failing, down from 39)
- See `TEST_COVERAGE_PLAN.md`

### Upcoming (Sprint 9)
- Artifact optimizer
- QR code camera import

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
