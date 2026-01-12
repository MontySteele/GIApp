# Architecture

## Tech Stack

- **React 18+** with TypeScript
- **Vite** (build tooling)
- **Dexie.js** (IndexedDB wrapper)
- **Zustand** (UI state management)
- **Tailwind CSS** + **Recharts** + **Lucide React**
- **Web Workers** (for Monte Carlo simulations)
- **PWA capabilities**

## Data Flow

```
React Components → Hooks → Repository Layer → Dexie (IndexedDB)
                ↘ Zustand (UI State)
                ↘ Shared Services (lib/services)
```

## Key Patterns

- **Feature-based organization** with `/domain`, `/repo`, `/hooks`, `/components`, `/pages`
- **Repository pattern** for data access (Dexie → repo → hooks → components)
- **Reactive patterns** using `useLiveQuery` for automatic database reactivity
- **Shared services layer** for cross-feature logic (e.g., resource calculations)
- **Performance optimization** via `useCallback`, `useMemo`, `useReducer`

---

## File Structure

```
src/
├── app/                    # App shell, routing, layout
├── components/             # Shared UI components
│   ├── ui/                # Primitives (Button, Card, Modal, Input, Select, Badge)
│   └── common/            # Layout (Header, TabNav)
├── db/
│   └── schema.ts          # Dexie schema + migrations
├── features/              # Feature modules (domain-driven)
│   ├── artifacts/         # Artifact inventory (standalone)
│   │   └── repo/          # artifactRepo
│   ├── calculator/        # Pull probability calculator
│   │   ├── components/    # SingleTarget, MultiTarget, ReverseCalculator
│   │   ├── domain/        # Monte Carlo, DP probability
│   │   ├── hooks/         # useCalculator
│   │   └── store/         # calculatorStore (Zustand)
│   ├── ledger/            # Primogem tracking
│   │   ├── components/    # UnifiedChart, TransactionLog, PurchaseLedger
│   │   ├── domain/        # resourceCalculations, historicalReconstruction
│   │   ├── hooks/         # useResources (reactive pattern)
│   │   ├── pages/         # LedgerPage
│   │   └── repo/          # primogemEntryRepo, resourceSnapshotRepo, etc.
│   ├── planner/           # Ascension planner
│   │   ├── domain/        # ascensionCalculator, materialConstants, characterMaterials
│   │   ├── components/    # ResinTracker
│   │   ├── hooks/         # useMaterials
│   │   └── pages/         # PlannerPage
│   ├── roster/            # Character management
│   │   ├── components/    # CharacterCard, CharacterForm, EnkaImport, GOODExport
│   │   ├── hooks/         # useCharacters, useTeams
│   │   ├── pages/         # CharacterListPage, CharacterDetailPage
│   │   └── repo/          # characterRepo, teamRepo, inventoryRepo (materials)
│   ├── weapons/           # Weapon inventory
│   │   └── repo/          # weaponRepo (standalone inventory)
│   ├── wishes/            # Wish history
│   │   ├── components/    # WishImport, WishTable, WishStatistics, etc.
│   │   ├── domain/        # wishAnalyzer, pityEngine, gachaRules, replayEngine
│   │   ├── pages/         # WishPage
│   │   └── repo/          # wishRepo (minimal raw storage)
│   ├── calendar/          # Events & Timers
│   │   ├── components/    # EventList, ResetTimers, BannerCountdown
│   │   ├── domain/        # resetTimers, eventTypes
│   │   ├── hooks/         # useEvents
│   │   └── pages/         # CalendarPage
│   ├── notes/             # Goals & Notes
│   └── sync/              # Settings & Sync
├── lib/
│   ├── constants.ts       # Game constants, gacha rules
│   ├── gameData.ts        # Character data, icon mappings
│   ├── services/          # Shared cross-feature services
│   │   ├── resourceService.ts  # Pull calculation logic
│   │   └── genshinDbService.ts # Genshin-DB API client with caching
│   └── utils/             # Utility functions
│       └── materialNormalization.ts  # Material key matching
├── mappers/               # External format mappers (GOOD, Enka)
├── stores/                # Global Zustand stores
├── types/                 # TypeScript types
└── workers/               # Web Workers (Monte Carlo)
```

---

## Database Schema (Dexie v3)

### Core Tables
- `characters` - Character builds and progression
- `teams` - Team compositions
- `wishes` - Raw wish records (minimal data)
- `primogemEntries` - Transaction log
- `fateEntries` - Fate transaction log
- `resourceSnapshots` - Point-in-time resource captures
- `goals` - User goals (simplified notes)
- `notes` - Markdown notes
- `plannedBanners` - Future pull targets
- `abyssRuns` - Spiral Abyss history
- `externalCache` - API response cache (Enka, genshin-db)
- `calculatorScenarios` - Saved pull scenarios

### Inventory Tables
- `inventoryArtifacts` - Standalone artifact inventory
- `inventoryWeapons` - Standalone weapon inventory
- `materialInventory` - Material counts

---

## Design Guidelines

### Performance
- Use `useLiveQuery` from dexie-react-hooks for reactive database queries
- Avoid manual useEffect + useState patterns when useLiveQuery is available
- Web Workers mandatory for heavy simulations (don't block UI)

### Security
- Authkeys are session-only by default
- No sensitive data stored permanently

### Versioning
- Schema migrations via Dexie versions
- Gacha rules versioned for post-5.0 mechanics
