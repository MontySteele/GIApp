# Genshin Progress Tracker

## Project Overview

A local-first Progressive Web App for Genshin Impact players to track character progression, wish history, primogem income, and plan future pulls with probability calculations.

**Tech Stack:**
- React 18+ with TypeScript
- Vite (build tooling)
- Dexie.js (IndexedDB wrapper)
- Zustand (UI state management)
- Tailwind CSS + Recharts + Lucide React
- Web Workers (for Monte Carlo simulations)
- PWA capabilities

**Architecture:**
```
React Components → Hooks → Repository Layer → Dexie (IndexedDB)
                ↘ Zustand (UI State)
                ↘ Shared Services (lib/services)
```

**Key Patterns:**
- Feature-based organization with `/domain`, `/repo`, `/hooks`, `/components`, `/pages`
- Repository pattern for data access (Dexie → repo → hooks → components)
- Reactive patterns using `useLiveQuery` for automatic database reactivity
- Shared services layer for cross-feature logic (e.g., resource calculations)
- Performance optimization via `useCallback`, `useMemo`, `useReducer`

---

## Core Features

### 1. Character Roster Management
- [x] Character storage schema (level, constellation, talents, weapon, artifacts)
- [x] Character list view (grid/list toggle, filtering, sorting, search)
- [x] Character detail view with full build display
- [x] Team management (create, edit, assign characters)
- [x] Enka.network import (fetch showcase by UID)
- [x] GOOD format import/export
- [x] Team snapshot export
- [x] Manual character entry
- [x] Character portraits from Enka CDN

### 2. Wish History & Pity Tracking
- [x] Wish record storage (minimal raw data)
- [x] Pity computation engine (replay-based, not stored per-record)
- [x] Capturing Radiance support (post-5.0 mechanic, 55% base rate, guarantee after 3 losses)
- [x] Versioned gacha rules engine
- [x] Pity dashboard (progress bars, guarantee status, radiant streak)
- [x] Wish history table with computed pity display
- [x] Wish URL import (with session-only authkey storage)
- [x] Manual wish entry (collapsible, hidden by default)
- [x] Statistics (average pity, 50/50 win rate, total pulls)
- [x] Pull history chart (time-series visualization by day/week/month)

### 3. Primogem & Resource Tracking
The Primogem Tracker uses a **snapshot-based workflow**:

**Core Concept:**
- Take periodic **resource snapshots** (ground truth from in-game values)
- Track **purchases** separately with full CRUD operations
- Historical values **reconstructed** from snapshots + wish spending (160 primos per pull)
- Forward projection based on pull frequency (pulls ≈ income)

**Features:**
- [x] Resource snapshots (primogems, genesis crystals, fates, starglitter, stardust)
- [x] Purchase ledger with add/edit/delete and historical date picker
- [x] Unified transaction log (snapshots, purchases, wish spending)
- [x] Historical + projection chart (reconstructs past, projects future)
- [x] F2P view toggle (exclude purchases from chart)
- [x] Daily income rate calculation from wish frequency
- [x] Current stash summary (snapshot + purchases - wish spending)

**Removed (simplified):**
- ~~Manual primogem entry by source~~
- ~~Commission/Welkin quick buttons~~
- ~~Income Timeline component~~
- ~~Separate earned vs purchased tracking~~

### 4. Pull Probability Calculator
- [x] Web Worker setup for heavy computation
- [x] Single-target calculator (analytical DP approach)
  - [x] Exact probability with current pulls
  - [x] Pulls needed for 50/80/90/99% confidence
  - [x] Probability distribution chart
- [x] Multi-target planner (Monte Carlo simulation)
  - [x] Multiple characters with banner dates
  - [x] Pull timeline visualization
  - [x] Per-character and per-constellation probabilities
  - [x] Configurable simulation count (5k/20k/100k)
  - [x] Per-target pity state (inherit from previous or custom)
  - [x] Mixed character + weapon targeting
- [x] Reverse calculator (required income for target confidence)
- [x] Scenario comparison (save & compare plans)

### 5. Calendar & Timers
- [x] Reset timers (daily, weekly, Spiral Abyss, monthly shop)
- [x] US Server time calculations (UTC-5)
- [x] Live countdown updates
- [x] Event fetching from HuTao bot (GitHub)
- [x] Active/upcoming event display with filtering by type
- [x] Banner tracking with end timers
- [x] Cached event data with 1-hour refresh
- [x] Fallback to stale cache on fetch errors

### 6. Goals & Notes
- [x] Goal tracking with checklists
- [x] Category filtering & status tracking
- [x] Character/team linking
- [x] Markdown notes editor
- [x] Tagging & search
- [x] Pin to top

### 7. Cross-Device Sync
- [x] Export all data (JSON backup)
- [x] Import/restore with merge strategies
- [x] Compression (lz-string)
- [x] Encryption (AES-GCM with passphrase)
- [x] QR code generation (for small payloads <2KB)
- [x] Merge strategies (replace, newer wins, keep local)
- [x] Copy/paste text transfer flow
- [x] Encrypted passphrase protection

### 8. PWA & Settings
- [x] PWA manifest & service worker
- [x] Offline caching for static assets
- [x] Installability
- [x] Display preferences (show/hide manual entry sections)
- [x] Theme (light/dark/system)
- [ ] Date format preferences
- [ ] Default calculator settings
- [x] Backup reminders

---

## Data Models Summary

**Core Tables:**
- `characters` - Character roster with builds
- `teams` - Team compositions with rotation notes
- `wishRecords` - Raw wish data (pity computed at runtime)
- `primogemEntries` - Purchase ledger (source='purchase' for purchases)
- `fateEntries` - Fate acquisition tracking
- `resourceSnapshots` - Point-in-time resource counts (ground truth)
- `abyssRuns` - (deprecated, unused)
- `goals` - User goals with checklists
- `notes` - Markdown notes with tags
- `plannedBanners` - Future banner planning
- `externalCache` - Cached API responses (Enka)
- `appMeta` - App settings and metadata

**Key Design Decisions:**
- Dates stored as ISO 8601 strings
- UUIDs for client-generated IDs
- Pity/guarantee computed by replaying pulls, not stored
- Gacha rules versioned and configurable
- Mappers for external formats (GOOD, Enka) - internal schema separate
- Historical primogems reconstructed from snapshots + wish spending
- Purchases tracked separately for F2P view toggle

---

## Key Domain Logic

### Historical Primogem Reconstruction
**File:** `src/features/ledger/domain/historicalReconstruction.ts`

Algorithm:
1. Start from latest snapshot (ground truth)
2. For each day going backwards: add back wish spending (160 primos × pulls)
3. For each day going forwards: subtract wish spending, add purchases
4. Interpolate between multiple snapshots
5. Forward projection uses daily rate calculated from pull frequency

### Gacha Probability Engine
**File:** `src/features/calculator/domain/pityEngine.ts`

Mechanics (post-5.0 Capturing Radiance):
- Base featured rate: 55% (not 50%)
- Soft pity starts at pull 74 (0.6% → 6% incremental increase)
- Hard pity at 90 (guaranteed 5★)
- After 3 consecutive 50/50 losses, 4th is guaranteed featured

---

## Implementation Tasks

### Phase 1: Foundation & Setup ✅
- [x] Initialize Vite + React + TypeScript project
- [x] Configure Tailwind CSS
- [x] Set up Dexie schema with version 1 stores
- [x] Create repository layer skeleton
- [x] Set up React Router with tab navigation
- [x] Create basic layout (header, tab nav, content area)
- [x] Set up PWA manifest and Vite PWA plugin
- [x] Initialize Zustand stores (UI state, calculator state)

### Phase 2: Character Roster ✅
- [x] Character data models & repository
- [x] Character list page (grid/list view)
- [x] Character filters & sorting
- [x] Character detail page
- [x] Build display components (weapon, artifacts, talents)
- [x] Team data models & repository
- [x] Team builder component
- [x] GOOD format mapper (import/export)
- [x] Enka mapper & API integration
- [x] Team snapshot export format
- [x] Manual character entry form
- [x] Character portraits from Enka CDN

### Phase 3: Wish Tracking ✅
- [x] Wish record models & repository
- [x] Gacha rules configuration (all banner types)
- [x] Pity computation engine
  - [x] Basic pity counting
  - [x] Guarantee tracking
  - [x] Capturing Radiance (radiant streak, 55% base, guarantee after 3)
  - [x] Weapon fate points
- [x] Unit tests for pity engine (edge cases)
- [x] Pity dashboard UI
- [x] Wish history table with computed columns
- [x] Wish URL import flow
- [x] Authkey session management
- [x] Manual wish entry (collapsible)
- [x] Statistics dashboard
- [x] Pull history chart (time-series by day/week/month)

### Phase 4: Primogem Ledger ✅
- [x] Ledger models & repository
- [x] Resource snapshot system (ground truth)
- [x] Purchase ledger with CRUD operations
- [x] Historical date picker for purchases
- [x] Transaction log (unified view)
- [x] Historical reconstruction from snapshots + wishes
- [x] Unified chart (historical + projection)
- [x] F2P view toggle
- [x] Daily rate calculation from wish frequency

### Phase 5: Pull Calculator ✅
- [x] Web Worker setup with Comlink
- [x] Analytical calculator (single target)
  - [x] Probability model implementation
  - [x] Dynamic programming solver
  - [x] Distribution curve generator
- [x] Monte Carlo simulator
  - [x] Simulation engine with seeded RNG
  - [x] Multi-target timeline builder
  - [x] Per-target pity states
  - [x] Progress reporting
- [x] Calculator UI components
  - [x] Single target form & results
  - [x] Multi-target planner interface
  - [x] Per-constellation breakdown
  - [x] Reverse calculator
  - [x] Probability charts (Recharts)
- [ ] Scenario save/compare feature
- [x] Performance optimization & testing

### Phase 6: Calendar & Goals ✅
- [x] Calendar page with reset timers
- [x] Event fetching from external API (HuTao bot)
- [x] Active/upcoming event filtering
- [x] Banner display with countdowns
- [x] Goal models & repository
- [x] Goal creation & editing
- [x] Checklist component
- [x] Goal filtering & status tracking
- [x] Note models & repository
- [x] Markdown editor integration
- [x] Note tagging & search

### Phase 7: Sync & Polish
- [x] Export all data function
- [x] Import with validation
- [x] Compression pipeline (lz-string)
- [x] Encryption/decryption (Web Crypto API)
- [x] QR code generation (with size limit handling)
- [ ] QR code scanning
- [x] Merge strategy implementations
- [x] Import UI with progress
- [x] Settings page
- [x] Backup reminders
- [x] UI polish & responsive design
- [x] Offline mode testing
- [x] Performance audit
- [x] Service worker caching strategy

### Phase 8: Testing & Documentation
- [x] Unit tests for critical paths
  - [x] Pity engine edge cases
  - [x] Probability calculations
  - [x] Format mappers
  - [ ] Merge logic
- [ ] Regression test fixtures
- [ ] Integration tests
- [ ] User documentation
- [ ] Developer setup guide

---

## Sprint History

### Sprint 1 - Calculator Fixes (Critical Path) ✅ COMPLETED
1. Fixed Capturing Radiance mechanics (55% base rate, guarantee after 3 losses)
2. Verified single-target calculator accuracy
3. Fixed wish sum partial values (use Math.floor)
4. Fixed Enka duplicate character imports (bulkUpsert)

### Sprint 2 - Multi-Target & Reverse Calculator ✅ COMPLETED
1. Fixed multi-target calculator (per-target pity states)
2. Fixed reverse calculator (compound probability math)
3. Added character portraits
4. Added per-constellation breakdown
5. Added "Nothing" probability display
6. Fixed max level display offset

### Sprint 3 - Charts & Visualization ✅ COMPLETED
1. Historical pulls chart (PullHistoryChart.tsx)
   - Time-series by day/week/month
   - Cumulative and per-period modes
   - Fixed empty week gaps
2. Primogem projection chart
   - Forward projection based on daily rate
3. Hide manual entry sections (collapsible by default)
4. **Major Primogem Tracker Redesign:**
   - Unified workflow (snapshots + purchases + wish reconstruction)
   - Purchase ledger with add/edit/delete
   - Transaction log
   - Historical + projection unified chart
   - F2P view toggle
   - Removed manual primogem entry, commission/welkin buttons, IncomeTimeline

---

## Future Work

### Sprint 4 - UX Polish & Features ✅ COMPLETED
1. Redesigned Goals as simple sticky notes (colored, minimal UI)
2. Added theme support (light/dark/system) with persistence
3. Added scenario save/compare for multi-target calculator
4. Removed debug console.log statements from PurchaseLedger and LedgerPage

### Sprint 5 - Cross-Device Sync ✅ COMPLETED
1. Import backup with validation and schema compatibility
2. Three merge strategies: Replace All, Newer Wins, Keep Local
3. LZ-String compression for reduced payload size
4. AES-GCM encryption with passphrase protection (PBKDF2 key derivation)
5. Copy/paste text transfer with wrapped format
6. QR code generation for small payloads (<2KB)
7. Unified DataTransfer UI for export/import between devices

### Sprint 6 - Future Features
1. Artifact optimizer for GOOD format
2. Spiral Abyss log
3. QR code scanning (camera import)
### Sprint 5 - Calendar Page ✅ COMPLETED
1. Removed Spiral Abyss feature (too tedious to maintain)
2. Added Calendar page with reset timers:
   - Daily reset (4 AM server time)
   - Weekly reset (Monday 4 AM)
   - Spiral Abyss reset (1st & 16th)
   - Monthly shop reset
3. Event fetching from HuTao bot GitHub JSON
4. Active/upcoming event display with type filtering
5. Banner tracking with end countdowns
6. All times calculated for US Server (UTC-5)

### Sprint 6 - Dashboard & Inventory Management ✅ COMPLETED
1. Added dashboard home page with account overview
2. Implemented banner planner with primogem tracking
3. Added resin tracker to ascension planner
4. Improved data integration across features
5. Removed redundant features and streamlined UI

### Sprint 7 - Architecture Review & Refactoring ✅ COMPLETED
**Critical Performance Optimizations:**
1. WishImport component refactoring (591 lines)
   - Removed all 15 console.log statements
   - Converted 7 useState to single useReducer with typed actions
   - Added useCallback to 10 event handlers
   - Added useMemo to 3 computed values

2. MultiTargetCalculator optimization (955 lines)
   - Added useCallback to 13 event handlers (up from 1)
   - Added useMemo for canCalculate
   - Converted setState to functional updates

3. useResources reactive pattern fix
   - Replaced manual useState + useEffect with useLiveQuery
   - Added useMemo for all calculated values
   - Automatic database reactivity

**Medium Priority - Architecture Improvements:**
4. Repository extraction
   - Created artifacts/repo/artifactRepo.ts (80 lines)
   - Created weapons/repo/weaponRepo.ts (75 lines)
   - Reduced roster/repo/inventoryRepo.ts from 215 → 70 lines

5. Cross-feature resource service
   - Created lib/services/resourceService.ts
   - Moved getAvailablePullsFromTracker() from calculator/selectors
   - Converted calculator/selectors/availablePulls.ts to re-export wrapper
   - Reduced cross-feature coupling

6. Folder structure standardization
   - Removed unused roster/repo/hooks/ directory
   - Removed unused wishes/repo/hooks/ directory
   - Standardized hooks/ location across all features

**Low Priority - Type Safety:**
7. TypeScript improvements
   - Added proper types to 4 Recharts custom tooltips
   - Eliminated 'any' types in tooltip components
   - Added TooltipPayload and CustomTooltipProps interfaces

### Sprint 8 - Genshin-DB API Integration ✅ COMPLETED
**Character-Specific Material Names:**
1. Integrated genshin-db-api.vercel.app for fetching character ascension/talent data
2. New service: `lib/services/genshinDbService.ts` (470 lines)
   - API client for character and talent endpoints
   - 7-day IndexedDB caching using externalCache table
   - Graceful offline fallback with stale cache support
   - Processes raw API responses into structured material data
3. New utility: `lib/utils/materialNormalization.ts` (188 lines)
   - Flexible material key matching for Irminsul inventory
   - Handles variations: "Hero's Wit", "HeroesWit", "heros_wit"
   - Identifies material tiers (1-4 for gems, 1-3 for books/commons)
4. New types: `features/planner/domain/characterMaterials.ts` (187 lines)
   - TypeScript types for API responses and processed data
   - Material category constants for identification
5. Modified `ascensionCalculator.ts`:
   - Made `calculateAscensionSummary()` async to fetch API data
   - New `buildMaterialsWithApiData()` helper function
   - Enhanced MaterialRequirement with source & availability fields
   - Returns isStale and error status for UI warnings
6. Modified `PlannerPage.tsx`:
   - Async state management with useEffect for API calls
   - Loading indicator while fetching API data
   - Warning banner when using stale cached data
   - Displays domain availability days for talent books

**Bug Fix (Sprint 8.1):**
- Fixed API response type mismatch: genshin-db API returns `ascend1`/`lvl2` as direct arrays, not `{cost, items}` objects
- Updated `GenshinDbCharacterResponse` and `GenshinDbTalentResponse` types
- Fixed `processCharacterMaterials()` to iterate directly on arrays instead of `.items`

### Sprint 9 - Future Features
1. Artifact optimizer for GOOD format
2. QR code scanning (camera import)

---

## File Structure

```
src/
├── app/                    # App shell, routing, layout
├── components/
│   ├── common/            # Header, TabNav, etc.
│   └── ui/                # Button, Input, Select, Modal, etc.
├── db/
│   └── schema.ts          # Dexie database schema
├── features/
│   ├── artifacts/         # Artifact inventory
│   │   └── repo/          # artifactRepo (standalone inventory)
│   ├── calculator/        # Pull probability calculators
│   │   ├── components/    # SingleTarget, MultiTarget, Reverse calculators
│   │   ├── domain/        # pityEngine, analyticalCalc
│   │   ├── selectors/     # availablePulls (re-exports from resourceService)
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
│   │   ├── components/    # WishHistory, PityDashboard, PullHistoryChart, WishImport
│   │   ├── domain/        # wishReplay, wishAnalyzer, wishStatistics
│   │   ├── hooks/         # useWishes
│   │   ├── pages/         # WishHistoryPage
│   │   └── repo/          # wishRepo
│   ├── calendar/          # Calendar & Timers
│   │   ├── components/    # ResetTimers, EventList
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

## Open Questions / Ambiguities

1. **UI Framework Details**: Currently using custom Tailwind components. Consider shadcn/ui for more polished components.

2. **Markdown Editor**: Using basic textarea + react-markdown. Could upgrade to TipTap for richer editing.

3. **Date Handling**: All dates stored as ISO 8601 UTC strings, displayed in user's local time.

4. **Gacha Rules Updates**: Rules are versioned. Future game updates would require adding new version.

5. **Mobile UX**: Responsive design implemented. Consider swipe gestures for tab navigation.

6. **Error Handling**: Basic error states for API failures. Could add retry logic and offline queue.

---

## Notes

- **Privacy**: No server-side storage, all data stays local
- **Offline First**: Full functionality without internet
- **Performance**: Web Workers mandatory for simulations (don't block UI)
- **Versioning**: Schema migrations via Dexie versions
- **Security**: Authkeys session-only by default

---

## Recent Changes Log

**2026-01 (Sprint 8.1 - Genshin-DB Bug Fix):**
- Fixed API response type mismatch causing placeholder names to appear
- genshin-db API returns ascend/lvl fields as direct arrays, not {cost, items} objects
- Updated GenshinDbCharacterResponse and GenshinDbTalentResponse types
- Fixed processCharacterMaterials() array iteration pattern

**2026-01 (Sprint 8 - Genshin-DB Integration):**
- Added genshin-db API integration for character-specific material names
- New genshinDbService.ts with 7-day IndexedDB caching
- New materialNormalization.ts for flexible inventory key matching
- New characterMaterials.ts with TypeScript types for API data
- Made ascensionCalculator async with API data fetching
- Updated PlannerPage with async state and loading indicators
- Added stale data warning banner when using offline cache

**2026-01 (Sprint 7 Completion - Architecture Review):**
- Comprehensive architecture review and refactoring completed
- Performance: WishImport (useReducer, 10 useCallback, removed 15 console.logs)
- Performance: MultiTargetCalculator (13 useCallback hooks, functional updates)
- Performance: useResources converted to reactive useLiveQuery pattern
- Architecture: Extracted artifactRepo and weaponRepo from roster feature
- Architecture: Created shared resourceService in lib/services/
- Architecture: Standardized folder structure (removed nested repo/hooks/)
- Type Safety: Added TypeScript types to all Recharts tooltips (4 components)
- Reduced cross-feature coupling and improved code organization

**2026-01 (Sprint 6 Completion):**
- Added dashboard home page with account overview
- Implemented banner planner with primogem tracking
- Added resin tracker to ascension planner
- Improved data integration and removed redundant features

**2026-01 (Sprint 5 Completion):**
- Removed Spiral Abyss feature (replaced with Calendar)
- Added Calendar page with live reset timers
- Reset calculations based on US Server (UTC-5)
- Event fetching from HuTao bot GitHub repository
- Active/upcoming event display with type badges
- Banner tracking with countdown timers
- Cached event data with 1-hour TTL
- Graceful fallback to stale cache on network errors

**2024-01 (Sprint 4 Completion):**
- Redesigned Goals section as simple colored sticky notes
- Added theme support (light/dark/system) with localStorage persistence
- Added scenario save/compare feature for multi-target calculator
- Removed debug console.log statements from PurchaseLedger and LedgerPage
- Database schema updated to v2 with calculatorScenarios table

**2024-01 (Sprint 3 Completion):**
- Redesigned Primogem Tracker with unified snapshot-based workflow
- Added historical reconstruction from wish spending
- Added purchase ledger with CRUD
- Added unified chart (historical + projection)
- Removed manual primogem tracking complexity
- Fixed pull history chart empty week gaps
- Fixed purchased primogems display bug

**2024-01 (Sprint 3 Bug Fixes):**
- Fixed: Standard banner pulls now excluded from all calculations (only intertwined fates counted)
- Fixed: Daily rate calculation uses full lookback period as denominator (not just wish span)
- Added: Configurable "Rate window" selector (14/30/60/90 days) for daily income calculation
- Fixed: Purchase ledger delete functionality (browser was blocking confirm dialog)

---

## Code Quality Standards

**Performance Best Practices:**
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive computations and derived state
- Use `useReducer` for complex state with multiple related values
- Use `useLiveQuery` from dexie-react-hooks for reactive database queries
- Avoid manual useEffect + useState patterns when useLiveQuery is available

**Architecture Principles:**
- Feature-based organization (domain, repo, hooks, components, pages)
- Repository pattern for all database access
- Shared services in `/lib/services` for cross-feature logic
- Clear ownership boundaries between features
- No circular dependencies between features

**TypeScript Guidelines:**
- Eliminate `any` types - use proper interfaces
- Define payload types for all component props
- Use discriminated unions for complex state
- Export types alongside implementations
